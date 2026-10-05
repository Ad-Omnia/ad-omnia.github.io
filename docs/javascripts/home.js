(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var HUES = ["#2ee8c9", "#3d8bff", "#a03cff"];

  function clamp(v, lo, hi) {
    return Math.min(hi === undefined ? 1 : hi, Math.max(lo || 0, v));
  }

  function seg(p, a, b) {
    return clamp((p - a) / (b - a));
  }

  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
  function unit(a) { var l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function fmt(p) { return p[0].toFixed(2) + " " + p[1].toFixed(2); }
  function toDeg(v) { return (Math.atan2(v[1], v[0]) * 180) / Math.PI; }

  function onRing(L, deg) {
    var r = (deg * Math.PI) / 180;
    return [L.c[0] + L.r * Math.cos(r), L.c[1] + L.r * Math.sin(r)];
  }

  function hits(p, d, L) {
    var f = sub(p, L.c);
    var b = dot(f, d);
    var disc = b * b - (dot(f, f) - L.r * L.r);
    if (disc <= 0) return null;
    var s = Math.sqrt(disc);
    return [-b - s, -b + s];
  }

  function reflect(d, n) {
    return sub(d, mul(n, 2 * dot(d, n)));
  }

  function ringArc(L, a0, a1) {
    while (a1 < a0) a1 += 360;
    return "M " + fmt(onRing(L, a0)) + " A " + L.r + " " + L.r + " 0 " +
      (a1 - a0 > 180 ? 1 : 0) + " 1 " + fmt(onRing(L, a1));
  }

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG_NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function lensOf(c, r, inner) {
    return { c: c, r: r, inner: inner || 0, openings: [] };
  }

  function Path(track) {
    this.track = track;
    this.parts = [];
    this.total = 0;
  }

  Path.prototype.line = function (a, b) {
    this.parts.push({ d: "M " + fmt(a) + " L " + fmt(b), start: this.total, length: dist(a, b) });
    this.total += dist(a, b);
  };

  Path.prototype.curve = function (e, c1, c2, x) {
    this.parts.push({
      d: "M " + fmt(e) + " C " + fmt(c1) + " " + fmt(c2) + " " + fmt(x),
      start: this.total,
      length: bezLength(e, c1, c2, x)
    });
    this.total += bezLength(e, c1, c2, x);
  };

  Path.prototype.open = function (L, point, dir, width) {
    var n = unit(sub(point, L.c));
    var cos = Math.max(Math.abs(dot(n, dir)), 0.22);
    var o = {
      deg: toDeg(n),
      gap: Math.min((((width || 6) + 5) / cos / L.r) * (180 / Math.PI), 22),
      at: this.total,
      track: this.track
    };
    L.openings.push(o);
    return o;
  };

  function bez(e, c1, c2, x, t) {
    var u = 1 - t;
    return [
      u * u * u * e[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x[0],
      u * u * u * e[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * x[1]
    ];
  }

  function bezLength(e, c1, c2, x) {
    var total = 0, prev = e;
    for (var i = 1; i <= 24; i++) {
      var q = bez(e, c1, c2, x, i / 24);
      total += dist(prev, q);
      prev = q;
    }
    return total;
  }

  function bend(L, e, d, x, out, shape) {
    var k = dist(e, x) * 0.42;
    if (shape === "arc") {
      var turn = Math.acos(clamp(dot(d, out), -1, 1));
      if (turn > 0.05) k = dist(e, x) * 0.48 * Math.tan(turn / 4) / Math.sin(turn / 2);
    }
    var c1 = add(e, mul(d, k));
    var c2 = sub(x, mul(out, k));
    for (var i = 1; i < 20; i++) {
      var t = i / 20;
      var q = dist(bez(e, c1, c2, x, t), L.c);
      var edge = t > 0.2 && t < 0.8 ? 12 : 0.5;
      if (q > L.r - edge || q < L.inner) return null;
    }
    return { e: e, c1: c1, c2: c2, x: x, out: out };
  }

  function bendToward(L, e, d, aim, reach, shape) {
    var best = null;
    for (var a = 0; a < 360; a += 2) {
      var x = onRing(L, a);
      if (dist(x, e) < L.r * 0.5) continue;
      var target = aim(x);
      if (!target) continue;
      var out = unit(sub(target, x));
      if (dot(out, unit(sub(x, L.c))) < 0.3) continue;
      var b = bend(L, e, d, x, out, shape);
      if (!b) continue;
      var chord = unit(sub(x, e));
      var asym = shape === "arc"
        ? Math.abs(Math.acos(clamp(dot(d, chord), -1, 1)) - Math.acos(clamp(dot(chord, out), -1, 1))) * 4
        : 0;
      var v = Math.acos(clamp(dot(d, out), -1, 1)) + (target.cost || 0) + asym +
        (1 - dot(out, unit(sub(x, L.c)))) * 1.6 - (reach || 0) * dist(e, x) / L.r;
      if (!best || v < best.v) { best = b; best.v = v; }
    }
    return best;
  }

  function missBy(p, d, target) {
    var v = sub(target, p);
    if (dot(v, d) <= 0) return 1e6;
    return Math.abs(cross(d, v));
  }

  function drawRings(parent, defs, lenses, prefix, tipDeg) {
    var opens = [];
    lenses.forEach(function (L) {
      var os = L.openings.slice().sort(function (a, b) { return a.deg - b.deg; });
      if (!os.length) {
        el("circle", { class: "ad-ring", cx: L.c[0], cy: L.c[1], r: L.r }, parent);
        return;
      }
      var gaps = os.filter(function (o) { return !o.mark; });
      if (!gaps.length) {
        el("circle", { class: "ad-ring", cx: L.c[0], cy: L.c[1], r: L.r }, parent);
      }
      gaps.forEach(function (o, i) {
        var next = gaps[(i + 1) % gaps.length];
        var a0 = o.deg + o.gap;
        var a1 = next.deg - next.gap + (i === gaps.length - 1 ? 360 : 0);
        if (a1 - a0 > 0.5) el("path", { class: "ad-ring", d: ringArc(L, a0, a1) }, parent);
      });
      os.forEach(function (o) { opens.push({ o: o, L: L }); });
    });

    opens.sort(function (a, b) { return a.o.at - b.o.at; });
    return opens.map(function (x, k) {
      var o = x.o, L = x.L;
      var cap = o.mark ? null : el("path", { class: "ad-ring ad-cap", d: ringArc(L, o.deg - o.gap - 0.6, o.deg + o.gap + 0.6) }, parent);
      var pair = [HUES[k % 3], HUES[(k + 2) % 3]];
      var tips = [1, -1].map(function (side, j) {
        var a0 = o.deg + side * o.gap;
        var a1 = a0 + side * tipDeg;
        var q0 = onRing(L, a0), q1 = onRing(L, a1);
        var id = prefix + k + "-" + j;
        var g = el("linearGradient", { id: id, gradientUnits: "userSpaceOnUse",
          x1: q0[0], y1: q0[1], x2: q1[0], y2: q1[1] }, defs);
        el("stop", { offset: 0, "stop-color": pair[j] }, g);
        el("stop", { offset: 0.45, "stop-color": pair[j], "stop-opacity": 0.55 }, g);
        el("stop", { offset: 1, "stop-color": pair[j], "stop-opacity": 0 }, g);
        return el("path", { class: "ad-ring ad-tip", style: "stroke: url(#" + id + ")",
          d: side > 0 ? ringArc(L, a0, a1) : ringArc(L, a1, a0) });
      });
      return { o: o, cap: cap, tips: tips };
    });
  }

  function drawPath(parent, path, cls) {
    return path.parts.map(function (p) {
      return { node: el("path", { class: cls, d: p.d, pathLength: 1 }, parent), start: p.start, length: p.length };
    });
  }

  function setDrawn(parts, distance) {
    parts.forEach(function (p) {
      var t = clamp((distance - p.start) / p.length);
      p.node.style.strokeDashoffset = (1 - t).toFixed(4);
      p.node.style.opacity = t > 0 ? 1 : 0;
    });
  }

  function setOpened(opens, distanceOf) {
    opens.forEach(function (x) {
      var d = distanceOf(x.o);
      var lit = d >= x.o.at;
      var open = lit && !(x.o.closeAt !== undefined && d >= x.o.closeAt);
      if (x.cap) x.cap.classList.toggle("is-open", open);
      x.tips.forEach(function (t) { t.classList.toggle("is-lit", lit); });
    });
  }

  function layer(svg) {
    return { ring: el("g", {}, svg), ray: el("g", {}, svg), tip: el("g", {}, svg) };
  }

  function mountTips(g, opens) {
    opens.forEach(function (x) { x.tips.forEach(function (t) { g.appendChild(t); }); });
  }

  function fadeMask(defs, id, from, to) {
    var g = el("linearGradient", { id: id + "-g", gradientUnits: "userSpaceOnUse",
      x1: from[0], y1: from[1], x2: to[0], y2: to[1] }, defs);
    el("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": 0 }, g);
    el("stop", { offset: 1, "stop-color": "#fff" }, g);
    var m = el("mask", { id: id, maskUnits: "userSpaceOnUse", x: -800, y: -800, width: 2600, height: 2240 }, defs);
    el("rect", { x: -800, y: -800, width: 2600, height: 2240, fill: "url(#" + id + "-g)" }, m);
    return "url(#" + id + ")";
  }

  function buildScene(host) {
    host.innerHTML = "";
    var svg = el("svg", { class: "ad-scene-svg", viewBox: "0 0 1000 640", "aria-hidden": "true" });
    var defs = el("defs", {}, svg);
    var g = layer(svg);

    var A = lensOf([190, 392], 104);
    var B = lensOf([460, 134], 88);
    var C = lensOf([740, 394], 104);
    var D = lensOf([912, 190], 78);

    var peak = onRing(B, -85);
    var axis = unit(sub(peak, A.c));
    var across = [-axis[1], axis[0]];
    var focus = add(A.c, mul(axis, A.r));
    var inMask = fadeMask(defs, "ad-in", add(A.c, mul(axis, -330)), add(A.c, mul(axis, -170)));

    var sources = [-0.72, -0.36, 0, 0.36, 0.72].map(function (k, i) {
      var origin = add(add(A.c, mul(across, A.r * k)), mul(axis, -340));
      var e = add(origin, mul(axis, hits(origin, axis, A)[0]));
      var path = new Path("src" + i);
      path.line(origin, e);
      path.open(A, e, axis, 3);
      path.line(e, focus);
      return path;
    });

    var beam = new Path("beam");
    beam.open(A, focus, axis);
    var eB = add(focus, mul(axis, hits(focus, axis, B)[0]));
    beam.line(focus, eB);
    beam.open(B, eB, axis);
    beam.line(eB, peak);
    beam.open(B, peak, axis);
    var d2 = reflect(axis, unit(sub(peak, B.c)));
    var xB = add(peak, mul(d2, hits(peak, d2, B)[1]));
    beam.line(peak, xB);
    beam.open(B, xB, d2);
    var endReflect = beam.total;

    var eC = add(xB, mul(d2, hits(xB, d2, C)[0]));
    beam.line(xB, eC);
    beam.open(C, eC, d2);

    var ex = null;
    [0, 0.3, -0.3, 0.5, -0.5].some(function (k) {
      return [0.2, 0.1, 0].some(function (inner) {
        C.inner = C.r * inner;
        ex = bendToward(C, eC, d2, function () { return add(D.c, [0, D.r * k]); }, 0.35, "arc");
        return !!ex;
      });
    });
    beam.curve(ex.e, ex.c1, ex.c2, ex.x);
    beam.open(C, ex.x, ex.out);
    var endCurve = beam.total;

    var d3 = ex.out;
    var eD = add(ex.x, mul(d3, hits(ex.x, d3, D)[0]));
    beam.line(ex.x, eD);
    beam.open(D, eD, d3);
    var endExit = beam.total;

    var outMask = fadeMask(defs, "ad-out", [1250, 0], [1060, 0]);
    var fans = [-32, -16, 0, 16, 32].map(function (spread, i) {
      var a = (toDeg(d3) + spread) * Math.PI / 180;
      var dir = [Math.cos(a), Math.sin(a)];
      var x = add(eD, mul(dir, hits(eD, dir, D)[1]));
      var path = new Path("fan" + i);
      path.line(eD, x);
      path.open(D, x, dir, 3);
      path.line(x, add(x, mul(dir, 460)));
      return path;
    });

    var srcParts = sources.map(function (s) {
      var parts = drawPath(g.ray, s, "ad-ray ad-src");
      parts[0].node.setAttribute("mask", inMask);
      return parts;
    });
    var beamParts = drawPath(g.ray, beam, "ad-ray");
    var fanParts = fans.map(function (f, i) {
      var parts = drawPath(g.ray, f, "ad-ray ad-src");
      parts[1].node.setAttribute("mask", outMask);
      return parts;
    });

    var opens = drawRings(g.ring, defs, [A, B, C, D], "ad-s", 30);
    mountTips(g.tip, opens);
    host.appendChild(svg);

    var srcLen = Math.max.apply(null, sources.map(function (s) { return s.total; }));
    var fanLen = Math.max.apply(null, fans.map(function (f) { return f.total; }));

    return {
      update: function (p) {
        var ds = ease(seg(p, 0.02, 0.24)) * srcLen;
        var local = sources.map(function (s) { return ds - (srcLen - s.total); });
        sources.forEach(function (s, i) { setDrawn(srcParts[i], local[i]); });

        var db = -1;
        if (p >= 0.25) db = ease(seg(p, 0.27, 0.5)) * endReflect;
        if (p >= 0.53) db = endReflect + ease(seg(p, 0.54, 0.72)) * (endCurve - endReflect);
        if (p >= 0.75) db = endCurve + ease(seg(p, 0.76, 0.9)) * (endExit - endCurve);
        setDrawn(beamParts, db);

        var df = p >= 0.9 ? ease(seg(p, 0.9, 0.98)) * fanLen : -1;
        fans.forEach(function (f, i) { setDrawn(fanParts[i], df); });

        setOpened(opens, function (o) {
          if (o.track === "beam") return db;
          if (o.track.indexOf("fan") === 0) return df;
        return local[+o.track.slice(3)];
        });

      }
    };
  }

  var TEAM_TYPES = ["bend", "bend", "reflect", "bend", "bend"];
  var TEAM_SIDES = [1, -1, 1, -1, 1];

  function buildTeam(team, prefix) {
    var old = team.querySelector(".ad-team-rays");
    if (old) old.remove();

    var avatars = Array.prototype.slice.call(team.querySelectorAll(".ad-avatar"));
    if (avatars.length < 2) return null;

    var W = team.offsetWidth;
    var H = team.offsetHeight;
    var rect = team.getBoundingClientRect();

    var lenses = avatars.map(function (a) {
      var x = 0, y = 0, node = a;
      while (node && node !== team) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      var ra = a.offsetWidth / 2;
      return lensOf([x + ra, y + a.offsetHeight / 2], ra * 1.95, ra + 8);
    });

    var n = lenses.length;
    var span = sub(lenses[n - 1].c, lenses[0].c);
    var horizontal = Math.abs(span[0]) > Math.abs(span[1]);
    var across = horizontal ? [0, 1] : [1, 0];

    var spread = 0.5;
    function anchor(i) {
      var L = lenses[i];
      return add(L.c, mul(across, (L.inner + (L.r - L.inner) * spread) * TEAM_SIDES[i % TEAM_SIDES.length]));
    }

    var start, finish;
    if (horizontal) {
      start = [-rect.left - 12, lenses[0].c[1] - lenses[0].r * 1.6];
      finish = [W + window.innerWidth - rect.right + 12, lenses[n - 1].c[1] + lenses[n - 1].r * 1.6];
    } else {
      var lastSide = TEAM_SIDES[(n - 1) % TEAM_SIDES.length];
      start = [lenses[0].c[0] + lenses[0].r * 0.95, lenses[0].c[1] - lenses[0].r - 90];
      finish = [lenses[n - 1].c[0] - lenses[n - 1].r * 0.4 * lastSide, lenses[n - 1].c[1] + lenses[n - 1].r + 90];
    }

    function reflectThrough(L, p, d) {
      var t = hits(p, d, L);
      if (!t || t[0] < 0) return null;
      var e = add(p, mul(d, t[0]));
      if (Math.abs(cross(d, sub(L.c, e))) < L.inner) return null;
      var w = add(p, mul(d, t[1]));
      var d2 = reflect(d, unit(sub(w, L.c)));
      var x = add(w, mul(d2, hits(w, d2, L)[1]));
      return { e: e, w: w, x: x, d: d2, din: d };
    }

    function through(i, p, d, path) {
      var L = lenses[i];
      var t = hits(p, d, L);
      if (!t || t[0] < 0) return null;
      var e = add(p, mul(d, t[0]));

      if (TEAM_TYPES[i % TEAM_TYPES.length] === "reflect") {
        var r = reflectThrough(L, p, d);
        if (!r) return null;
        path.line(p, e); path.open(L, e, d);
        path.line(e, r.w); path.open(L, r.w, d);
        path.line(r.w, r.x); path.open(L, r.x, r.d);
        return { p: r.x, d: r.d };
      }

      var last = i === n - 1;
      var nextReflect = !last && TEAM_TYPES[(i + 1) % TEAM_TYPES.length] === "reflect";
      var best = bendToward(L, e, d, function (x) {
        if (last) return finish;
        if (!nextReflect) return anchor(i + 1);
        var N = lenses[i + 1];
        var goal = i + 2 < n ? anchor(i + 2) : finish;
        var toward = unit(sub(N.c, x));
        var perp = [-toward[1], toward[0]];
        var pick = null;
        for (var s = -0.9; s <= 0.9; s += 0.05) {
          var q = add(N.c, mul(perp, N.r * s));
          var r = reflectThrough(N, x, unit(sub(q, x)));
          if (!r) continue;
          var m = missBy(r.x, r.d, goal);
          if (!pick || m < pick.m) pick = { q: q, m: m };
        }
        if (!pick) return null;
        var target = pick.q.slice();
        target.cost = pick.m / 40;
        return target;
      });
      if (!best) return null;
      path.line(p, e); path.open(L, e, d);
      path.curve(best.e, best.c1, best.c2, best.x); path.open(L, best.x, best.out);
      return { p: best.x, d: best.out };
    }

    var path = null, p, d;
    [0.5, 0.35, 0.65, 0.2, 0.8].some(function (k) {
      spread = k;
      var attempt = new Path("team");
      lenses.forEach(function (L) { L.openings = []; });
      p = start;
      d = unit(sub(anchor(0), start));
      for (var i = 0; i < n; i++) {
        var r = through(i, p, d, attempt);
        if (!r) return false;
        p = r.p;
        d = r.d;
      }
      path = attempt;
      return true;
    });
    if (!path) return null;
    var tail = horizontal ? Math.max(40, (finish[0] - p[0]) / Math.max(Math.abs(d[0]), 0.25)) + 120 : 90;
    path.line(p, add(p, mul(d, tail)));

    var svg = el("svg", {
      class: "ad-team-rays",
      width: W,
      height: H,
      viewBox: "0 0 " + W + " " + H,
      "aria-hidden": "true"
    });
    var defs = el("defs", {}, svg);
    var g = layer(svg);
    var parts = drawPath(g.ray, path, "ad-ray");
    var opens = drawRings(g.ring, defs, lenses, prefix, 30);
    mountTips(g.tip, opens);
    team.appendChild(svg);
    return { parts: parts, opens: opens, total: path.total };
  }

  function showTeam(state, distance) {
    setDrawn(state.parts, distance);
    setOpened(state.opens, function () { return distance; });
  }

  function updateTeam(team, state) {
    if (!state) return;
    var r = team.getBoundingClientRect();
    var vh = window.innerHeight;
    var room = document.documentElement.scrollHeight - vh - window.scrollY;
    var from = Math.min(vh * 0.92, r.top + window.scrollY);
    var to = Math.max(vh * 0.42 - r.height * 0.55, r.top - room);
    var q = from - to < 1 ? 1 : clamp((from - r.top) / (from - to));
    showTeam(state, ease(q) * state.total);
  }

  function offsetIn(node, root) {
    var x = 0, y = 0;
    while (node && node !== root) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return [x, y];
  }

  function buildJourney(timeline) {
    var old = timeline.querySelector(".ad-journey-rays");
    if (old) old.remove();
    var dots = Array.prototype.slice.call(timeline.querySelectorAll(".ad-timeline-dot"));
    if (!dots.length) return null;
    timeline.classList.add("is-lensed");
    var phaseHues = ["var(--ad-teal)", "var(--ad-blue)", "var(--ad-blue-violet)", "var(--ad-violet)"];
    Array.prototype.slice.call(timeline.querySelectorAll(".ad-timeline-phase")).forEach(function (ph, i) {
      ph.style.setProperty("--c", phaseHues[Math.min(i, phaseHues.length - 1)]);
    });

    var W = timeline.offsetWidth;
    var H = timeline.offsetHeight;
    var lenses = dots.map(function (dot) {
      var o = offsetIn(dot, timeline);
      return lensOf([o[0], o[1] + dot.offsetHeight / 2], 20);
    });
    var x = lenses[0].c[0];
    var down = [0, 1];
    var path = new Path("journey");
    var prev = [x, 0];
    lenses.forEach(function (L) {
      var top = [x, L.c[1] - L.r];
      var bottom = [x, L.c[1] + L.r];
      path.line(prev, top);
      path.open(L, top, down, 4);
      path.line(top, bottom);
      path.open(L, bottom, down, 4);
      prev = bottom;
    });
    path.line(prev, [x, H]);

    var svg = el("svg", {
      class: "ad-journey-rays",
      width: W,
      height: H,
      viewBox: "0 0 " + W + " " + H,
      "aria-hidden": "true"
    });
    var defs = el("defs", {}, svg);
    var g = layer(svg);
    var parts = drawPath(g.ray, path, "ad-ray");
    var opens = drawRings(g.ring, defs, lenses, "ad-j-", 26);
    mountTips(g.tip, opens);
    timeline.insertBefore(svg, timeline.firstChild);
    return { parts: parts, opens: opens, total: path.total };
  }

  function updateJourney(timeline, state, full) {
    if (!state) return;
    var r = timeline.getBoundingClientRect();
    var vh = window.innerHeight;
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    var progress = clamp(window.scrollY / maxScroll);
    var topAtEnd = r.top + window.scrollY - maxScroll;
    var shortfall = Math.max(0, state.total - (vh * 0.62 - topAtEnd));
    var head = full ? state.total
      : clamp(vh * 0.62 - r.top + shortfall * Math.pow(progress, 3), 0, state.total);
    setDrawn(state.parts, head);
    setOpened(state.opens, function () { return head; });
  }

  function warpField() {
    var splash = document.createElement("div");
    splash.className = "ad-splash";
    splash.setAttribute("aria-hidden", "true");
    splash.innerHTML = '<span class="ad-blob ad-blob--blue"></span>' +
      '<span class="ad-blob ad-blob--violet"></span><span class="ad-blob ad-blob--teal"></span>';
    document.body.appendChild(splash);

    var canvas = document.createElement("canvas");
    canvas.className = "ad-warp";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var hues = ["46,232,201", "61,139,255", "160,60,255"];
    var stars = [];
    for (var i = 0; i < 130; i++) {
      stars.push({ a: Math.random() * Math.PI * 2, d: Math.random(), z: 0.35 + Math.random() * 0.65, c: hues[i % 3] });
    }
    var w = 0, h = 0, reach = 0;
    function size() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      reach = Math.hypot(w, h) / 2;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    size();

    var last = window.scrollY, boost = 0, raf = 0, prev = performance.now();
    function draw(now) {
      var dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      var dy = Math.abs(window.scrollY - last);
      last = window.scrollY;
      boost = Math.min(6, boost * 0.92 + dy * 0.06);
      var velocity = 0.18 + boost * 0.35;
      var cx = w / 2, cy = h / 2;
      var dark = document.body.getAttribute("data-md-color-scheme") === "slate";
      ctx.clearRect(0, 0, w, h);
      stars.forEach(function (st) {
        st.d += velocity * st.z * (st.d + 0.06) * dt;
        if (st.d > 1.05) {
          st.d = 0.02 + Math.random() * 0.12;
          st.a = Math.random() * Math.PI * 2;
        }
        var len = Math.min(reach * 0.45, (14 + velocity * 90) * st.z * (st.d + 0.15));
        var r1 = st.d * reach, r0 = Math.max(0, r1 - len);
        var cos = Math.cos(st.a), sin = Math.sin(st.a);
        var x1 = cx + cos * r1, y1 = cy + sin * r1;
        var x0 = cx + cos * r0, y0 = cy + sin * r0;
        var alpha = (dark ? 0.6 : 0.5) * st.z * Math.min(1, st.d * 4);
        var grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, "rgba(" + st.c + ",0)");
        grad.addColorStop(1, "rgba(" + st.c + "," + alpha.toFixed(3) + ")");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8 + st.z * 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", size);
    return function () {
      window.removeEventListener("resize", size);
      if (raf) cancelAnimationFrame(raf);
      canvas.remove();
      splash.remove();
    };
  }

  function updateStory(story, chapters, scene) {
    var r = story.getBoundingClientRect();
    var p = clamp(-r.top / (r.height - window.innerHeight));
    var step = p < 0.26 ? 0 : p < 0.53 ? 1 : p < 0.75 ? 2 : 3;
    story.style.setProperty("--p", p.toFixed(4));
    chapters.forEach(function (c, i) { c.classList.toggle("is-active", i === step); });
    if (scene) scene.update(p);
  }

  function replayingLogo(hero) {
    var img = hero.querySelector(".ad-hero-logo img");
    if (!img || !window.fetch) return null;
    var svg = null, started = performance.now(), left = false, alive = true;

    fetch(img.currentSrc || img.src).then(function (r) { return r.text(); }).then(function (text) {
      if (!alive || !img.isConnected) return;
      var holder = document.createElement("div");
      holder.innerHTML = text;
      svg = holder.querySelector("svg");
      if (!svg) return;
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", img.alt);
      var elapsed = (performance.now() - started) / 1000;
      img.replaceWith(svg);
      svg.setCurrentTime(elapsed);
    }).catch(function () {});

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) {
          left = true;
          return;
        }
        if (left && svg && performance.now() - started > 5200) {
          svg.setCurrentTime(0);
          svg.unpauseAnimations();
          started = performance.now();
        }
        left = false;
      });
    }, { threshold: 0 });
    io.observe(hero);

    return function () {
      alive = false;
      io.disconnect();
    };
  }

  function safely(fn) {
    try {
      return fn();
    } catch (err) {
      if (window.console) console.error(err);
      return null;
    }
  }

  var cleanup = null;

  function setup() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    var story = document.querySelector(".ad-story");
    var host = document.querySelector(".ad-scene");
    var teams = Array.prototype.slice.call(document.querySelectorAll(".ad-team")).map(function (node, i) {
      return { node: node, prefix: "ad-t" + i + "-", state: null, size: "" };
    });
    var reveals = document.querySelectorAll(".ad-reveal");
    var timeline = document.querySelector(".ad-timeline");
    if (!story && !teams.length && !reveals.length && !timeline) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var scene = host ? safely(function () { return buildScene(host); }) : null;
    teams.forEach(function (t) { t.state = safely(function () { return buildTeam(t.node, t.prefix); }); });
    var journey = timeline ? safely(function () { return buildJourney(timeline); }) : null;

    if (reduce) {
      reveals.forEach(function (x) { x.classList.add("is-visible"); });
      if (scene) scene.update(0.99);
      teams.forEach(function (t) { if (t.state) showTeam(t.state, t.state.total); });
      if (journey) updateJourney(timeline, journey, true);
      return;
    }

    var hero = document.querySelector(".ad-hero");
    var stopLogo = hero ? safely(function () { return replayingLogo(hero); }) : null;
    var stopWarp = timeline ? safely(warpField) : null;

    var chapters = story ? Array.prototype.slice.call(story.querySelectorAll(".ad-chapter")) : [];
    if (story) story.classList.add("is-live");

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (x) { io.observe(x); });

    function frame() {
      if (story) updateStory(story, chapters, scene);
      teams.forEach(function (t) { updateTeam(t.node, t.state); });
      if (journey) updateJourney(timeline, journey);
    }

    var raf = 0;
    function loop() {
      frame();
      raf = requestAnimationFrame(loop);
    }

    var ro = null;
    if (teams.length && "ResizeObserver" in window) {
      ro = new ResizeObserver(function () {
        teams.forEach(function (t) {
          var now = t.node.offsetWidth + "x" + t.node.offsetHeight;
          if (now === t.size) return;
          t.size = now;
          t.state = safely(function () { return buildTeam(t.node, t.prefix); });
        });
      });
      teams.forEach(function (t) { ro.observe(t.node); });
    }
    var roJourney = null;
    if (timeline && "ResizeObserver" in window) {
      var journeySize = "";
      roJourney = new ResizeObserver(function () {
        var now = timeline.offsetWidth + "x" + timeline.offsetHeight;
        if (now === journeySize) return;
        journeySize = now;
        journey = safely(function () { return buildJourney(timeline); });
      });
      roJourney.observe(timeline);
    }

    raf = requestAnimationFrame(loop);

    cleanup = function () {
      cancelAnimationFrame(raf);
      io.disconnect();
      if (ro) ro.disconnect();
      if (stopLogo) stopLogo();
      if (stopWarp) stopWarp();
      if (roJourney) roJourney.disconnect();
    };
  }

  if (window.document$) {
    window.document$.subscribe(setup);
  } else {
    document.addEventListener("DOMContentLoaded", setup);
  }
})();

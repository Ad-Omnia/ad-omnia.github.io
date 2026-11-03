(function () {
  "use strict";

  function stopAll(root, except) {
    Array.prototype.forEach.call(root.querySelectorAll(".ad-video"), function (card) {
      if (card === except) return;
      var v = card.querySelector("video");
      if (v && !v.paused) v.pause();
      if (card._reset) card._reset();
    });
  }

  function bind(card) {
    var play = card.querySelector(".ad-video-play");
    if (!play || play.dataset.ready) return;
    play.dataset.ready = "1";
    var video = card.querySelector("video");

    play.addEventListener("click", function () {
      stopAll(document, card);
      if (video) {
        video.controls = true;
        play.remove();
        video.play();
        return;
      }
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(play.dataset.youtube) + "?autoplay=1&rel=0";
      frame.title = play.getAttribute("aria-label");
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      play.replaceWith(frame);
      card._reset = function () {
        card._reset = null;
        frame.replaceWith(play);
      };
    });

    if (video) video.addEventListener("play", function () { stopAll(document, card); });
  }

  function mount(section) {
    var track = section.querySelector(".ad-videos");
    var cards = Array.prototype.slice.call(track.querySelectorAll(".ad-video"));
    var bar = section.querySelector(".ad-videos-bar");
    var prev = section.querySelector(".ad-videos-prev");
    var next = section.querySelector(".ad-videos-next");
    var dotsHost = section.querySelector(".ad-videos-dots");
    var dots = [];
    var many = cards.length > 1;

    bar.hidden = !many;
    prev.hidden = !many;
    next.hidden = !many;
    if (!many) return function () {};

    function step() {
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }

    function current() {
      return Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / Math.max(1, step()))));
    }

    function go(i) {
      var n = cards.length;
      var target = ((i % n) + n) % n;
      stopAll(section, null);
      track.scrollTo({ left: target * step(), behavior: "smooth" });
    }

    function sync() {
      var i = current();
      dots.forEach(function (d, k) {
        d.classList.toggle("is-active", k === i);
        d.setAttribute("aria-current", k === i ? "true" : "false");
      });
      cards.forEach(function (c, k) { c.inert = k !== i; });
    }

    cards.forEach(function (c, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show video " + (i + 1) + " of " + cards.length);
      dot.addEventListener("click", function () { go(i); });
      dotsHost.appendChild(dot);
      dots.push(dot);
    });

    prev.addEventListener("click", function () { go(current() - 1); });
    next.addEventListener("click", function () { go(current() + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.target !== track) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
    });

    var raf = 0;
    var last = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var i = current();
        if (i !== last) {
          last = i;
          stopAll(section, cards[i]);
        }
        sync();
      });
    }
    function onResize() {
      track.scrollTo({ left: current() * step() });
      onScroll();
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (!e.isIntersecting) stopAll(section, null); });
    }, { threshold: 0 });
    io.observe(section);

    sync();
    return function () {
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }

  var cleanups = [];

  function setup() {
    cleanups.forEach(function (fn) { fn(); });
    Array.prototype.forEach.call(document.querySelectorAll(".ad-video"), bind);
    cleanups = Array.prototype.slice.call(document.querySelectorAll("#videos")).map(mount);
  }

  if (window.document$) {
    window.document$.subscribe(setup);
  } else {
    document.addEventListener("DOMContentLoaded", setup);
  }
})();

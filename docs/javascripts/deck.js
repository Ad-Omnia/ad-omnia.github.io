(function () {
  "use strict";

  var PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  var loader = null;

  function pdfjs() {
    if (!loader) {
      loader = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = PDFJS + "pdf.min.js";
        script.onload = function () {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
          resolve(window.pdfjsLib);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return loader;
  }

  function mount(deck) {
    if (deck.dataset.ready) return null;
    deck.dataset.ready = "1";

    var stage = deck.querySelector(".ad-deck-stage");
    var canvas = deck.querySelector("canvas");
    var count = deck.querySelector(".ad-deck-count");
    var progress = deck.querySelector(".ad-deck-progress");
    var prev = deck.querySelector(".ad-deck-prev");
    var next = deck.querySelector(".ad-deck-next");
    var full = deck.querySelector(".ad-deck-full");
    var doc = null, current = 1, segments = [], task = null, alive = true;

    function render() {
      if (!doc) return;
      var page = current;
      doc.getPage(page).then(function (p) {
        if (!alive || page !== current) return;
        var base = p.getViewport({ scale: 1 });
        var ratio = Math.min(window.devicePixelRatio || 1, 2);
        var viewport = p.getViewport({ scale: (stage.clientWidth * ratio) / base.width });
        stage.style.aspectRatio = base.width + " / " + base.height;
        if (task) task.cancel();
        var buffer = document.createElement("canvas");
        buffer.width = viewport.width;
        buffer.height = viewport.height;
        task = p.render({ canvasContext: buffer.getContext("2d"), viewport: viewport });
        task.promise.then(function () {
          if (!alive || page !== current) return;
          canvas.width = buffer.width;
          canvas.height = buffer.height;
          canvas.getContext("2d").drawImage(buffer, 0, 0);
        }).catch(function () {});
      });
    }

    function show(n) {
      if (!doc) return;
      current = Math.max(1, Math.min(doc.numPages, n));
      segments.forEach(function (seg, i) { seg.classList.toggle("is-done", i < current); });
      count.textContent = current + " / " + doc.numPages;
      prev.disabled = current === 1;
      next.disabled = current === doc.numPages;
      render();
    }

    prev.addEventListener("click", function () { show(current - 1); });
    next.addEventListener("click", function () { show(current + 1); });

    stage.addEventListener("click", function (e) {
      var r = stage.getBoundingClientRect();
      show(current + (e.clientX - r.left < r.width / 3 ? -1 : 1));
    });

    deck.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") show(current + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") show(current - 1);
      else if (e.key === "Home") show(1);
      else if (e.key === "End" && doc) show(doc.numPages);
      else return;
      e.preventDefault();
    });

    var startX = null;
    stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
      startX = null;
    });

    if (deck.requestFullscreen) {
      full.addEventListener("click", function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else deck.requestFullscreen();
      });
    } else {
      full.hidden = true;
    }

    var size = 0;
    var ro = new ResizeObserver(function () {
      if (stage.clientWidth === size) return;
      size = stage.clientWidth;
      render();
    });
    ro.observe(stage);

    pdfjs().then(function (lib) {
      return lib.getDocument(deck.getAttribute("data-pdf")).promise;
    }).then(function (loaded) {
      if (!alive) return;
      doc = loaded;
      for (var i = 0; i < doc.numPages; i++) {
        var seg = document.createElement("button");
        seg.type = "button";
        seg.setAttribute("aria-label", "Go to slide " + (i + 1));
        seg.addEventListener("click", show.bind(null, i + 1));
        progress.appendChild(seg);
        segments.push(seg);
      }
      deck.classList.add("is-live");
      show(1);
    }).catch(function (err) {
      if (window.console) console.error(err);
    });

    return function () {
      alive = false;
      ro.disconnect();
      if (doc) doc.destroy();
    };
  }

  var cleanups = [];

  function setup() {
    cleanups.forEach(function (fn) { fn(); });
    cleanups = [];
    document.querySelectorAll(".ad-deck").forEach(function (deck) {
      var stop = mount(deck);
      if (stop) cleanups.push(stop);
    });
  }

  if (window.document$) {
    window.document$.subscribe(setup);
  } else {
    document.addEventListener("DOMContentLoaded", setup);
  }
})();

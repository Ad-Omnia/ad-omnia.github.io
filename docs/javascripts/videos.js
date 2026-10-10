(function () {
  "use strict";

  function pauseAll(root, except) {
    Array.prototype.forEach.call(root.querySelectorAll(".ad-video video"), function (v) {
      if (v !== except && !v.paused) v.pause();
    });
  }

  function bind(card) {
    var play = card.querySelector(".ad-video-play");
    if (!play || play.dataset.ready) return;
    play.dataset.ready = "1";
    var video = card.querySelector("video");

    play.addEventListener("click", function () {
      pauseAll(document, video);
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
    });

    if (video) video.addEventListener("play", function () { pauseAll(document, video); });
  }

  function mount(section) {
    var track = section.querySelector(".ad-videos");
    var cards = Array.prototype.slice.call(track.querySelectorAll(".ad-video"));
    var bar = section.querySelector(".ad-videos-bar");
    var prev = section.querySelector(".ad-videos-prev");
    var next = section.querySelector(".ad-videos-next");
    var dotsHost = section.querySelector(".ad-videos-dots");
    var dots = [];

    function step() {
      return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    }

    function current() {
      return Math.round(track.scrollLeft / Math.max(1, step()));
    }

    function go(i) {
      track.scrollTo({ left: Math.max(0, Math.min(cards.length - 1, i)) * step(), behavior: "smooth" });
    }

    function sync() {
      var scrollable = track.scrollWidth - track.clientWidth > 4;
      bar.hidden = !scrollable;
      if (!scrollable) return;
      var i = current();
      var end = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = end;
      dots.forEach(function (d, k) { d.classList.toggle("is-active", end ? k === dots.length - 1 : k === i); });
    }

    cards.forEach(function (c, i) {
      var dot = document.createElement("button");
      dot.type = "button";
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
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; sync(); });
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (!e.isIntersecting) pauseAll(section, null); });
    }, { threshold: 0 });
    io.observe(section);

    sync();
    return function () {
      window.removeEventListener("resize", onScroll);
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

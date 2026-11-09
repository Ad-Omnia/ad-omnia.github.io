(function () {
  "use strict";

  // Light/dark switch: the new theme spreads from the toggle button as a
  // growing circle until it covers the page. Falls back to Material's plain
  // switch when the browser has no View Transitions or motion is reduced.
  var DURATION = 800;
  var EASING = "cubic-bezier(0.2, 0.7, 0.2, 1)";

  document.addEventListener("click", function (event) {
    var label = event.target.closest(".md-header__option label[for^='__palette']");
    if (!label) return;
    if (!document.startViewTransition) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.hidden) return;

    var input = document.getElementById(label.htmlFor);
    if (!input) return;
    event.preventDefault();

    var box = label.getBoundingClientRect();
    var x = box.left + box.width / 2;
    var y = box.top + box.height / 2;
    var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    // Material applies the scheme synchronously on the radio's change event.
    // Never wait for an animation frame here: rendering is paused while the
    // update callback runs, so the frame would only come after the browser
    // gives up on the transition.
    var transition = document.startViewTransition(function () {
      input.click();
    });

    transition.ready.then(function () {
      document.documentElement.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
        { duration: DURATION, easing: EASING, pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () {});
    transition.finished.catch(function () {});
  }, true);
})();

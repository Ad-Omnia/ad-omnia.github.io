(function () {
  "use strict";

  var root = document.documentElement;
  var SIDES = [
    { sidebar: ".md-sidebar--primary", key: "ad-nav-collapsed", name: "menu", bar: "M9 3v18" },
    { sidebar: ".md-sidebar--secondary", key: "ad-toc-collapsed", name: "table of contents", bar: "M15 3v18" }
  ];

  function icon(bar) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="' + bar + '"/></g></svg>';
  }

  function store(key, value) {
    try {
      if (value) localStorage.setItem(key, "1");
      else localStorage.removeItem(key);
    } catch (err) {}
  }

  function label(button, side) {
    var collapsed = root.classList.contains(side.key);
    var text = (collapsed ? "Show " : "Hide ") + side.name;
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", text);
    button.title = text;
  }

  function mount(side) {
    var sidebar = document.querySelector(side.sidebar);
    if (!sidebar || sidebar.hidden || !sidebar.querySelector(".md-nav__link")) return;
    var inner = sidebar.querySelector(".md-sidebar__inner");
    if (!inner || inner.querySelector(".ad-side-toggle")) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "ad-side-toggle";
    button.innerHTML = icon(side.bar);
    button.addEventListener("click", function () {
      store(side.key, root.classList.toggle(side.key));
      label(button, side);
    });
    label(button, side);
    inner.insertBefore(button, inner.firstChild);
  }

  // The header line (and its frosted background) only shows once page
  // content starts to slide under the header, not as soon as Material
  // decides the header has a "shadow".
  function firstContent() {
    var hero = document.querySelector(".ad-hero-inner");
    if (hero) return hero;
    var inner = document.querySelector(".md-content__inner");
    if (!inner) return null;
    var style = getComputedStyle(inner);
    if (style.borderTopStyle !== "none" && parseFloat(style.borderTopWidth) > 0) return inner;
    var child = inner.firstElementChild;
    while (child && !child.offsetHeight) child = child.nextElementSibling;
    return child || inner;
  }

  function overlap() {
    var header = document.querySelector(".md-header");
    var target = firstContent();
    if (!header) return;
    var over = target ? target.getBoundingClientRect().top < header.getBoundingClientRect().bottom : window.scrollY > 0;
    header.classList.toggle("ad-header-over", over);
  }

  window.addEventListener("scroll", overlap, { passive: true });
  window.addEventListener("resize", overlap);

  function setup() {
    SIDES.forEach(mount);
    overlap();
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".md-header__topic:first-child")) return;
    var logo = document.querySelector(".md-header__button.md-logo");
    if (logo) logo.click();
  });

  if (window.document$) {
    window.document$.subscribe(setup);
  } else {
    document.addEventListener("DOMContentLoaded", setup);
  }
})();

(function () {
  "use strict";

  var root = document.documentElement;
  var SIDES = [
    { sidebar: ".md-sidebar--primary", key: "ad-nav-collapsed", name: "menu", bar: "M9 4v16" },
    { sidebar: ".md-sidebar--secondary", key: "ad-toc-collapsed", name: "table of contents", bar: "M15 4v16" }
  ];

  function icon(bar) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="' + bar + '"/></g></svg>';
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

  function setup() {
    SIDES.forEach(mount);
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

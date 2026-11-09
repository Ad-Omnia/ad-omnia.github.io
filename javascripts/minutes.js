(function () {
  "use strict";

  function setup() {
    var filter = document.querySelector("[data-ad-filter]");
    var hub = document.querySelector(".ad-hub");
    if (!filter || !hub || filter.dataset.ready) return;
    filter.dataset.ready = "1";

    var from = filter.querySelector('[data-role="from"]');
    var to = filter.querySelector('[data-role="to"]');
    var clearBtn = filter.querySelector('[data-role="clear"]');
    var empty = document.querySelector('[data-role="empty"]');
    var cards = Array.prototype.slice.call(hub.querySelectorAll(".ad-hub-card[data-date]"));
    var groups = Array.prototype.slice.call(hub.querySelectorAll(".ad-hub-group"));

    function apply() {
      var f = from.value || null;
      var t = to.value || null;
      var active = !!(f || t);
      var anyVisible = false;

      cards.forEach(function (card) {
        var d = card.getAttribute("data-date");
        var ok = (!f || d >= f) && (!t || d <= t);
        card.hidden = !ok;
        if (ok) anyVisible = true;
      });

      groups.forEach(function (group) {
        group.hidden = group.querySelectorAll(".ad-hub-card:not([hidden])").length === 0;
      });

      filter.classList.toggle("is-active", active);
      if (clearBtn) clearBtn.hidden = !active;
      if (empty) empty.hidden = !active || anyVisible;
    }

    from.addEventListener("input", apply);
    to.addEventListener("input", apply);
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        from.value = "";
        to.value = "";
        apply();
      });
    }

    apply();
  }

  if (window.document$) {
    window.document$.subscribe(setup);
  } else {
    document.addEventListener("DOMContentLoaded", setup);
  }
})();

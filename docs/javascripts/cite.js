(function () {
  "use strict";

  // Legal citations (.ad-cite) and reference links (.ad-refs) point to
  // external law texts: open them in a new tab so the reader keeps their
  // place in the analysis.
  function mark() {
    document.querySelectorAll(".md-typeset a.ad-cite, .md-typeset .ad-refs a, .md-typeset .ad-law a").forEach(function (link) {
      if (link.host && link.host !== location.host) {
        link.target = "_blank";
        link.rel = "noopener";
      }
    });
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(mark);
  } else {
    document.addEventListener("DOMContentLoaded", mark);
  }
})();

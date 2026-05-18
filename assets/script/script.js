// Main script
(function () {
  "use strict";

  // The header is position:fixed, so it's out of flow. Expose its occupied
  // height (viewport top → header bottom, incl. its top margin) as a CSS
  // custom property so the layout can offset content and size .aktuelles.
  // It must be dynamic: root font-size is 1vw, so the header height scales
  // with viewport width.
  function syncHeaderHeight() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var h = header.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty("--header-height", h + "px");
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncHeaderHeight();

    var header = document.querySelector(".site-header");
    if (header && "ResizeObserver" in window) {
      new ResizeObserver(syncHeaderHeight).observe(header);
    }
    window.addEventListener("resize", syncHeaderHeight, { passive: true });

    // HAL Timezone changes the title's size once it loads.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncHeaderHeight);
    }
  });
})();

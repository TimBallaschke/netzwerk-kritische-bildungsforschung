// Main script
(function () {
  "use strict";

  // Always start at the top on (re)load. Without this the browser restores
  // the previous scroll position, leaving the page parked past the intro
  // (and re-triggering the scroll lock with the intro out of view).
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

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

  // One-way scroll: once .aktuelles has snapped under the header, freeze
  // the page so the user can't scroll back up to the intro text.
  function initScrollLock() {
    var aktuelles = document.querySelector(".aktuelles");
    if (!aktuelles) return;
    var locked = false;

    function headerHeight() {
      return (
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-height"
          )
        ) || 0
      );
    }

    // Tell aktuelles.js whether the carousel may take wheel/drag input
    // (only while the page is locked at it).
    function setCarouselInteractive(active) {
      window.dispatchEvent(
        new CustomEvent("aktuelles:interactive", { detail: { active: active } })
      );
    }

    function maybeLock() {
      if (locked) return;
      var headerH = headerHeight();
      // Scroll position at which aktuelles' top reaches the header's bottom.
      var lockY =
        aktuelles.getBoundingClientRect().top + window.scrollY - headerH;
      if (window.scrollY >= lockY - 1) {
        locked = true;
        window.removeEventListener("scroll", maybeLock);
        // Pin exactly to the snap point, then disable page scrolling.
        window.scrollTo(0, lockY);
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        // Enables the header-hover intro reveal (see _intro-text.scss).
        document.documentElement.classList.add("is-locked");
        setCarouselInteractive(true);
      }
    }

    window.addEventListener("scroll", maybeLock, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Belt-and-suspenders: if the browser restored a position before the
    // manual setting took effect, jump back to the top (no animation).
    window.scrollTo({ top: 0, behavior: "instant" });

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

    initScrollLock();
  });
})();

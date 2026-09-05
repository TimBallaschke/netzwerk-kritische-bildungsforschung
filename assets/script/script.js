// Main script
(function () {
  "use strict";

  document.addEventListener("alpine:init", function () {
    window.Alpine.data("disclosure", function () {
      // Animate a clipped viewport; the text inside always keeps its natural
      // width, line-height and layout. Native objects stay outside Alpine state.
      var animation = null;
      var observer = null;
      var element, content, inner, preview;
      var targetHeight = 0;

      function collapsedHeight() {
        var style = getComputedStyle(content);
        var limit = parseFloat(style.getPropertyValue("--disclosure-preview-lines")) || 0;
        // Count actual lines, so every preview ends at the same line boundary.
        var height = preview ? Math.min(preview.getBoundingClientRect().height, limit * parseFloat(style.lineHeight)) : 0;
        content.style.setProperty("--disclosure-collapsed-height", height + "px");
        return height;
      }

      function animateHeight(from, to) {
        if (animation) animation.cancel();
        animation = null;
        targetHeight = to;
        element.classList.remove("is-animating");

        if (!content.animate || Math.abs(to - from) < 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        element.classList.add("is-animating");
        var current = content.animate(
          [{ height: from + "px" }, { height: to + "px" }],
          { duration: 400, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "both" }
        );
        animation = current;
        current.onfinish = () => {
          if (animation !== current) return;
          element.classList.remove("is-animating");
          current.cancel();
          animation = null;
        };
      }

      return {
        open: false,
        init() {
          element = this.$root;
          content = this.$refs.content;
          inner = this.$refs.inner;
          preview = content.querySelector("[data-disclosure-preview]");
          collapsedHeight();

          // Fonts, images and responsive wrapping can change the natural size.
          if ("ResizeObserver" in window) {
            observer = new ResizeObserver(() => {
              var from = content.getBoundingClientRect().height;
              var collapsed = collapsedHeight();
              var to = this.open ? inner.getBoundingClientRect().height : collapsed;
              if (animation && Math.abs(to - targetHeight) >= 1) animateHeight(from, to);
            });
            observer.observe(inner);
            if (preview) observer.observe(preview);
          }
        },
        toggle(force) {
          var next = typeof force === "boolean" ? force : !this.open;
          if (next === this.open) return;

          // Reversals start at the current visible height. The fade follows
          // the requested state immediately, in both directions.
          var from = content.getBoundingClientRect().height;
          var collapsed = collapsedHeight();
          this.open = next;
          element.classList.toggle("is-open", next);
          animateHeight(from, next ? inner.getBoundingClientRect().height : collapsed);
        },
        destroy() {
          if (animation) animation.cancel();
          if (observer) observer.disconnect();
        }
      };
    });
  });

  // Always start at the top on (re)load. Without this the browser restores
  // the previous scroll position, leaving the page parked past the intro
  // (and re-triggering the scroll lock with the intro out of view).
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // The header (including an optional category banner) is fixed and out of flow. Expose its occupied
  // height (viewport top → header bottom, incl. its top margin) as a CSS
  // custom property so the layout can offset content and size .aktuelles.
  // It must be dynamic: root font-size is 1vw, so the header height scales
  // with viewport width.
  function syncHeaderHeight() {
    var header = document.querySelector(".site-header-group, .site-header");
    if (!header) return;
    var h = header.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty("--header-height", h + "px");
  }

  // Once Aktuelles reaches the header, the intro cannot be scrolled back into
  // view. Grafik freezes the page; Liste removes the intro from the page flow
  // so the feed retains native scrolling with its start as the upper limit.
  function initScrollLock() {
    var aktuelles = document.querySelector(".aktuelles");
    if (!aktuelles) return;
    var docEl = document.documentElement;
    var locked = false;
    var listView = false;
    var listPinned = false;

    function headerHeight() {
      return (
        parseFloat(
          getComputedStyle(docEl).getPropertyValue("--header-height")
        ) || 0
      );
    }

    function setCarouselInteractive(active) {
      window.dispatchEvent(
        new CustomEvent("aktuelles:interactive", { detail: { active } })
      );
    }

    // Scroll position at which aktuelles' top reaches the header's bottom.
    function lockTargetY() {
      return Math.round(
        aktuelles.getBoundingClientRect().top + window.scrollY - headerHeight()
      );
    }

    function alignLockedLayout() {
      if (!locked || listView) return;
      // Responsive text wrapping and header sizing move the snap point.
      // Correct it without a smooth scroll that would expose part of the intro.
      syncHeaderHeight();
      var targetY = lockTargetY();
      if (Math.abs(window.scrollY - targetY) > 0.5) {
        window.scrollTo({ top: targetY, behavior: "instant" });
      }
    }

    function freeze() {
      locked = true;
      window.removeEventListener("scroll", maybeLock);
      docEl.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      // Enables the header-hover intro reveal (see _intro-text.scss).
      docEl.classList.add("is-locked");
      alignLockedLayout();
      setCarouselInteractive(true);
    }

    function unfreeze() {
      locked = false;
      docEl.style.overflow = "";
      document.body.style.overflow = "";
      docEl.classList.remove("is-locked");
      setCarouselInteractive(false);
    }

    function pinList() {
      listPinned = true;
      docEl.classList.add("is-list-pinned");
      window.removeEventListener("scroll", maybeLock);
      // CSS removes the intro only in Liste. The new native scroll origin
      // prevents wheel, touch, and keyboard input from revealing it again.
      window.scrollTo({ top: Math.max(0, lockTargetY()), behavior: "instant" });
    }

    function maybeLock() {
      if (locked || docEl.classList.contains("modal-is-open")) return;
      if (window.scrollY >= lockTargetY() - 1) {
        if (listView) pinList();
        else freeze();
      }
    }

    // Grafik/Liste switch (dispatched from aktuelles.php via Alpine).
    window.addEventListener("aktuelles:view", function (e) {
      var list = !!(e.detail && e.detail.list);
      if (list === listView) return; // ignore the initial Grafik signal
      listView = list;
      docEl.classList.toggle("is-list-view", list);

      if (list) {
        // Carry the one-way intro lock over from Grafik, while freeing the feed.
        var alreadySnapped = locked || listPinned;
        if (locked) unfreeze();
        if (alreadySnapped) pinList();
        else maybeLock();
      } else {
        // Back to Grafik: layout reverts to the fixed carousel — pin it.
        freeze();
      }
    });

    window.addEventListener("scroll", maybeLock, { passive: true });
    window.addEventListener("resize", alignLockedLayout, { passive: true });
    if ("ResizeObserver" in window) {
      var layoutObserver = new ResizeObserver(alignLockedLayout);
      layoutObserver.observe(aktuelles);
      var intro = document.querySelector(".intro-text");
      if (intro) layoutObserver.observe(intro);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Belt-and-suspenders: if the browser restored a position before the
    // manual setting took effect, jump back to the top (no animation).
    window.scrollTo({ top: 0, behavior: "instant" });

    syncHeaderHeight();

    var header = document.querySelector(".site-header-group, .site-header");
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

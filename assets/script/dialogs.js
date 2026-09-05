// Show the selected content panel in the native dialog.
document.querySelectorAll("dialog[data-content-dialog]").forEach((dialog) => {
  const panels = Array.from(dialog.querySelectorAll("[data-modal-id]"));
  const scroller = dialog.querySelector("[data-dialog-scroll]");
  let closeRequest = 0;

  const closeDialog = async () => {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    const request = ++closeRequest;
    // Closing during the entrance starts from the card's current position.
    dialog.style.setProperty("--overlay-close-transform", getComputedStyle(dialog).transform);
    dialog.classList.add("is-closing");
    document.body.classList.add("modal-is-closing");

    const animation = dialog.getAnimations().find((item) =>
      item.animationName === "aktuelles-overlay-slide-out");
    // No animation with reduced motion; finish immediately in that case.
    if (animation) await animation.finished.catch(() => {});
    if (request === closeRequest && dialog.open) dialog.close();
  };

  const updateScrollEdges = () => {
    dialog.classList.toggle("has-content-above", dialog.open && scroller.scrollTop > 1);
    dialog.classList.toggle("has-content-below", dialog.open &&
      scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 1);
  };
  const resizeObserver = new ResizeObserver(updateScrollEdges);
  scroller.addEventListener("scroll", updateScrollEdges, { passive: true });

  window.addEventListener("open-modal", (event) => {
    const panel = panels.find((item) => item.dataset.modalId === event.detail?.id);
    if (!panel) return;

    closeRequest++;
    dialog.classList.remove("is-closing");
    dialog.style.removeProperty("--overlay-close-transform");
    document.body.classList.remove("modal-is-closing");
    panels.forEach((item) => { item.hidden = item !== panel; });
    dialog.setAttribute("aria-labelledby", panel.getAttribute("aria-labelledby"));
    document.documentElement.classList.add("modal-is-open");
    document.body.classList.add("modal-is-open");
    if (!dialog.open) dialog.showModal();
    scroller.scrollTop = 0;
    resizeObserver.disconnect();
    resizeObserver.observe(scroller);
    resizeObserver.observe(panel);
    updateScrollEdges();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-dialog-close]")) closeDialog();
  });

  // Let the native dialog's dismissal request use the same exit animation.
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });

  dialog.addEventListener("close", () => {
    closeRequest++;
    dialog.classList.remove("is-closing");
    dialog.style.removeProperty("--overlay-close-transform");
    resizeObserver.disconnect();
    updateScrollEdges();
    document.documentElement.classList.remove("modal-is-open");
    document.body.classList.remove("modal-is-open", "modal-is-closing");
    panels.forEach((panel) => { panel.hidden = true; });
  });
});

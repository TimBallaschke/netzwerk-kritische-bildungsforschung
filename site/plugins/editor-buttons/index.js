// Custom textarea toolbar buttons.
//
// `subheadline` inserts a single fixed heading level (H2, "## ") with one
// click — a replacement for Kirby's built-in `headlines` button, which is
// always an H1/H2/H3 dropdown. Reference it in a blueprint via
// `buttons: [subheadline, italic, link]`.
panel.plugin("nkb/editor-buttons", {
  textareaButtons: {
    subheadline: {
      label: "Überschrift",
      icon: "title",
      click() {
        this.command("prepend", "##");
      }
    }
  }
});

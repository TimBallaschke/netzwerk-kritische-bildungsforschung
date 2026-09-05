panel.plugin("custom/italic-button", {
  textareaButtons: {
    italic: {
      label: "Kursiv",
      icon: "italic",
      shortcut: "i",
      click: function () {
        this.command("toggle", "<em>", "</em>");
      }
    }
  }
});
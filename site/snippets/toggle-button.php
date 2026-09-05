<?php /** Shared control for an Alpine disclosure. */ ?>
<button
  class="toggle-btn"
  type="button"
  @click.stop="toggle()"
  :aria-expanded="open"
  aria-controls="<?= esc($controls, 'attr') ?>"
  aria-label="<?= esc($label, 'attr') ?>"
>
  <span class="toggle-icon" aria-hidden="true"></span>
</button>

<?php
/**
 * Aktuelles list item
 *
 * One row of the "Aktuelles" list: type (+ optional date) and title/subinfo
 * on the left, a short description on the right, and a toggle on the far right.
 *
 * Data is supplied by the aktuelles-list snippet (sourced from the
 * `aktuelles` blueprint). Keys: type, date, title, subinfo, description.
 *
 * `type` is one of: Veranstaltung, Call for Papers, Blog, Notiz.
 * `date` is optional. `subinfo` may contain inline <em> for names.
 */

$type        = $type        ?? '';
$date        = $date        ?? null;
$title       = $title       ?? '';
$subinfo     = $subinfo     ?? '';
$description = $description  ?? '';
?>
<article class="aktuelles-item">
  <div class="aktuelles-item__main">
    <p class="aktuelles-item__type">
      <span class="aktuelles-item__type-label"><?= html($type) ?>:</span>
      <?php if ($date): ?><span class="aktuelles-item__date"><?= html($date) ?></span><?php endif ?>
    </p>
    <h2 class="aktuelles-item__title"><?= html($title) ?></h2>
    <?php if ($subinfo): ?>
      <p class="aktuelles-item__subinfo"><?= $subinfo ?></p>
    <?php endif ?>
  </div>

  <div class="aktuelles-item__description">
    <p><?= html($description) ?></p>
  </div>

  <button class="aktuelles-item__toggle" type="button" aria-label="Mehr anzeigen">
    <span class="aktuelles-item__toggle-icon" aria-hidden="true">+</span>
  </button>
</article>

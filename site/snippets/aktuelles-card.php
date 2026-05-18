<?php
/**
 * Aktuelles card
 *
 * One card in the 3D carousel. Same content source as the list items
 * (the `aktuelles` blueprint) but WITHOUT the description text.
 *
 * Variables: $type (display label), $title, $subinfo (writer HTML),
 * $description (plain text), $color (category color, used by aktuelles.js
 * for connector lines).
 *
 * The collapsed card stays a constant size; the description is hidden
 * until aktuelles.js adds `is-open` (after a clicked card has centred),
 * which animates the card height open and fades the text in.
 */

$type        = $type        ?? '';
$title       = $title       ?? '';
$subinfo     = $subinfo     ?? '';
$description  = $description  ?? '';
$color       = $color       ?? '#612c00';
?>
<article class="aktuelles__card" data-color="<?= $color ?>">
  <p class="aktuelles__card-type"><span class="aktuelles__card-type-label"><?= html($type) ?>:</span></p>
  <h3 class="aktuelles__card-title"><?= html($title) ?></h3>
  <?php if (!empty($subinfo)): ?>
    <p class="aktuelles__card-subinfo"><?= $subinfo ?></p>
  <?php endif ?>
  <?php if (!empty($description)): ?>
    <div class="aktuelles__card-desc" aria-hidden="true">
      <div class="aktuelles__card-desc-inner"><?= html($description) ?></div>
    </div>
  <?php endif ?>
  <span class="aktuelles__card-info" aria-hidden="true">
    <span class="aktuelles__card-info-icon"></span>
  </span>
  <span class="aktuelles__card-open" aria-hidden="true">
    <svg class="aktuelles__card-open-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="6" y1="18" x2="18" y2="6"></line>
      <polyline points="9 6 18 6 18 15"></polyline>
    </svg>
  </span>
  <span class="aktuelles__card-overlay" aria-hidden="true"></span>
</article>

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
  <span class="aktuelles__card-info" aria-hidden="true">i</span>
  <span class="aktuelles__card-overlay" aria-hidden="true"></span>
</article>

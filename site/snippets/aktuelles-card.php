<?php
$type        = $type        ?? '';
$title       = $title       ?? '';
$subinfo     = $subinfo     ?? '';
$description = $description  ?? '';
$color       = $color       ?? '#612c00';

// ID eindeutig bestimmen
$cardId = !empty($id) ? $id : (!empty($slug) ? $slug : (isset($item) ? $item->slug() : ''));
?>

<article class="aktuelles__card" data-color="<?= $color ?>" data-id="<?= $cardId ?>">
  <p class="aktuelles__card-type"><span class="aktuelles__card-type-label"><?= kti($type) ?>:</span></p>
  <h3 class="aktuelles__card-title"><?= kti($title) ?></h3>
  
  <?php if (!empty($subinfo)): ?>
    <p class="aktuelles__card-subinfo"><?= $subinfo ?></p>
  <?php endif ?>
  
  <?php if (!empty($description)): ?>
    <div class="aktuelles__card-desc" aria-hidden="true">
      <div class="aktuelles__card-desc-inner"><?= kti($description) ?></div>
    </div>
  <?php endif ?>
  
  <span class="aktuelles__card-info" aria-hidden="true">
    <span class="aktuelles__card-info-icon"></span>
  </span>

  <button
    class="aktuelles__card-open" 
    type="button" 
    aria-label="Beitrag öffnen"
  >
    <svg class="aktuelles__card-open-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="6" y1="18" x2="18" y2="6"></line>
      <polyline points="9 6 18 6 18 15"></polyline>
    </svg>
  </button>
  
  <span class="aktuelles__card-overlay" aria-hidden="true"></span>
</article>
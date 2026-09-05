<?php
$type        = $type        ?? '';
$title       = $title       ?? '';
$subinfo     = $subinfo     ?? '';
$description = $description  ?? '';
$color       = $color       ?? '#612c00';
$linkType    = $linkType    ?? 'self';
$externalUrl = trim((string) ($externalUrl ?? ''));
$hasExternalLink = $linkType === 'external'
    && filter_var($externalUrl, FILTER_VALIDATE_URL) !== false
    && in_array(strtolower((string) parse_url($externalUrl, PHP_URL_SCHEME)), ['http', 'https'], true);

// ID eindeutig bestimmen
$cardId = !empty($id) ? $id : (!empty($slug) ? $slug : (isset($item) ? $item->slug() : ''));
?>

<article class="aktuelles__card" data-color="<?= $color ?>" data-id="<?= $cardId ?>">
  <p class="aktuelles__card-type"><span class="aktuelles__card-type-label"><?= kti($type) ?>:</span><?php if (!empty($date)): ?> <?= esc($date) ?><?php endif ?></p>
  <h3 class="aktuelles__card-title"><?= kti($title) ?></h3>

  <?php if (!empty($subinfo)): ?>
    <p class="aktuelles__card-subinfo"><?= $subinfo ?></p>
  <?php endif ?>

  <?php if (!empty($description)): ?>
    <div class="aktuelles__card-desc" aria-hidden="true">
      <div class="aktuelles__card-desc-inner"><?= kti($description) ?></div>
    </div>
  <?php endif ?>
  
  <button class="aktuelles__card-info" type="button" aria-label="Karte öffnen" aria-expanded="false">
    <span class="aktuelles__card-info-icon" aria-hidden="true"></span>
  </button>

  <?php if ($linkType === 'self' || $hasExternalLink): ?>
    <?php if ($hasExternalLink): ?>
      <a class="aktuelles__card-open" href="<?= esc($externalUrl, 'attr') ?>"
         target="_blank" rel="noopener noreferrer" aria-label="Externe Ressource öffnen (neuer Tab)">
    <?php else: ?>
      <button class="aktuelles__card-open" type="button" aria-label="Beitrag öffnen" aria-haspopup="dialog">
    <?php endif ?>
      <svg class="aktuelles__card-open-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <line x1="6" y1="18" x2="18" y2="6"></line>
        <polyline points="9 6 18 6 18 15"></polyline>
      </svg>
    <?php if ($hasExternalLink): ?></a><?php else: ?></button><?php endif ?>
  <?php endif ?>
  
  <span class="aktuelles__card-overlay" aria-hidden="true"></span>
</article>

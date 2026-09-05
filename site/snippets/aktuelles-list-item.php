<?php
$id          = $id          ?? '';
$type        = $type        ?? '';
$typeKey     = $typeKey     ?? '';
$date        = $date        ?? null;
$title       = $title       ?? '';
$subinfo     = $subinfo     ?? '';
$description = $description  ?? '';
?>

<article 
  class="aktuelles-item"
  data-id="<?= html($id) ?>"
  data-type="<?= html($typeKey) ?>"
  @click="$dispatch('open-modal', { id: '<?= html($id) ?>' })"
>
  <div class="aktuelles-item__header-row">
    <!-- Linke Spalte: Typ, Datum, Titel & Subinfo -->
    <div class="aktuelles-item__main">
      <p class="aktuelles-item__type">
        <span class="aktuelles-item__type-label"><?= html($type) ?>:</span>
        <?php if ($date): ?>
          <span class="aktuelles-item__date"><?= html($date) ?></span>
        <?php endif ?>
      </p>

      <h3 class="aktuelles-item__title"><?= kti($title) ?></h3>

      <?php if (!empty($subinfo)): ?>
        <p class="aktuelles-item__subinfo"><?= $subinfo ?></p>
      <?php endif ?>
    </div>

    <!-- Rechte Spalte: Kurzer Intro-Text -->
    <?php if (!empty($description)): ?>
      <div class="aktuelles-item__preview-desc">
        <?= kti($description) ?>
      </div>
    <?php endif ?>
  </div>

  <!-- Plus-Button ganz rechts -->
  <button 
    type="button" 
    class="toggle-btn aktuelles-item__toggle"
    aria-label="Beitrag im Overlay öffnen"
  >
    <span class="toggle-icon" aria-hidden="true"></span>
  </button>
</article>
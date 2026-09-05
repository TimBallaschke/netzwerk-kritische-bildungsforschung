<!-- OVERLAY MODAL FÜR CARDS -->
<dialog class="aktuelles-modal-overlay" data-content-dialog>
  <button
    class="aktuelles-modal__close"
    type="button"
    data-dialog-close
    aria-label="Schließen"
  >
    <span class="close-icon" aria-hidden="true"></span>
  </button>

  <div class="aktuelles-modal__scroll" data-dialog-scroll>
  <?php foreach (($cardEntries ?? []) as $item): ?>
    <?php 
      $itemId       = $item->id();
      $headingId    = 'modal-title-' . sha1($itemId);
    ?>
    <div 
      class="aktuelles-modal"
      data-modal-id="<?= esc($itemId, 'attr') ?>"
      aria-labelledby="<?= $headingId ?>"
      hidden
    >

      <?php snippet('content-entry', ['item' => $item, 'headingId' => $headingId]) ?>

    </div>
  <?php endforeach ?>
  </div>
</dialog>

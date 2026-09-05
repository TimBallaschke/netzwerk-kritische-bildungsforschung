<?php snippet('header') ?>
<article class="aktuelles-modal content-detail">
  <a class="aktuelles-modal__close" href="<?= esc(site()->url(), 'attr') ?>" aria-label="Zur Startseite">
    <span class="close-icon" aria-hidden="true"></span>
  </a>
  <?php snippet('content-entry', ['item' => $page, 'headingId' => 'entry-title', 'headingTag' => 'h1']) ?>
</article>
<?php snippet('footer') ?>

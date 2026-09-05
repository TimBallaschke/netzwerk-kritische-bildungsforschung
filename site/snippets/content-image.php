<?php if ($image): ?>
  <figure class="content-image <?= esc($class ?? '', 'attr') ?>">
    <img
      src="<?= $image->url() ?>"
      alt="<?= esc($image->alt()->value(), 'attr') ?>"
      width="<?= $image->width() ?>"
      height="<?= $image->height() ?>"
      loading="lazy"
      decoding="async"
    >
    <?php if ($image->alt()->isNotEmpty()): ?>
      <figcaption class="photo-caption"><?= $image->alt()->html() ?></figcaption>
    <?php endif ?>
  </figure>
<?php endif ?>

<?php if ($image): ?>
  <figure class="content-image <?= esc($class ?? '', 'attr') ?>">
    <?php snippet('responsive-image', [
      'image' => $image,
      'sizes' => str_contains($class ?? '', 'content-image--beside-text')
        ? '(max-width: 900px) min(320px, calc(100vw - 48px)), 18vw'
        : '(max-width: 900px) calc(100vw - 24px), 58vw',
    ]) ?>
    <?php if ($image->alt()->isNotEmpty()): ?>
      <figcaption class="photo-caption"><?= $image->alt()->html() ?></figcaption>
    <?php endif ?>
  </figure>
<?php endif ?>

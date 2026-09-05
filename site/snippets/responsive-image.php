<?php
if (!$image) {
    return;
}

$source = $image;
$srcset = null;
$width = $image->width();
$height = $image->height();

// Keep vectors and GIF animations intact; only encode resizable raster images.
if (in_array($image->extension(), ['jpg', 'jpeg', 'png', 'webp'], true) && $image->isResizable()) {
    $options = ['format' => 'webp', 'quality' => $quality ?? 82];
    $variants = [];
    foreach ($widths ?? [160, 320, 480, 640, 960, 1280, 1920] as $candidate) {
        // Clamping also keeps srcset descriptors accurate for small originals.
        $candidate = min($candidate, $width);
        $variants[$candidate . 'w'] = ['width' => $candidate] + $options;
    }
    $source = $image->thumb(['width' => min($defaultWidth ?? 960, $width)] + $options);
    $srcset = $image->srcset($variants);
}
?>
<img
  src="<?= esc($source->url(), 'attr') ?>"
  <?php if ($srcset): ?>
  srcset="<?= esc($srcset, 'attr') ?>"
  sizes="auto, <?= esc($sizes ?? '100vw', 'attr') ?>"
  <?php endif ?>
  alt="<?= esc($alt ?? $image->alt()->value(), 'attr') ?>"
  <?php if (!empty($class)): ?>class="<?= esc($class, 'attr') ?>"<?php endif ?>
  <?php if ($width && $height): ?>width="<?= $width ?>" height="<?= $height ?>"<?php endif ?>
  loading="lazy"
  decoding="async"
>

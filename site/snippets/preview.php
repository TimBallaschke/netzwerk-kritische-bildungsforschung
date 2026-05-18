<?php
/**
 * Preview shell
 *
 * Minimal HTML document for styling a snippet in isolation — same CSS,
 * fonts and Alpine as the real site, but no header / nav / content.
 * Rendered by the `preview/*` routes (see site/config/config.php).
 *
 * Variables: $title (string), $inner (pre-rendered HTML string).
 */
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preview – <?= html($title ?? 'Snippet') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist&display=swap">
  <?php $styleFile = 'assets/style/style.css'; ?>
  <?= css($styleFile . '?v=' . filemtime(kirby()->root('index') . '/' . $styleFile)) ?>
</head>
<body>
  <?= $inner ?? '' ?>
  <?php $alpineJs = 'assets/script/vendor/alpine.min.js'; ?>
  <?= js($alpineJs . '?v=' . filemtime(kirby()->root('index') . '/' . $alpineJs), ['defer' => true]) ?>
</body>
</html>

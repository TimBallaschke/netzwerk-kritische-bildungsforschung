<?php $intro = page('home')?->intro(); ?>
<?php if ($intro && $intro->isNotEmpty()): ?>
<section class="intro-text" aria-label="Einleitung">
  <div class="intro-text__body"><?= $intro->kirbytext() ?></div>
</section>
<?php endif ?>

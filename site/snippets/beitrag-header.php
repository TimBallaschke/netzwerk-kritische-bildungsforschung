<?php
$collapsible = $collapsible ?? false;
$heading = $collapsible ? 'h3' : 'h1';
?>
<div class="post-header-row">
  <div class="post-meta-info" <?php if ($collapsible): ?>@click="toggle()"<?php endif ?>>
    <?php if ($post->date()->isNotEmpty()): ?>
      <p class="post-date"><?= $post->date()->toDate('j.n.Y') ?></p>
    <?php endif ?>

    <<?= $heading ?> class="post-title"><?= $post->title()->kti() ?></<?= $heading ?>>

    <?php if ($post->authors()->isNotEmpty()): ?>
      <p class="post-author">von <?= $post->authors()->kti() ?></p>
    <?php endif ?>
  </div>
</div>

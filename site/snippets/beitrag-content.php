<?php
$collapsible = $collapsible ?? false;
$photo = $post->authorPhoto()->toFile();
$pdf = $post->downloadPdf()->toFile();
?>
<?php if ($collapsible): ?>
<div class="disclosure-content" x-ref="content">
<?php endif ?>
<div class="post-content-grid" <?php if ($collapsible): ?>x-ref="inner"<?php endif ?>>
  <?php if ($photo): ?>
    <div class="photo-column">
      <?php snippet('content-image', ['image' => $photo, 'class' => 'content-image--beside-text']) ?>
    </div>
  <?php endif ?>

  <div class="text-column">
    <?php if ($collapsible): ?>
      <div class="preview-text" data-disclosure-preview :inert="open" @click="toggle(true)">
        <div class="text-content">
          <?= $post->description()->or($post->body())->prose() ?>
        </div>
      </div>
    <?php endif ?>

    <div class="full-text" <?php if ($collapsible): ?>:inert="!open" id="featured-post-content"<?php endif ?>>
      <div class="text-content">
        <?= $post->body()->or($post->description())->prose() ?>
      </div>

      <?php if ($pdf): ?>
        <div class="pdf-download-wrapper">
          <?php snippet('pdf-button', ['pdf' => $pdf]) ?>
        </div>
      <?php endif ?>
    </div>
  </div>
</div>
<?php if ($collapsible): ?>
</div>
<?php endif ?>

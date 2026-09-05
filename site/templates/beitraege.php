<?php
$posts = collection('beitraege');
$featuredPost = $posts->first();
$otherPosts = $posts->offset(1);
snippet('header', ['categoryTitle' => $page->title()]);
?>

<div class="page-beitraege">
  <?php if ($featuredPost): ?>
    <section class="featured-post-section">
      <h2 class="beitraege-subtitle">Aktueller Beitrag</h2>

      <article class="featured-post-card" x-data="disclosure">
        <?php snippet('toggle-button', ['controls' => 'featured-post-content', 'label' => 'Aktuellen Beitrag öffnen oder schließen']) ?>
        <?php snippet('beitrag-header', ['post' => $featuredPost, 'collapsible' => true]) ?>
        <?php snippet('beitrag-content', ['post' => $featuredPost, 'collapsible' => true]) ?>
      </article>
    </section>
  <?php endif ?>

  <?php snippet('beitraege-list', ['posts' => $otherPosts]) ?>
</div>

<?php snippet('footer') ?>

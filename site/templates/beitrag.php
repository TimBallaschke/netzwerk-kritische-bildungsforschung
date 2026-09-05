<?php
$overview = page('aktuelles/beitraege') ?? site()->index()->find('beitraege');
$otherPosts = collection('beitraege')->not($page);
snippet('header', ['categoryTitle' => $overview?->title() ?? 'Beiträge']);
?>

<div class="page-beitraege page-beitraege--detail">
  <section class="featured-post-section">
    <article class="featured-post-card is-open">
      <?php if ($overview): ?>
        <a class="toggle-btn post-back-link" href="<?= esc($overview->url(), 'attr') ?>" aria-label="Zurück zur Beitragsübersicht">
          <span class="toggle-icon" aria-hidden="true"></span>
        </a>
      <?php endif ?>

      <?php snippet('beitrag-header', ['post' => $page]) ?>
      <?php snippet('beitrag-content', ['post' => $page]) ?>
    </article>
  </section>

  <?php snippet('beitraege-list', ['posts' => $otherPosts]) ?>
</div>

<?php snippet('footer') ?>

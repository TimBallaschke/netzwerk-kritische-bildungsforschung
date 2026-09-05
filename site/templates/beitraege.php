<?php snippet('header') ?>


<!-- Braunes Kategorie-Banner oben -->
<div class="category-banner">
  <span><?= $page->title()->kti() ?></span>
</div>


<main class="page-beitraege">

  <?php
  // 1. Suche im gesamten Baum unter /aktuelles oder der aktuellen Seite
  $source = page('aktuelles') ?? site()->index()->find('aktuelles') ?? $page;

  // 2. Nur Einträge mit dem Template 'beitrag' filtern
  $posts = $source->index()->listed()
    ->filterBy('intendedTemplate', 'beitrag')
    ->sortBy('date', 'desc');

  if ($posts->isEmpty()) {
    $posts = $page->children()->listed()->filterBy('intendedTemplate', 'beitrag')->sortBy('date', 'desc');
  }

  $featuredPost = $posts->first();
  $otherPosts   = $posts->offset(1);
  ?>

  <!-- 1. AKTUELLER BEITRAG (HAUPTBEITRAG OBEN) - Bleibt als Akkordeon -->
  <?php if ($featuredPost): ?>
    <?php 
      $fDate = $featuredPost->date()->isNotEmpty() 
        ? $featuredPost->date()->toDate('j.n.Y') 
        : null;

      $fAuthors = $featuredPost->authors()->isNotEmpty()
        ? $featuredPost->authors()->kti()
        : null;

      $fPhoto    = $featuredPost->authorPhoto()->toFile();
      $fPhotoAlt = $fPhoto ? $fPhoto->alt()->or($fAuthors ?? 'Autor:in')->kti() : null;
      $fPdf      = $featuredPost->downloadPdf()->toFile();
    ?>

    <section class="featured-post-section">
      <h2 class="beitraege-subtitle">Aktueller Beitrag</h2>

      <article class="featured-post-card" x-data="{ open: false }" :class="{ 'is-open': open }">
        
        <!-- Toggle-Button (oben rechts) -->
        <button class="toggle-btn" type="button" @click="open = !open" :aria-expanded="open" aria-label="Beitrag umschalten">
          <span class="toggle-icon"></span>
        </button>

        <!-- Meta (Datum, Titel, Autor) -->
        <div class="post-header-row">
          <div class="post-meta-info" @click="open = !open">
            <?php if ($fDate): ?>
              <p class="post-date"><?= $fDate ?></p>
            <?php endif ?>

            <h3 class="post-title"><?= $featuredPost->title()->kti() ?></h3>

            <?php if ($fAuthors): ?>
              <p class="post-author">von <?= $fAuthors ?></p>
            <?php endif ?>
          </div>
        </div>

        <!-- 2-Spalten-Grid (350px links | Text rechts) -->
        <div class="post-content-grid">
          
          <div class="photo-column">
            <?php if ($fPhoto): ?>
              <figure class="author-photo-wrapper">
                <img src="<?= $fPhoto->url() ?>" alt="<?= $fPhotoAlt ?>" class="author-photo">
                <?php if ($fPhoto->alt()->isNotEmpty()): ?>
                  <small class="photo-caption"><?= $fPhoto->alt()->kti() ?></small>
                <?php endif ?>
              </figure>
            <?php endif ?>
          </div>

          <div class="text-column">
            <div class="preview-text" @click="open = true">
              <div class="text-content">
                <?= $featuredPost->description()->or($featuredPost->body())->kt() ?>
              </div>
            </div>

            <div class="full-text">
              <div class="text-content">
                <?= $featuredPost->body()->or($featuredPost->description())->kt() ?>
              </div>

              <?php if ($fPdf): ?>
                <div class="pdf-download-wrapper">
                  <a href="<?= $fPdf->url() ?>" class="pdf-button" target="_blank" rel="noopener noreferrer">
                    ↘ Download als PDF
                  </a>
                </div>
              <?php endif ?>
            </div>
          </div>

        </div>

      </article>
    </section>
  <?php endif ?>


  <!-- 2. WEITERE BLOGBEITRÄGE (PINK-FARBENE LISTE) - Öffnen das hellblaue Modal -->
  <!-- 2. WEITERE BLOGBEITRÄGE (PINK-FARBENE LISTE) - Öffnen das hellblaue Modal -->
  <?php if ($otherPosts && $otherPosts->count() > 0): ?>
    <!-- Wir legen den Alpine.js Scope um die Sektion UND das Overlay -->
    <div x-data>
      <section class="other-posts-section">
        <h2 class="beitraege-subtitle">Weitere Blogbeiträge</h2>

        <div class="interactive-list interactive-list--pink">
          <?php foreach ($otherPosts as $post): ?>
            <?php 
              $pDate = $post->date()->isNotEmpty() 
                ? $post->date()->toDate('j.n.Y') 
                : null;

              $pAuthors = $post->authors()->isNotEmpty() 
                ? $post->authors()->kti() 
                : null;
            ?>
            
            <!-- Der Klick sendet das Event "open-modal" in das window-Objekt -->
            <article 
              class="interactive-list-item" 
              @click="$dispatch('open-modal', { id: '<?= $post->slug() ?>' })"
              style="cursor: pointer;"
            >
              
              <button class="toggle-btn" type="button" aria-label="Beitrag im Modal öffnen">
                <span class="toggle-icon"></span>
              </button>

              <div class="list-item-header-row">
                <div class="list-item-main">
                  <?php if ($pDate): ?>
                    <p class="item-date"><?= $pDate ?></p>
                  <?php endif ?>

                  <h3 class="item-title"><?= $post->title()->kti() ?></h3>

                  <?php if ($pAuthors): ?>
                    <p class="item-subinfo">von <?= $pAuthors ?></p>
                  <?php endif ?>
                </div>

                <div class="list-item-desc">
                  <p><?= $post->description()->or($post->body())->excerpt(220) ?></p>
                </div>
              </div>

            </article>
          <?php endforeach ?>
        </div>
      </section>

      <!-- Das Modal-Overlay reagiert auf das Event "open-modal.window" -->
      <?php snippet('aktuelles-overlay', ['cardEntries' => $otherPosts]) ?>
    </div>
  <?php endif ?>

</main>

<?php snippet('footer') ?>
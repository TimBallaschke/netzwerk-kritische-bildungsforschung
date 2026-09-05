<?php snippet('header') ?>





<!-- Braunes Kategorie-Banner unter dem Header -->
<div class="category-banner">
  <span><?= $page->title()->kti() ?></span>
</div>

<main class="page-seminarplaene">

  <!-- Kopfbereich mit Haupt-Headline & eingerückter Einleitung -->
  <header class="seminarplaene-header">
    <h1 class="seminarplaene-title">
      <?= $page->introHeadline()->or($page->title())->kti() ?>
    </h1>

    <div class="seminarplaene-intro-grid">
      <div class="seminarplaene-intro-text">
        <?php if ($page->intro()->isNotEmpty()): ?>
          <div class="text-content">
            <?= $page->intro()->kt() ?>
          </div>
        <?php endif ?>

        <!-- Kontaktbereich -->
        <?php if ($page->kontaktText()->isNotEmpty() || $page->kontaktEmail()->isNotEmpty()): ?>
          <div class="seminarplaene-contact">
            <?php if ($page->kontaktText()->isNotEmpty()): ?>
              <?= $page->kontaktText()->kt() ?>
            <?php endif ?>

            <?php if ($page->kontaktEmail()->isNotEmpty()): ?>
              <p class="email-link">
                ↘ <a href="mailto:<?= $page->kontaktEmail() ?>"><?= $page->kontaktEmail()->kti() ?></a>
              </p>
            <?php endif ?>
          </div>
        <?php endif ?>
      </div>
    </div>
  </header>

  <!-- Bereichs-Überschrift über dem blauen Block -->
  <div class="seminarplaene-section-header">
    <h2>Seminarpläne</h2>
  </div>

  <!-- Blaue Liste der Seminarpläne -->
  <?php $plaene = $page->plaene()->toStructure(); ?>
  <?php if ($plaene->isNotEmpty()): ?>
    <section class="seminarplaene-blue-box">
      <div class="seminarplaene-list">
        <?php foreach ($plaene as $plan): ?>
        <article class="seminarplan-item">
            
            <div class="seminarplan-info">
            <p class="seminarplan-dozierende"><?= $plan->dozierende()->html() ?></p>
            <h3 class="seminarplan-titel">
                <span class="bullet">●</span> <?= $plan->titel()->html() ?>
            </h3>
            </div>

            <!-- Button erscheint NUR, wenn ein PDF im Backend hinterlegt ist -->
            <?php if ($plan->pdf()->isNotEmpty() && ($pdf = $plan->pdf()->toFile())): ?>
            <div class="seminarplan-action">
                <a class="pdf-button" href="<?= $pdf->url() ?>" target="_blank" rel="noopener noreferrer">
                ↘ Link zum PDF
                </a>
            </div>
            <?php endif ?>

        </article>
        <?php endforeach ?>
      </div>
    </section>
  <?php endif ?>

</main>

<?php snippet('footer') ?>
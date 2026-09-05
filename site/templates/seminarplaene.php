<?php snippet('header', ['categoryTitle' => $page->title()]) ?>

<div class="page-seminarplaene">

  <!-- Kopfbereich mit Haupt-Headline & eingerückter Einleitung -->
  <header class="seminarplaene-header">
    <h1 class="seminarplaene-title">
      <?= str_replace("\u{2028}", '<br>', $page->introHeadline()->or($page->title())->kti()) ?>
    </h1>

    <div class="seminarplaene-intro-grid">
      <div class="seminarplaene-intro-text">
        <?php if ($page->intro()->isNotEmpty()): ?>
          <div class="text-content">
            <?= $page->intro()->prose() ?>
          </div>
        <?php endif ?>

        <!-- Kontaktbereich -->
        <?php if ($page->kontaktText()->isNotEmpty() || $page->kontaktEmailTitle()->isNotEmpty() || $page->kontaktEmail()->isNotEmpty()): ?>
          <div class="seminarplaene-contact text-content">
            <?php if ($page->kontaktText()->isNotEmpty()): ?>
              <?= $page->kontaktText()->prose() ?>
            <?php endif ?>

            <?php if ($page->kontaktEmailTitle()->isNotEmpty()): ?>
              <p class="email-title"><?= $page->kontaktEmailTitle()->kti() ?></p>
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

  <?php snippet('content-list', [
      'title' => 'Seminarpläne',
      'items' => $page->plaene()->toStructure(),
      'variant' => 'downloads',
  ]) ?>

</div>

<?php snippet('footer') ?>

<!DOCTYPE html>
<html lang="<?= $kirby->language() ? $kirby->language()->code() : 'de' ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $page->title() ?></title>
  <?= css('assets/style.css') ?>
</head>
<body>
  <div class="sidebar">
    <div class="sidebar-content">
      <div class="aktuelles-cards">
        <?php
          $aktuelles = page('aktuelles');
          $items = $aktuelles ? $aktuelles->children()->listed()->sortBy('date', 'desc') : null;
        ?>
        <?php if (!$items || $items->count() === 0): ?>
          <?php for ($i = 0; $i < 3; $i++): ?>
            <div class="aktuelles-card" style="--i: <?= $i ?>">
              <div class="card-image"></div>
              <div class="card-text">
                <div class="card-title">Noch keine Inhalte veröffentlicht</div>
              </div>
            </div>
          <?php endfor ?>
        <?php else: ?>
          <?php $i = 0; foreach ($items as $item): ?>
            <div class="aktuelles-card" style="--i: <?= $i++ ?>">
              <div class="card-image"></div>
              <div class="card-text">
                <div class="card-title"><?= $item->title()->html() ?></div>
              </div>
            </div>
          <?php endforeach ?>
        <?php endif ?>
      </div>
    </div>
  </div>
  <div class="scroll-overlay"></div>
  <?= js('assets/script.js') ?>
</body>
</html>

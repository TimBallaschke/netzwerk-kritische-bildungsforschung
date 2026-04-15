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
        <?php for ($i = 0; $i < 20; $i++): ?>
          <div class="aktuelles-card" style="--i: <?= $i ?>">
            <div class="card-image"></div>
            <div class="card-text">
              <div class="card-title">Title</div>
            </div>
          </div>
        <?php endfor ?>
      </div>
    </div>
  </div>
  <div class="scroll-overlay"></div>
  <?= js('assets/script.js') ?>
</body>
</html>

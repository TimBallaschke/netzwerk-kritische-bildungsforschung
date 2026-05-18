<!DOCTYPE html>
<html lang="<?= kirby()->language() ? kirby()->language()->code() : 'de' ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $page->isHomePage() ? $site->title() : $page->title() . ' – ' . $site->title() ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist&display=swap">
  <?= css('assets/style/style.css') ?>
</head>
<body>
<header class="site-header">
  <h1 class="site-header__title">Netzwerk Kritische<br>Bildungsforschung</h1>
  <nav class="site-header__nav" aria-label="Hauptmenü">
    <ul>
      <li><a href="<?= url('ueber-uns') ?>">Über Uns</a></li>
      <li><a href="<?= url('beitraege') ?>">Beiträge</a></li>
      <li><a href="<?= url('seminarplaene') ?>">Seminarpläne</a></li>
    </ul>
  </nav>
</header>
<main>

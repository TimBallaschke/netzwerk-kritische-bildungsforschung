<!DOCTYPE html>
<html lang="<?= kirby()->language() ? kirby()->language()->code() : 'de' ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">  <title><?= $page->isHomePage() ? $site->title() : $page->title() . ' – ' . $site->title() ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist&display=swap">
  <?php $styleFile = 'assets/style/style.css'; ?>
  <?= css($styleFile . '?v=' . filemtime(kirby()->root('index') . '/' . $styleFile)) ?>
</head>
<body>

<header class="site-header">


    <h1 class="site-header__title">
      <a href="<?= $site->url() ?>" class="site-header__title-link">Netzwerk Kritische<br>Bildungsforschung </a>
    </h1>


    <nav class="site-header__nav" aria-label="Hauptmenü">
      <!-- line top -->
      <hr> 

      <ul>
        <?php if ($p = page('ueber-uns')): ?>
          <li>
            <a 
              href="<?= $p->url() ?>" 
              data-label="Über Uns"
              class="<?= $p->isOpen() ? 'is-active' : '' ?>"
              <?= $p->isOpen() ? 'aria-current="page"' : '' ?>
            >
              <span>Über Uns</span>
            </a>
          </li>
        <?php endif ?>

        <?php if ($p = page('aktuelles/beitraege') ?? site()->index()->find('beitraege')): ?>
          <li>
            <a 
              href="<?= $p->url() ?>" 
              data-label="Beiträge"
              class="<?= $p->isOpen() ? 'is-active' : '' ?>"
              <?= $p->isOpen() ? 'aria-current="page"' : '' ?>
            >
              <span>Beiträge</span>
            </a>
          </li>
        <?php endif ?>

        <?php if ($p = page('seminarplaene')): ?>
          <li>
            <a 
              href="<?= $p->url() ?>" 
              data-label="Seminarpläne"
              class="<?= $p->isOpen() ? 'is-active' : '' ?>"
              <?= $p->isOpen() ? 'aria-current="page"' : '' ?>
            >
              <span>Seminarpläne</span>
            </a>
          </li>
        <?php endif ?>

      </ul>
      <!-- line bottom -->
      <hr> 
    </nav>
      <!-- line bottom -->
      <hr> 
</header>



<main>
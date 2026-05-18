<!DOCTYPE html>
<html lang="<?= kirby()->language() ? kirby()->language()->code() : 'de' ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $page->isHomePage() ? $site->title() : $page->title() . ' – ' . $site->title() ?></title>
  <?= css('assets/style/style.css') ?>
</head>
<body>
<main>

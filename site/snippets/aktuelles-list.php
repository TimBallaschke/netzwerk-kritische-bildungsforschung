<?php snippet('content-list', [
    'items' => $entriesPages ?? site()->aktuellesFeed(),
    'variant' => 'feed',
    'title' => null,
    'label' => 'Aktuelles',
]) ?>

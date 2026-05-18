<?php
// Carousel cards come from the same content as the Liste view (the
// `aktuelles` blueprint) — without the description. type -> display
// label + category color (color must match CORNER_* in aktuelles.js;
// label mapping mirrors aktuelles-list.php).
$typeMeta = [
  'veranstaltung'   => ['label' => 'Veranstaltung',  'color' => '#005436'],
  'notiz'           => ['label' => 'Notiz',           'color' => '#4965e6'],
  'blog'            => ['label' => 'Blog',            'color' => '#fcbacd'],
  'call-for-papers' => ['label' => 'Call for Papers', 'color' => '#f3511c'],
  'publikation'     => ['label' => 'Publikation',     'color' => '#8a4fff'],
];
$container     = page('aktuelles');
$cardEntries   = $container ? $container->children()->listed() : [];
?>
<section
  class="aktuelles"
  aria-label="Aktuelles"
  x-data="{ view: 'grafik' }"
  x-effect="window.dispatchEvent(new CustomEvent('aktuelles:view', { detail: { list: view === 'liste' } }))"
>
  <div class="aktuelles__switch" role="group" aria-label="Ansicht wechseln">
    <span class="aktuelles__switch-thumb" :class="`is-${view}`" aria-hidden="true"></span>
    <button type="button" class="aktuelles__switch-option" :class="{ 'is-active': view === 'grafik' }" :aria-pressed="view === 'grafik'" @click="view = 'grafik'">Grafik</button>
    <button type="button" class="aktuelles__switch-option" :class="{ 'is-active': view === 'liste' }" :aria-pressed="view === 'liste'" @click="view = 'liste'">Liste</button>
  </div>

  <div class="aktuelles__stage" x-show="view === 'grafik'">
    <svg class="aktuelles__connectors"></svg>
    <div class="aktuelles__ring">
      <div class="aktuelles__dot"></div>
      <div class="aktuelles__label">Aktuelles</div>
      <?php foreach ($cardEntries as $entry): ?>
        <?php $typeKey = $entry->type()->or('veranstaltung')->value(); ?>
        <?php $meta = $typeMeta[$typeKey] ?? ['label' => ucfirst($typeKey), 'color' => '#612c00']; ?>
        <?php snippet('aktuelles-card', [
          'type'        => $meta['label'],
          'title'       => $entry->title()->value(),
          'subinfo'     => $entry->subinfo()->value(),
          'description' => $entry->description()->value(),
          'color'       => $meta['color'],
        ]) ?>
      <?php endforeach ?>
    </div>
  </div>

  <button type="button" class="aktuelles__playpause" aria-label="Animation pausieren" aria-pressed="false" x-show="view === 'grafik'">
    <span class="aktuelles__playpause-icon aktuelles__playpause-icon--pause" aria-hidden="true">
      <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
    </span>
    <span class="aktuelles__playpause-icon aktuelles__playpause-icon--play" aria-hidden="true">
      <svg viewBox="0 0 24 24"><polygon points="7 4 20 12 7 20"></polygon></svg>
    </span>
  </button>

  <div class="aktuelles__list" x-show="view === 'liste'" x-cloak>
    <?php /* Static visual copy of the carousel's filter pills — not wired
             to any filtering yet. Keep labels in sync with CORNER_LABELS
             in aktuelles.js. */ ?>
    <div class="aktuelles__filters" role="group" aria-label="Filter">
      <button type="button" class="aktuelles__filter">Veranstaltungen</button>
      <button type="button" class="aktuelles__filter">Notizen</button>
      <button type="button" class="aktuelles__filter">Beiträge</button>
      <button type="button" class="aktuelles__filter">Call for Papers</button>
      <button type="button" class="aktuelles__filter">Publikationen</button>
    </div>
    <?php snippet('aktuelles-list') ?>
  </div>
</section>

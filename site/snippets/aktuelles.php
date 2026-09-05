<?php
$typeMeta = [
  'veranstaltung'   => ['label' => 'Veranstaltung',  'color' => '#6EF3FF'],
  'notiz'           => ['label' => 'Notiz',           'color' => '#4965e6'],
  'beitrag'         => ['label' => 'Beiträge',        'color' => '#fcbacd'],
  'call-for-papers' => ['label' => 'Call for Papers', 'color' => '#f3511c'],
  'publikation'     => ['label' => 'Publikation',     'color' => '#8a4fff'],
];

$cardEntries = $cardEntries ?? site()->aktuellesFeed();
?>

<section
  class="aktuelles"
  aria-label="Aktuelles"
  x-data="{ view: 'grafik', activeFilter: null, isMobile: window.matchMedia('(max-width: 900px)').matches }"
  @resize.window="isMobile = window.matchMedia('(max-width: 900px)').matches"
  x-init="
    $watch('activeFilter', key => {
      window.dispatchEvent(new CustomEvent('aktuelles:filter-from-alpine', { detail: { key: key } }));
    })
  "
  @aktuelles:filter-from-js.window="activeFilter = $event.detail.key"
  x-effect="window.dispatchEvent(new CustomEvent('aktuelles:view', { detail: { list: view === 'liste' } }))"
>
  <div class="aktuelles__switch" role="group" aria-label="Ansicht wechseln">
    <span class="aktuelles__switch-thumb" :class="`is-${view}`" aria-hidden="true"></span>
    <button type="button" class="aktuelles__switch-option" :class="{ 'is-active': view === 'grafik' }" :aria-pressed="view === 'grafik'" @click="view = 'grafik'">Grafik</button>
    <button type="button" class="aktuelles__switch-option" :class="{ 'is-active': view === 'liste' }" :aria-pressed="view === 'liste'" @click="view = 'liste'">Liste</button>
  </div>

  <div class="aktuelles__stage" x-show="view === 'grafik'">
    <svg class="aktuelles__connectors"></svg>
    <div class="aktuelles__focus-backdrop" aria-hidden="true"></div>
    <div class="aktuelles__ring">
      <div class="aktuelles__dot"></div>
      <div class="aktuelles__label">Aktuelles</div>
      <?php foreach (($cardEntries ?? []) as $entry): ?>
        <?php $typeKey = $entry->intendedTemplate()->name(); ?>
        <?php $meta = $typeMeta[$typeKey] ?? ['label' => ucfirst($typeKey), 'color' => '#612c00']; ?>
        <?php snippet('aktuelles-card', [
          'id'          => $entry->id(),
          'type'        => $meta['label'],
          'title'       => $entry->title()->value(),
          'subinfo'     => snippet('entry-subinfo', ['item' => $entry], true),
          'date'        => $typeKey === 'veranstaltung' && $entry->date()->isNotEmpty() ? $entry->date()->toDate('j.n.Y') : '',
          'description' => $entry->description()->value(),
          'color'       => $meta['color'],
          'linkType'    => $typeKey === 'beitrag' ? 'self' : $entry->linkType()->or('self')->value(),
          'externalUrl' => $entry->externalUrl()->value(),
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
    <div class="aktuelles__filters" role="group" aria-label="Filter">
      <button
        type="button"
        class="aktuelles__filter"
        :class="{ 'is-active': activeFilter === 'veranstaltung' }"
        :aria-pressed="activeFilter === 'veranstaltung'"
        @click="activeFilter = activeFilter === 'veranstaltung' ? null : 'veranstaltung'"
      >
        Veranstaltungen
      </button>
      <button
        type="button"
        class="aktuelles__filter"
        :class="{ 'is-active': activeFilter === 'notiz' }"
        :aria-pressed="activeFilter === 'notiz'"
        @click="activeFilter = activeFilter === 'notiz' ? null : 'notiz'"
      >
        Notizen
      </button>
      <button
        type="button"
        class="aktuelles__filter"
        :class="{ 'is-active': activeFilter === 'beitrag' }"
        :aria-pressed="activeFilter === 'beitrag'"
        @click="activeFilter = activeFilter === 'beitrag' ? null : 'beitrag'"
      >
        Beiträge
      </button>
      <button
        type="button"
        class="aktuelles__filter"
        :class="{ 'is-active': activeFilter === 'call-for-papers' }"
        :aria-pressed="activeFilter === 'call-for-papers'"
        @click="activeFilter = activeFilter === 'call-for-papers' ? null : 'call-for-papers'"
      >
        Call for Papers
      </button>
      <button
        type="button"
        class="aktuelles__filter"
        :class="{ 'is-active': activeFilter === 'publikation' }"
        :aria-pressed="activeFilter === 'publikation'"
        @click="activeFilter = activeFilter === 'publikation' ? null : 'publikation'"
      >
        Publikationen
      </button>
    </div>
    <?php snippet('aktuelles-list', ['entriesPages' => $cardEntries]) ?>
  </div>

  <!-- OVERLAY MODAL RUFE ICH HIER EIN -->
  <?php snippet('aktuelles-overlay', ['cardEntries' => $cardEntries]) ?>
</section>

<?php
/**
 * Aktuelles list
 *
 * Renders Aktuelles entries by delegating each one to the
 * aktuelles-list-item snippet.
 *
 * Data source (in order of precedence):
 *   1. `items`        — an explicit array of associative arrays (type,
 *                        date, title, subinfo, description). Use this to
 *                        reuse the list with a hand-picked set.
 *   2. `entriesPages` — a Kirby Pages collection of Aktuelles entries
 *                        (e.g. a pre-filtered selection).
 *   3. default        — all entries across the Aktuelles Rubriken whose
 *                        "In Aktuelles zeigen" toggle is on, newest first.
 *
 * NOTE: do not name the collection param `$pages` — that is a built-in
 * Kirby snippet variable (the site's top-level pages) and would shadow it.
 *
 * The entry "type" is its TEMPLATE (beitrag / veranstaltung / …).
 */

// Map the entry's template to its display label.
$typeLabels = [
  'veranstaltung'   => 'Veranstaltung',
  'call-for-papers' => 'Call for Papers',
  'beitrag'         => 'Beiträge',
  'notiz'           => 'Notiz',
  'publikation'     => 'Publikation',
];

$items = $items ?? null;

if ($items === null) {
  $entries = $entriesPages ?? null;

  if ($entries === null) {
    $entries = site()->aktuellesFeed();
  }

  $items = [];
  foreach (($entries ?? []) as $entry) {
    $typeKey = $entry->intendedTemplate()->name();
    $items[] = [
      'type'        => $typeLabels[$typeKey] ?? ucfirst($typeKey),
      // Kirby stores dates as Y-m-d; the design uses no leading zeros.
      'date'        => $entry->date()->isNotEmpty() ? $entry->date()->toDate('j.n.Y') : null,
      'title'       => $entry->title()->value(),
      // `subinfo` is a writer field — already HTML (e.g. <em> for names).
      'subinfo'     => $entry->subinfo()->value(),
      'description' => $entry->description()->value(),
    ];
  }
}

if (empty($items)) {
  return;
}
?>
<section class="aktuelles-list" aria-label="Aktuelles">
  <?php foreach ($items as $item): ?>
    <?php snippet('aktuelles-list-item', $item) ?>
  <?php endforeach ?>
</section>

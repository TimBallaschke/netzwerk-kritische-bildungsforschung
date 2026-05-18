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
 *   2. `entriesPages` — a Kirby Pages collection of `aktuelles` entries
 *                        (e.g. a pre-filtered selection).
 *   3. default        — children of the `aktuelles` container page.
 *
 * NOTE: do not name the collection param `$pages` — that is a built-in
 * Kirby snippet variable (the site's top-level pages) and would shadow it.
 *
 * Entry pages use the `aktuelles` blueprint, so this same content can be
 * surfaced elsewhere (e.g. Beiträge) without going through this snippet.
 */

// Map the blueprint's stored `type` value to its display label.
$typeLabels = [
  'veranstaltung'   => 'Veranstaltung',
  'call-for-papers' => 'Call for Papers',
  'blog'            => 'Blog',
  'notiz'           => 'Notiz',
  'publikation'     => 'Publikation',
];

$items = $items ?? null;

if ($items === null) {
  $entries = $entriesPages ?? null;

  if ($entries === null && $container = page('aktuelles')) {
    $entries = $container->children()->listed();
  }

  $items = [];
  foreach (($entries ?? []) as $entry) {
    $typeKey = $entry->type()->or('veranstaltung')->value();
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

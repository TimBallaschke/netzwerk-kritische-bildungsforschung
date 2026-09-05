<?php
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
      'id'          => $entry->slug(), // Wichtig: slug() nutzen für das Modal Matching
      'typeKey'     => $typeKey,
      'type'        => $typeLabels[$typeKey] ?? ucfirst($typeKey),
      'date'        => $entry->date()->isNotEmpty() ? $entry->date()->toDate('j.n.Y') : null,
      'title'       => $entry->title()->value(),
      'subinfo'     => $entry->subinfo()->kirbytextinline(),
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
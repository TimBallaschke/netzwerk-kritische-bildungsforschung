<?php
/**
 * Shared section and rows for posts, events, downloads and the filtered feed.
 * Pass a title, a Kirby collection as items, and one of the variants below.
 */
$themes = ['posts' => 'pink', 'events' => 'blue', 'downloads' => 'seminar-blue', 'feed' => 'blue'];
if (!isset($themes[$variant])) {
    throw new InvalidArgumentException('Unknown content-list variant: ' . $variant);
}
if ($items->isEmpty()) return;
$listId = $id ?? 'content-list-' . sha1((($page ?? null)?->id() ?? 'standalone') . '-' . $variant);
$hasHeading = isset($title) && trim((string) $title) !== '';
$index = 0;
?>
<section class="content-list content-list--<?= $variant ?>"<?php if ($hasHeading): ?> aria-labelledby="<?= esc($listId, 'attr') ?>-heading"<?php else: ?> aria-label="<?= esc($label ?? 'Aktuelles', 'attr') ?>"<?php endif ?><?php if (in_array($variant, ['posts', 'events', 'feed'], true)): ?> x-data<?php endif ?>>
  <?php if ($hasHeading): ?>
    <h2 class="content-list__heading" id="<?= esc($listId, 'attr') ?>-heading"><?= kirbytextinline((string) $title) ?></h2>
  <?php endif ?>

  <div class="interactive-list interactive-list--<?= $themes[$variant] ?>">
    <?php foreach ($items as $item): ?>
      <?php snippet('content-list-item', [
          'item' => $item,
          'variant' => $variant,
          'itemId' => $listId . '-' . $index++,
      ]) ?>
    <?php endforeach ?>
  </div>
</section>

<?php if (in_array($variant, ['posts', 'events'], true)): ?>
  <?php snippet('aktuelles-overlay', ['cardEntries' => $items]) ?>
<?php endif ?>

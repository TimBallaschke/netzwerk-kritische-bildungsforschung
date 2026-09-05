<?php
$isPost = $variant === 'posts';
$isFeed = $variant === 'feed';
$isEvent = $variant === 'events';
$linkType = $isPost ? 'self' : $item->linkType()->or('self')->value();
$externalUrl = trim((string) $item->externalUrl()->value());
$hasExternalLink = $linkType === 'external'
    && filter_var($externalUrl, FILTER_VALIDATE_URL) !== false
    && in_array(strtolower((string) parse_url($externalUrl, PHP_URL_SCHEME)), ['http', 'https'], true);
$isDialogRow = ($isFeed || $isEvent) && $linkType === 'self';
$isDownload = $variant === 'downloads';
$title = $isDownload ? $item->titel() : $item->title();
$subtitle = $isPost ? $item->authors() : $item->subinfo();
$pdf = $isDownload ? $item->pdf()->toFile() : null;
$titleId = $itemId . '-title';
$typeKey = $isFeed ? $item->intendedTemplate()->name() : null;
$typeLabels = [
    'veranstaltung' => 'Veranstaltung',
    'call-for-papers' => 'Call for Papers',
    'beitrag' => 'Beiträge',
    'notiz' => 'Notiz',
    'publikation' => 'Publikation',
];
?>
<?php if ($isPost): ?>
<a class="interactive-list-item post-list-link" href="<?= esc($item->url(), 'attr') ?>" aria-labelledby="<?= esc($titleId, 'attr') ?>"
   data-id="<?= esc($item->id(), 'attr') ?>" aria-haspopup="dialog"
   @click.prevent="$dispatch('open-modal', { id: $el.dataset.id })">
<?php else: ?>
<article class="interactive-list-item" data-link-type="<?= esc($linkType, 'attr') ?>" aria-labelledby="<?= esc($titleId, 'attr') ?>"
  <?php if ($isFeed || $isEvent): ?>data-id="<?= esc($item->id(), 'attr') ?>"<?php endif ?>
  <?php if ($isDialogRow): ?>
    @click="if (!$event.target.closest('a')) $dispatch('open-modal', { id: $el.dataset.id })"
  <?php endif ?>
  <?php if ($isFeed): ?>
    data-type="<?= esc($typeKey, 'attr') ?>"
    x-show="(typeof isMobile !== 'undefined' && isMobile) || typeof activeFilter === 'undefined' || !activeFilter || activeFilter === $el.dataset.type"
  <?php endif ?>
>
<?php endif ?>

  <?php if ($isPost): ?>
    <span class="toggle-btn" aria-hidden="true"><span class="toggle-icon"></span></span>
  <?php elseif ($isDialogRow): ?>
    <button class="toggle-btn" type="button" aria-haspopup="dialog" aria-label="<?= esc($title->value() . ' im Overlay öffnen', 'attr') ?>">
      <span class="toggle-icon" aria-hidden="true"></span>
    </button>
  <?php elseif ($hasExternalLink): ?>
    <a class="toggle-btn" href="<?= esc($externalUrl, 'attr') ?>" target="_blank" rel="noopener noreferrer" aria-label="<?= esc($item->externalUrlTitle()->or('Externe Ressource öffnen')->value(), 'attr') ?> (neuer Tab)">
      <span class="toggle-icon" aria-hidden="true"></span>
    </a>
  <?php endif ?>

  <div class="list-item-header-row">
    <div class="list-item-main">
      <?php if ($isDownload): ?>
        <?php if ($item->dozierende()->isNotEmpty()): ?>
          <p class="item-subinfo"><?= $item->dozierende()->html() ?></p>
        <?php endif ?>
      <?php elseif ($isFeed || $item->date()->isNotEmpty()): ?>
        <p class="item-date">
          <?php if ($isFeed): ?><span class="item-type-label"><?= esc($typeLabels[$typeKey] ?? ucfirst($typeKey)) ?>:</span><?php endif ?>
          <?php if ($item->date()->isNotEmpty()): ?><span class="item-date-value"><?= $item->date()->toDate('j.n.Y') ?></span><?php endif ?>
        </p>
      <?php endif ?>

      <h3 class="item-title" id="<?= esc($titleId, 'attr') ?>">
        <?php if ($isDownload): ?><span aria-hidden="true">●</span> <?php endif ?><?php if ($hasExternalLink): ?><a href="<?= esc($externalUrl, 'attr') ?>" target="_blank" rel="noopener noreferrer"><?php endif ?><?= $isDownload ? $title->html() : $title->kti() ?><?php if ($hasExternalLink): ?></a><?php endif ?>
      </h3>

      <?php if (!$isDownload): ?>
        <?php $subline = snippet('entry-subinfo', ['item' => $item], true); ?>
        <?php if (trim($subline) !== ''): ?><p class="item-subinfo"><?= $subline ?></p><?php endif ?>
      <?php endif ?>
    </div>

    <?php if ($isDownload): ?>
      <?php if ($pdf): ?>
        <div class="content-list__action">
          <?php snippet('pdf-button', ['pdf' => $pdf, 'ariaLabel' => $title->value() . ' – PDF öffnen']) ?>
        </div>
      <?php endif ?>
    <?php else: ?>
      <div class="list-item-desc">
        <p><?= $linkType === 'none' ? $item->description()->kti() : $item->description()->or($isPost ? $item->body() : $item->text())->excerpt(220) ?></p>
      </div>
    <?php endif ?>
  </div>

<?php if ($isPost): ?>
</a>
<?php else: ?>
</article>
<?php endif ?>

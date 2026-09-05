<?php if ($pdf): ?>
  <a class="pdf-button" href="<?= esc($pdf->url(), 'attr') ?>" target="_blank" rel="noopener noreferrer"<?php if (!empty($ariaLabel)): ?> aria-label="<?= esc($ariaLabel, 'attr') ?>"<?php endif ?>>
    <span aria-hidden="true">↘</span>
    <span><?= esc($label ?? 'Download als PDF') ?></span>
  </a>
<?php endif ?>

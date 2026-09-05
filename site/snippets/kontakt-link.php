<?php
if ($link->isEmpty()) {
    return;
}

$value = trim($link->value());
// Older content used a plain text field that also accepted bare email addresses.
$href = Kirby\Toolkit\V::email($value) ? 'mailto:' . $value : $link->toUrl();
$label = $title->isNotEmpty() ? $title->value() : preg_replace('/^mailto:/i', '', $value);
?>
<p class="kontakt-link">
  <span aria-hidden="true">↘</span> <a href="<?= esc($href, 'attr') ?>"><?= esc($label) ?></a>
</p>

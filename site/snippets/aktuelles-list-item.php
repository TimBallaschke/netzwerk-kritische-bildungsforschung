<?php
/**
 * Aktuelles list item
 *
 * One row of the "Aktuelles" list: type (+ optional date) and title/subinfo
 * on the left, a short description on the right, and a toggle on the far right.
 *
 * Pass data via the second snippet() argument, e.g.:
 *   snippet('aktuelles-list-item', [
 *     'type'        => 'Veranstaltung',
 *     'date'        => '8.6.2026',          // optional — typically only Veranstaltung
 *     'title'       => 'Jenseits der Unhaltbarkeit: …',
 *     'subinfo'     => 'Tagung mit <em>Hannelore Wolb</em> (Miteinander e.V.)',
 *     'description' => 'Der Vortrag nimmt …',
 *   ])
 *
 * `type` is one of: Veranstaltung, Call for Papers, Blog, Notiz.
 * `subinfo` may contain inline <em> for names (rendered italic).
 */

$type        = $type        ?? 'Veranstaltung';
$date        = $date        ?? '8.6.2026';
$title       = $title       ?? 'Jenseits der Unhaltbarkeit: Systemwechsel in der postliberalen Moderne';
$subinfo     = $subinfo     ?? 'Tagung mit <em>Hannelore Wolb</em> (Miteinander e.V.)';
$description = $description  ?? 'Der Vortrag nimmt die gegenwärtige Konjunktur des Kompetenzbegriffs in den Blick. Ausgehend von der These, dass Kompetenz als pädagogische Leitkategorie eine doppelte Funktion erfüllt – sie verspricht individuelle Entfaltung und organisiert zugleich die Anpassung an ökonomische Verwertungslogiken –, soll gefragt werden, wie sich dieses Spannungsverhältnis in aktuellen Lehrplänen, Prüfungsformaten und Bildungsberichten niederschlägt.';
?>
<article class="aktuelles-item">
  <div class="aktuelles-item__main">
    <p class="aktuelles-item__type">
      <span class="aktuelles-item__type-label"><?= html($type) ?>:</span>
      <?php if ($date): ?><span class="aktuelles-item__date"><?= html($date) ?></span><?php endif ?>
    </p>
    <h2 class="aktuelles-item__title"><?= html($title) ?></h2>
    <?php if ($subinfo): ?>
      <p class="aktuelles-item__subinfo"><?= $subinfo ?></p>
    <?php endif ?>
  </div>

  <div class="aktuelles-item__description">
    <p><?= html($description) ?></p>
  </div>

  <button class="aktuelles-item__toggle" type="button" aria-label="Mehr anzeigen">
    <span class="aktuelles-item__toggle-icon" aria-hidden="true">+</span>
  </button>
</article>

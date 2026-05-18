<?php
/**
 * Aktuelles list
 *
 * Renders a list of "Aktuelles" rows by delegating each entry to the
 * aktuelles-list-item snippet.
 *
 * Pass entries via the second snippet() argument:
 *   snippet('aktuelles-list', ['items' => [
 *     ['type' => 'Veranstaltung', 'date' => '8.6.2026', 'title' => '…', …],
 *     ['type' => 'Blog', 'title' => '…', …],
 *   ]])
 *
 * Each entry is an associative array with the same keys the
 * aktuelles-list-item snippet accepts (type, date, title, subinfo,
 * description). Omitted keys fall back to that snippet's own defaults.
 *
 * With no `items` passed, a placeholder set mirroring the design draft
 * is rendered.
 */

$items = $items ?? [
  [
    'type'        => 'Veranstaltung',
    'date'        => '8.6.2026',
    'title'       => 'Jenseits der Unhaltbarkeit: Systemwechsel in der postliberalen Moderne',
    'subinfo'     => 'Tagung mit <em>Hannelore Wolb</em> (Miteinander e.V.)',
    'description' => 'Der Vortrag nimmt die gegenwärtige Konjunktur des Kompetenzbegriffs in den Blick. Ausgehend von der These, dass Kompetenz als pädagogische Leitkategorie eine doppelte Funktion erfüllt – sie verspricht individuelle Entfaltung und organisiert zugleich die Anpassung an ökonomische Verwertungslogiken –, soll gefragt werden, wie sich dieses Spannungsverhältnis in aktuellen Lehrplänen, Prüfungsformaten und Bildungsberichten niederschlägt.',
  ],
  [
    'type'        => 'Call for Papers',
    'date'        => null,
    'title'       => 'Demokratie und Schule – Anspruch, Widerspruch, Kritik',
    'subinfo'     => 'Deadline 14.7.2026',
    'description' => 'Demokratie und Schule – Anspruch, Widerspruch, Kritik. Netzwerk Kritische Bildungsforschung / Goethe-Universität Frankfurt. Tagung: 18.–19. Juni 2026, Deadline Call: 28. Februar 2026. Eingeladen werden Beiträge, die das Verhältnis von Demokratie und schulischer Bildung aus kritischer Perspektive befragen.',
  ],
  [
    'type'        => 'Blog',
    'date'        => null,
    'title'       => 'Wer kann Kritik üben?',
    'subinfo'     => 'Blogeintrag von <em>Jana Rems</em>',
    'description' => 'Neuer Blogbeitrag von Jonas Reichert zum Thema Leistungsmessung und Selbstoptimierung: Warum der Glaube, Bildungserfolg sei messbar und individuell steuerbar, mehr über gesellschaftliche Verhältnisse verrät als über Lernende selbst. Ein Beitrag über die stille Normierungsmacht standardisierter Tests.',
  ],
  [
    'type'        => 'Notiz',
    'date'        => null,
    'title'       => 'Radiogespräch: »Wer hat Angst vor der Bildungskrise?«',
    'subinfo'     => 'Deutschlandfunk Kultur',
    'description' => 'Deutschlandfunk Kultur, Sendung „Sein und Streit", Oktober 2025. In der Sendung diskutieren Miriam Seidel (Uni Mainz) und ein Vertreter des Deutschen Instituts für Internationale Pädagogische Forschung die Frage, ob der Begriff der Bildungskrise analytische Schärfe besitzt oder primär politisch-rhetorische Funktion erfüllt.',
  ],
  [
    'type'        => 'Veranstaltung',
    'date'        => '14.2.2026',
    'title'       => 'Kritik am System',
    'subinfo'     => 'Podiumsdiskussion mit <em>Max Jansen</em> (Miteinander e.V.) und Naomi Bitrop (Universität Leipzig)',
    'description' => 'Deutschlandfunk Kultur, Sendung „Sein und Streit", Oktober 2025. In der Sendung diskutieren Miriam Seidel (Uni Mainz) und ein Vertreter des Deutschen Instituts für Internationale Pädagogische Forschung die Frage, ob der Begriff der Bildungskrise analytische Schärfe besitzt oder primär politisch-rhetorische Funktion erfüllt. Empfehlenswert als Einstieg in die Debatte.',
  ],
  [
    'type'        => 'Veranstaltung',
    'date'        => '14.2.2026',
    'title'       => 'Titel der Veranstaltung',
    'subinfo'     => 'Podiumsdiskussion mit <em>Max Jansen</em> (Miteinander e.V.) und Naomi Bitrop (Universität Leipzig)',
    'description' => 'Der Vortrag nimmt die gegenwärtige Konjunktur des Kompetenzbegriffs in den Blick. Ausgehend von der These, dass Kompetenz als pädagogische Leitkategorie eine doppelte Funktion erfüllt – sie verspricht individuelle Entfaltung und organisiert zugleich die Anpassung an ökonomische Verwertungslogiken –, soll gefragt werden, wie sich dieses Spannungsverhältnis in aktuellen Lehrplänen, Prüfungsformaten und Bildungsberichten niederschlägt.',
  ],
];
?>
<section class="aktuelles-list" aria-label="Aktuelles">
  <?php foreach ($items as $item): ?>
    <?php snippet('aktuelles-list-item', $item) ?>
  <?php endforeach ?>
</section>

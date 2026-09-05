<?php
// Render real templates with Panel-serialized test data; never save to content/.
require_once dirname(__DIR__, 2) . '/kirby/bootstrap.php';

$kirby = new Kirby(['roots' => ['index' => dirname(__DIR__, 2)]]);
$sourcePage = $kirby->page('ueber-uns');
$paragraph = 'Das Netzwerk verbindet Forscher*innen und Akteur*innen der Bildungspraxis. Gemeinsam diskutieren wir Perspektiven einer <em>kritischen Bildungsforschung</em> und die Bedingungen gesellschaftlicher Veränderung.';
$sections = [
    [
        'zwischenueberschrift' => 'Was ist das Netzwerk, wie versteht es sich?',
        'fliesstext' => $paragraph . "\n\n" . $paragraph,
    ],
    [
        'zwischenueberschrift' => 'Wer kann wie mitmachen?',
        'fliesstext' => $paragraph,
        'kontakte' => [
            ['name' => 'Anna Beispiel', 'email' => 'anna@example.org'],
            ['name' => 'Robin Muster', 'email' => 'robin@example.org'],
            ['name' => 'Dr. A & B', 'email' => 'sehr.lange.kontaktadresse@bildungsforschung.example.org'],
            ['name' => 'Person ohne öffentliche E-Mail', 'email' => ''],
        ],
        'kontaktlink' => 'mailto:mitmachen@example.org',
        'kontaktlinktitle' => 'Kontakt zum Netzwerk',
    ],
    [
        'zwischenueberschrift' => 'Vorstellung Arbeitskreis (AK) am Institut für Sozialforschung (IfS)',
        'fliesstext' => $paragraph,
        'kontaktlink' => 'https://example.org/arbeitskreis?thema=bildung&sprache=de',
        'kontaktlinktitle' => 'Informationen zum Arbeitskreis',
    ],
];

$form = new Kirby\Form\Form(fields: $sourcePage->blueprint()->fields(), model: $sourcePage);
$form->fill(array_merge($sourcePage->content()->toArray(), ['vertiefungsbloecke' => $sections]));
$stored = $form->toStoredValues();
$fixturePage = new Kirby\Cms\Page([
    'slug' => 'ueber-uns-test',
    'template' => 'ueber-uns',
    'content' => array_merge($sourcePage->content()->toArray(), $stored),
]);

return ['page' => $fixturePage, 'form' => $form];

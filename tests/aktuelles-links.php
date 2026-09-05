<?php
require dirname(__DIR__) . '/kirby/bootstrap.php';

$kirby = new Kirby(['roots' => ['index' => dirname(__DIR__)]]);
$cases = [];
$entries = [];
foreach (['veranstaltung', 'notiz', 'publikation', 'call-for-papers'] as $template) {
    foreach ([
        'internal' => ['self', ''],
        'external' => ['external', 'https://example.org/resource?a=1&b=2'],
        'none' => ['none', 'https://example.org/ignored'],
        'missing-url' => ['external', ''],
        'invalid-url' => ['external', 'javascript:alert(1)'],
        'legacy' => ['', ''],
    ] as $mode => [$linkType, $externalUrl]) {
        $cases[] = compact('template', 'mode', 'linkType', 'externalUrl');
    }
}
// Beiträge have no link selector in the Panel and always open their own content.
$cases[] = ['template' => 'beitrag', 'mode' => 'post', 'linkType' => '', 'externalUrl' => ''];
$cases[] = ['template' => 'beitrag', 'mode' => 'legacy-post', 'linkType' => 'external', 'externalUrl' => 'https://example.org/old'];

foreach ($cases as $case) {
    $entries[] = new Kirby\Cms\Page([
        'slug' => $case['template'] . '-' . $case['mode'],
        'template' => $case['template'],
        'content' => [
            'title' => $case['template'] . ' ' . $case['mode'],
            'description' => 'Testbeschreibung',
            'linkType' => $case['linkType'],
            'externalUrl' => $case['externalUrl'],
        ],
    ]);
}

$html = snippet('aktuelles', ['cardEntries' => new Kirby\Cms\Pages($entries)], true);
$doc = new DOMDocument();
libxml_use_internal_errors(true);
$doc->loadHTML('<?xml encoding="UTF-8">' . $html);
$xpath = new DOMXPath($doc);
$results = [];
foreach ($cases as $i => $case) {
    $card = $xpath->query('//article[@class="aktuelles__card" and @data-id="' . $entries[$i]->id() . '"]')->item(0);
    $arrow = $xpath->query('.//*[@class="aktuelles__card-open"]', $card)->item(0);
    $results[] = [
        'template' => $case['template'],
        'mode' => $case['mode'],
        'arrowTag' => $arrow?->tagName,
        'href' => $arrow?->getAttribute('href'),
        'target' => $arrow?->getAttribute('target'),
        'rel' => $arrow?->getAttribute('rel'),
        'popup' => $arrow?->getAttribute('aria-haspopup'),
        'cardToggleCount' => $xpath->query('.//button[@class="aktuelles__card-info"]', $card)->length,
    ];
}
echo json_encode($results, JSON_THROW_ON_ERROR);

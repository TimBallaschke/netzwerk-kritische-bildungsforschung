<?php
$fixture = require __DIR__ . '/fixtures/about-sections.php';
$page = $fixture['page'];
$html = $page->render();

if (in_array('--html', $argv ?? [], true)) {
    echo $html;
    return;
}

$doc = new DOMDocument();
libxml_use_internal_errors(true);
$doc->loadHTML('<?xml encoding="UTF-8">' . $html);
$xpath = new DOMXPath($doc);
$articles = '//article[@class="vertiefung-item"]';
$getLinks = fn($query) => array_map(fn($node) => $node->getAttribute('href'), iterator_to_array($xpath->query($query)));
$fields = $fixture['form']->fields()->toProps();
$nestedContacts = $fields['vertiefungsbloecke']['fields']['kontakte'];
$bareEmail = new Kirby\Content\Field($page, 'kontaktLink', 'legacy@example.org');
$emptyTitle = new Kirby\Content\Field($page, 'kontaktLinkTitle', '');

echo json_encode([
    'formErrors' => $fixture['form']->errors(),
    'contactFieldType' => $nestedContacts['type'],
    'emailFieldType' => $nestedContacts['fields']['email']['type'],
    'contactLimit' => $nestedContacts['max'] ?? null,
    'sectionCount' => $xpath->query($articles)->length,
    'contactCounts' => array_map(fn($section) => $section->kontakte()->toStructure()->count(), iterator_to_array($page->vertiefungsBloecke()->toStructure())),
    'renderedNames' => array_map(fn($node) => trim($node->textContent), iterator_to_array($xpath->query($articles . '//p[@class="kontakt-name"]'))),
    'mailLinks' => $getLinks($articles . '//p[@class="kontakt-email"]/a'),
    'sectionLinks' => $getLinks($articles . '//p[@class="kontakt-link"]/a'),
    'italicText' => $xpath->query($articles . '//em')->length,
    'genderStarsPreserved' => str_contains($html, 'Forscher*innen und Akteur*innen'),
    'emptyContactLists' => $xpath->query($articles . '//ul[not(li)]')->length,
    'mainContacts' => $xpath->query('//*[@id="wer-sind-wir"]/ul[@class="kontakt-liste"]/li')->length,
    'legacyEmailHtml' => html_entity_decode(snippet('kontakt-link', ['link' => $bareEmail, 'title' => $emptyTitle], true), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

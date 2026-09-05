<?php
require dirname(__DIR__) . '/kirby/bootstrap.php';
$k = new Kirby(['roots' => ['index' => dirname(__DIR__)]]);
$k->impersonate('kirby');
$types = ['beitrag','veranstaltung','call-for-papers','publikation','notiz'];
$qa = $k->site()->index(true)->filter(fn($p)=>str_starts_with($p->slug(),'qa-'));
$coverage=[]; $formErrors=[]; $missing=[]; $pdfRestrictions=[];
foreach($qa as $p) {
    $type=$p->intendedTemplate()->name();
    $form=new Kirby\Form\Form(fields:$p->blueprint()->fields(),model:$p);
    $form->fill($p->content()->toArray());
    if($form->errors()) $formErrors[$p->id()]=$form->errors();
    $props=$form->fields()->toProps();
    if(isset($props['downloadpdf'])) $pdfRestrictions[$type]=['accept'=>$props['downloadpdf']['uploads']['accept']??null,'query'=>$props['downloadpdf']['query']??null];
    foreach($p->blueprint()->fields() as $key=>$field) {
        if(in_array($field['type'],['line','headline','info','hidden'])) continue;
        if($p->content()->get($key)->isNotEmpty()) $coverage[$type][$key]=true;
    }
}
foreach($types as $type) {
    $p=$qa->filterBy('intendedTemplate',$type)->first();
    if(!$p) { $missing[$type]=['No QA entries']; continue; }
    foreach($p->blueprint()->fields() as $key=>$field) {
        if(!in_array($field['type'],['line','headline','info','hidden']) && !isset($coverage[$type][$key])) $missing[$type][]=$key;
    }
}
$details=[];
foreach($qa->filter(fn($p)=>$p->slug()==='qa-'.$p->intendedTemplate()->name().'-self') as $p) {
    $html=$p->render();
    $doc=new DOMDocument(); libxml_use_internal_errors(true); $doc->loadHTML('<?xml encoding="UTF-8">'.$html); $x=new DOMXPath($doc);
    $details[$p->intendedTemplate()->name()]=[
        'title'=>$x->query('//h1[contains(@class,"modal-title") or @class="post-title"]')->item(0)?->textContent,
        'images'=>$x->query('//article[contains(@class,"content-detail")]//figure | //article[contains(@class,"featured-post-card")]//figure')->length,
        'pdfs'=>$x->query('//main//a[contains(@href,"test-download.pdf")]')->length,
        'hasFeed'=>str_contains($html,'aria-label="Ansicht wechseln"'),
        'hasGenderStar'=>str_contains($html,'Forscher*innen'),
        'hasBody'=>str_contains($html,'ausführliche Testinhalt'),
    ];
}
$home=$k->page('home')->render(); $about=$k->page('ueber-uns')->render(); $seminars=$k->page('seminarplaene')->render();
echo json_encode([
    'pdfRestrictions'=>$pdfRestrictions, 'qaCount'=>$qa->count(), 'fieldCounts'=>array_map('count',$coverage), 'missingFields'=>$missing,'formErrors'=>$formErrors, 'details'=>$details,
    'introFromPanel'=>str_contains($home,$k->page('home')->intro()->kti()->value()),
    'seminarContactTitle'=>str_contains($seminars,$k->page('seminarplaene')->kontaktEmailTitle()->kti()->value()),
    'hiddenAbsent'=>!str_contains($home,'TEST · Beitrag außerhalb des Aktuelles-Feeds'),
    'draftAbsent'=>!str_contains($home,'TEST · Unveröffentlichter Entwurf'),
    'pastEventPresent'=>str_contains($about,'TEST · Vergangene Veranstaltung'),
    'futureEventAbsent'=>!str_contains($about,'TEST · Veranstaltung – alle Felder'),
    'aboutSections'=>$k->page('ueber-uns')->vertiefungsBloecke()->toStructure()->count(),
    'seminarRows'=>$k->page('seminarplaene')->plaene()->toStructure()->count(),
], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);

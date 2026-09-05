<?php
/** Local, additive Panel test content. Run explicitly: php tests/seed-qa.php --apply */
if (PHP_SAPI !== 'cli' || !in_array('--apply', $argv, true)) {
    exit("Local CLI only. Usage: php tests/seed-qa.php --apply\n");
}
require dirname(__DIR__) . '/kirby/bootstrap.php';
$kirby = new Kirby(['roots' => ['index' => dirname(__DIR__)]]);
$kirby->impersonate('kirby');
$assetRoot = __DIR__ . '/fixtures/qa-assets';
$results = [];
function saveFields($model, array $values) {
    $form = new Kirby\Form\Form(fields: $model->blueprint()->fields(), model: $model);
    $form->fill(array_merge($model->content()->toArray(), $values));
    if ($form->errors()) throw new RuntimeException(json_encode($form->errors(), JSON_UNESCAPED_UNICODE));
    return $model->update($form->toStoredValues());
}
function addAsset($page, string $name, string $alt): string {
    global $assetRoot;
    $file = $page->file($name) ?? $page->createFile(['source' => "$assetRoot/$name", 'filename' => $name, 'content' => ['alt' => $alt]]);
    return $file->uuid()->toString();
}
$body = "Dieser <em>ausführliche Testinhalt</em> prüft Absätze, Sonderzeichen und die Darstellung auf Desktop und Mobilgeräten. Alle hier genannten Testpersonen und Termine sind fiktiv. Forscher*innen, Lehrende und Studierende betrachten Bildung aus unterschiedlichen Perspektiven.\n\nEin zweiter Absatz macht die Abstände und die gemeinsame Textspalte sichtbar. Im Mittelpunkt stehen Fragen nach Teilhabe, gesellschaftlichen Bedingungen und kritischer Reflexion. Auch längere Texte sollen im Overlay vollständig erreichbar bleiben.\n\nFür den Test werden Bilder mit Bildunterschriften, ein weiterführender Link und ein lesbares PDF ergänzt. Beim Öffnen und Schließen soll der Fokus zur auslösenden Schaltfläche zurückkehren.";
$types = ['beitrag'=>'beitraege','veranstaltung'=>'veranstaltungen','call-for-papers'=>'call-for-papers','publikation'=>'publikationen','notiz'=>'notizen'];
$labels = ['beitrag'=>'Beitrag','veranstaltung'=>'Veranstaltung','call-for-papers'=>'Call for Papers','publikation'=>'Publikation','notiz'=>'Notiz'];
$order = -100;
foreach ($types as $template=>$parentSlug) {
    $parent=$kirby->page('aktuelles/'.$parentSlug);
    foreach ($template==='beitrag' ? ['self'] : ['self','external','none'] as $mode) {
        $slug="qa-$template-$mode";
        $page=$parent->childrenAndDrafts()->find($slug);
        if ($page) { $results[]=['id'=>$page->id(),'status'=>'already exists']; continue; }
        $suffix=['self'=>'alle Felder','external'=>'externer Link','none'=>'nur Teaser'][$mode];
        $title='TEST · '.$labels[$template].' – '.$suffix;
        $page=$parent->createChild(['slug'=>$slug,'template'=>$template,'content'=>['title'=>$title]]);
        $values=['description'=>"Erkennbarer <em>Testeintrag</em> für $suffix. Hier lassen sich Text, Umlaute (ä, ö, ü), Anführungszeichen »so« und die jeweilige Darstellung prüfen.", 'inaktuelles'=>true,'date'=>'2026-09-05','authors'=>'Alex Beispiel & Robin Muster (Testpersonen)'];
        if($template==='beitrag') {
            $values['datemanual']=true;
            $values['date']='2026-09-06';
            $values['authorphoto']=[addAsset($page,'test-portrait.png','Testporträt: grafischer Platzhalter, keine reale Person')];
        } else {
            $values['linktype']=$mode;
        }
        if(in_array($template,['veranstaltung','notiz'])) $values['subinfo']='Fiktiver Testtermin mit <em>Alex Beispiel</em> / Quelle: Testredaktion';
        if($template==='veranstaltung') $values=array_merge($values,['date'=>'2026-11-18','ort'=>'Testraum 2.03, Beispielcampus, Frankfurt am Main','onlinehinweis'=>'Hybrider Testtermin; der Zugangslink wird hier nur demonstriert.']);
        if($template==='call-for-papers') $values=array_merge($values,['deadline'=>'2026-10-31','date'=>'2026-11-20','ort'=>'Beispielcampus Mainz (Testort)']);
        if($mode==='self') {
            $values['body']=$body;
            $values['downloadpdf']=[addAsset($page,'test-download.pdf','Lokales Testdokument für PDF-Download')];
            if($template==='beitrag') $values['body'].="\n\n## Eine Zwischenüberschrift zum Testen\n\nEin Absatz mit (link: https://example.org text: einem Testlink) und <em>kursiver Hervorhebung</em>.";
            if(in_array($template,['veranstaltung','notiz'])) $values['image']=[addAsset($page,'test-flyer.png','Testbild 1: Flyer im Querformat'),addAsset($page,'test-bild-2.png','Testbild 2: zweites Motiv für das Mehrfach-Bildfeld')];
            if($template==='publikation') $values['cover']=[addAsset($page,'test-cover.png','Testcover: Bildung und gesellschaftliche Verhältnisse')];
            if($template==='call-for-papers') $values=array_merge($values,['callurltitle'=>'Ausführlicher Test-Call','callurl'=>'https://example.org/?test=call&quelle=website']);
            elseif($template!=='beitrag') $values=array_merge($values,['linktitle'=>'Weiterführende Testinformationen','linkurl'=>'https://example.org/?test=detail&quelle=website']);
        } elseif($mode==='external') $values=array_merge($values,['externalurltitle'=>'Externe Testseite öffnen','externalurl'=>'https://example.org/?test='.$template.'&quelle=website']);
        $page=saveFields($page,$values)->update(['feedorder'=>$order++])->changeStatus('listed',999);
        $results[]=['id'=>$page->id(),'status'=>'created','fields'=>array_keys($values)];
    }
}
// A past event tests the automatic archive; a hidden and a draft post test visibility.
foreach ([['veranstaltung','veranstaltungen','qa-veranstaltung-archiv','TEST · Vergangene Veranstaltung','listed',true,'2026-08-12'],['beitrag','beitraege','qa-beitrag-ausgeblendet','TEST · Beitrag außerhalb des Aktuelles-Feeds','listed',false,'2026-09-04'],['beitrag','beitraege','qa-beitrag-entwurf','TEST · Unveröffentlichter Entwurf','draft',true,'2026-09-03']] as [$template,$parentSlug,$slug,$title,$status,$visible,$date]) {
    $parent=$kirby->page('aktuelles/'.$parentSlug);
    if($parent->childrenAndDrafts()->find($slug)) continue;
    $p=$parent->createChild(['slug'=>$slug,'template'=>$template,'content'=>['title'=>$title]]);
    $values=['description'=>'Fiktiver Testinhalt zur Kontrolle von Archiv, Veröffentlichung und Sichtbarkeit.','body'=>$body,'authors'=>'Testredaktion','date'=>$date,'inaktuelles'=>$visible,'downloadpdf'=>[addAsset($p,'test-download.pdf','Test-PDF')]];
    if($template==='beitrag') $values=array_merge($values,['datemanual'=>false,'authorphoto'=>[addAsset($p,'test-portrait.png','Testporträt')]]);
    else $values=array_merge($values,['linktype'=>'self','subinfo'=>'Rückblick auf einen fiktiven Workshop','ort'=>'Testcampus Frankfurt','onlinehinweis'=>'Testaufzeichnung im Archiv','image'=>[addAsset($p,'test-flyer.png','Testflyer für das Veranstaltungsarchiv')],'linktitle'=>'Testdokumentation','linkurl'=>'https://example.org/']);
    $p=saveFields($p,$values)->update(['feedorder'=>$order++]);
    if($status==='listed') $p=$p->changeStatus('listed',999);
    $results[]=['id'=>$p->id(),'status'=>$status];
}
$about=$kirby->page('ueber-uns');
if($about->vertiefungsBloecke()->isEmpty()) {
    $contacts=[['name'=>'Alex Beispiel (Testperson)','email'=>'alex@example.org'],['name'=>'Robin Muster (Testperson)','email'=>'robin@example.org'],['name'=>'Testperson ohne öffentliche E-Mail','email'=>'']];
    saveFields($about,['vertiefungsbloecke'=>[
        ['zwischenueberschrift'=>'TEST · Was ist das Netzwerk, wie versteht es sich?','fliesstext'=>$body,'kontakte'=>$contacts,'kontaktlinktitle'=>'Informationen zum Testnetzwerk','kontaktlink'=>'https://example.org/?test=netzwerk&sprache=de'],
        ['zwischenueberschrift'=>'TEST · Wer kann wie mitmachen?','fliesstext'=>'Dieser Testabschnitt demonstriert einen Kontaktlink per <em>E-Mail</em> und mehrere Ansprechpersonen. Die Adressen sind ausschließlich Platzhalter.','kontakte'=>$contacts,'kontaktlinktitle'=>'Kontakt zur Testredaktion','kontaktlink'=>'mailto:mitmachen@example.org'],
        ['zwischenueberschrift'=>'TEST · Vorstellung Arbeitskreis (AK) am Institut für Sozialforschung (IfS)','fliesstext'=>$body,'kontakte'=>array_slice($contacts,0,2),'kontaktlinktitle'=>'Testinformationen zum Arbeitskreis','kontaktlink'=>'https://example.org/?test=arbeitskreis']
    ]]);
}
$seminars=$kirby->page('seminarplaene');
$rows=$seminars->plaene()->yaml();
if(!array_filter($rows,fn($r)=>str_starts_with($r['titel']??'','TEST ·'))) {
    $pdf=addAsset($seminars,'test-download.pdf','Test-Seminarplan für die Downloadkontrolle');
    foreach(['Bildung, Subjekt, Gesellschaft – Einführung in die kritische Bildungstheorie','Vergleichen, Normieren und Messen: Zur Kritik standardisierter Leistungsbewertung','Inklusion und Exklusion als gesellschaftliche Verhältnisse – ein interdisziplinäres Lektüreseminar'] as $title) $rows[]=['dozierende'=>'Alex Beispiel und Robin Muster (Testpersonen)','titel'=>'TEST · '.$title,'pdf'=>[$pdf]];
    saveFields($seminars,['plaene'=>$rows]);
}
echo json_encode($results,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n";

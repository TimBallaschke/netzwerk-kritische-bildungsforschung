# Website-Teststand vom 05.09.2026

Die lokale Website ist mit erkennbaren Testinhalten befüllt und technisch sowie im Browser geprüft. Die angemeldete Panel-Bedienung ist noch offen: Im Codex-Browser steht das Panel auf der Login-Seite. Befüllung und Formularvalidierung erfolgten über die lokale Kirby-API und dieselben Formularklassen, die das Panel verwendet.

- [Website](http://netzwerk_kritische_bildungsforschung.test/)
- [Panel](http://netzwerk_kritische_bildungsforschung.test/panel)
- [Figma Page 3](https://www.figma.com/design/Vxu8pIvGjsBMYXYzqQTLVI/Netzwerk-kritische-Bildungsforschung?node-id=452-2)

Der ursprünglich verlinkte Figma-Knoten `43:1604` gehört zu Page 2. Für diesen Test wurde ausdrücklich Page 3 (`452:2`) gelesen; Veranstaltungs-, Notiz- und Seminarplan-Entwürfe wurden zusätzlich visuell geprüft. Der Abgleich betrifft Aufbau, Inhalte und Feldanordnung; er ist keine vollständige Freigabe aller Pixelabstände.

## Testinhalte

16 neue Einträge mit dem Titelpräfix **TEST ·** und dem Slugpräfix **qa-** sind vorhanden. Vorhandene Beiträge und Entwürfe bleiben erhalten. Alle redaktionellen Felder der fünf Eintragstypen sind mindestens einmal mit Testwerten belegt; bedingte Felder werden über getrennte Verlinkungsvarianten abgedeckt.

| Inhaltstyp | Abgedeckte Felder | Varianten |
| --- | ---: | --- |
| Beitrag | 8 | vollständig, aus Aktuelles ausgeblendet, unveröffentlichter Entwurf; beide Datum-Schalterstellungen |
| Veranstaltung | 15 | eigene Detailansicht, externer Link, nur Teaser, vergangener Termin |
| Call for Papers | 13 | eigene Detailansicht mit Deadline/PDF/Call-Link, externer Link, nur Teaser |
| Publikation | 12 | eigene Detailansicht mit Cover/PDF/Link, externer Link, nur Teaser |
| Notiz | 13 | eigene Detailansicht mit zwei Bildern/PDF/Link, externer Link, nur Teaser |

Hinzu kommen drei ausgefüllte Vertiefungsabschnitte auf Über Uns mit insgesamt acht Testkontakt-Zeilen, Web- und E-Mail-Links, sowie drei zusätzliche Seminarpläne mit PDF. Die beiden vorhandenen Seminarpläne bleiben erhalten. Bestehende Startseiten-, Netzwerk-, Footer- und Kontaktdaten werden weiter verwendet. Das Test-PDF ist eine echte, lesbare PDF-Datei; die Testbilder sind beschriftete grafische Platzhalter mit Alt-Texten/Bildunterschriften.

Der vollständige Testbeitrag ist auf den **06.09.2026** datiert, damit er in der Beitragsübersicht als aktueller Beitrag mit Foto, Zwischenüberschrift, Fließtext, Inline-Link und PDF erscheint. Dieses Datum gehört zum fiktiven Testinhalt.

Direkte Einstiege:

- [Vollständiger Beitrag](http://netzwerk_kritische_bildungsforschung.test/aktuelles/beitraege/qa-beitrag-self)
- [Veranstaltung mit zwei Bildern](http://netzwerk_kritische_bildungsforschung.test/aktuelles/veranstaltungen/qa-veranstaltung-self)
- [Call mit PDF und Deadline](http://netzwerk_kritische_bildungsforschung.test/aktuelles/call-for-papers/qa-call-for-papers-self)
- [Publikation mit Cover](http://netzwerk_kritische_bildungsforschung.test/aktuelles/publikationen/qa-publikation-self)
- [Notiz mit zwei Bildern](http://netzwerk_kritische_bildungsforschung.test/aktuelles/notizen/qa-notiz-self)
- [Über Uns](http://netzwerk_kritische_bildungsforschung.test/ueber-uns)
- [Seminarpläne](http://netzwerk_kritische_bildungsforschung.test/seminarplaene)

## Behobene Fehler

1. Der Introtext der Startseite war im Template fest hinterlegt. Nun erscheint der im Panel gepflegte Inhalt.
2. Das Feld „Titel zur E-Mail“ bei Seminarplänen wurde nicht ausgegeben. Es wird jetzt angezeigt.
3. Veranstaltungs-, Call-, Publikations- und Notiz-URLs verwendeten die allgemeine Startseitenvorlage. Sie haben jetzt eigene Detailansichten mit derselben Inhaltsdarstellung wie das Overlay.
4. Mehrfach-Bildfelder zeigten nur ein Bild. Jetzt erscheinen alle Bilder mit ihren Bildunterschriften. Bei Notizen steht entsprechend Page 3 das erste Bild neben dem Text, weitere Bilder stehen in der Textspalte.
5. Die Liste ignorierte die Verlinkungsart und öffnete auch bei externen und unverlinkten Einträgen ein Overlay. Externe Einträge verlinken jetzt auf die konfigurierte URL; unverlinkte Teaser haben keine Detailaktion. Ihr vollständiger Teaser bleibt auch mobil sichtbar.
6. Neu gepflegte Autor:innen, Veranstaltungstermine und Call-Deadlines fehlten teilweise in den Vorschauen, die nur ein altes Untertitelfeld ausgaben. Die Vorschauen verwenden jetzt die passenden Blueprint-Felder.
7. `accept: application/pdf` an den Dateien-Feldern schränkte Kirby-Uploads nicht ein. Ein PDF-Dateiblueprint und gefilterte Dateiauswahl sorgen jetzt für PDF-Uploads und PDF-Auswahl in den sechs betroffenen Feldern einschließlich Seminarplänen.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `npm test` | 21/21 Regressionstests bestanden |
| `npm run test:content` | 5/5 Prüfungen des befüllten Testbestands bestanden |
| PHP-Syntax | 45 Dateien ohne Syntaxfehler |
| Kirby-Formulare aller 16 Testeinträge | keine Validierungsfehler |
| Feldabdeckung der Eintragstypen | 61/61 redaktionelle Felder mindestens einmal belegt |
| HTTP-Rundgang | 46 Seiten, 83 lokale URLs ohne HTTP-/Dateifehler |
| PDFs | 12 URLs mit gültigem PDF-Inhalt und `application/pdf` |
| Nicht vorhandene Seite und unveröffentlichter Testentwurf | beide HTTP 404 |
| Responsive Größen | 320, 390, 768 und 1440 px; 36 Ansichtsprüfungen ohne horizontalen Seitenüberlauf |
| Browser-Konsole | keine Warnungen oder Fehler in den geprüften Abläufen |

Im Browser geprüft: Hauptnavigation, Grafik/Liste, alle fünf Desktop-Kategorienfilter, Pause-Funktion, Kartenvergrößerung, Öffnen aus der Grafik per Tastatur, alle fünf Overlay-Typen, Schließen und Escape, Fokus-Rückgabe, alle drei Über-uns-Aufklappbereiche, Kontaktlinks, vergangene Veranstaltung, Beitrags-Aufklappbereich, Seminar-PDF-Aktion und mobile Teaser ohne Link. Die aktuelle Grafik zeigt 15 Karten auf Desktop und 12 auf Mobil; die Liste enthält alle 34 aktiven Feed-Einträge.

Die PDF-Aktion wurde im Browser ausgelöst; Dateiinhalte und MIME-Typen wurden zusätzlich über HTTP und das generierte Test-PDF visuell geprüft. Externe Ziele und Mailto-Links wurden auf korrekte Linkwerte geprüft; es wurden keine Nachrichten versendet. Die Validität fiktiver Veranstaltungstermine oder fremder redaktioneller Aussagen ist nicht Gegenstand dieses Tests.

## Noch im angemeldeten Panel zu prüfen

Diese Schritte sind vorbereitet, aber mangels Login **nicht als erfolgreich getestet** markiert:

- Einen TEST-Eintrag öffnen, Text ändern, speichern, neu laden und die Änderung auf der Website prüfen.
- Verlinkungsart zwischen „Eigene Detailseite“, „Externer Link“ und „Keine Verlinkung“ wechseln; Sichtbarkeit der bedingten Felder und Speicherung prüfen.
- PDF und Bilder über den tatsächlichen Upload-Dialog hochladen; PDF-Dateiauswahl und falsche Dateitypen prüfen.
- Ansprechpersonen in den verschachtelten Strukturen hinzufügen, bearbeiten und verschieben; speichern und neu laden.
- Aktuelles-Feed per Drag-and-drop umsortieren und die Reihenfolge der Grafik und Liste vergleichen.
- „In Aktuelles zeigen“, manuelles Datum und Entwurfs-/Veröffentlichungsstatus im Panel bedienen und die Änderung auf der Website prüfen.

Die Uhrzeitspanne einer Veranstaltung, die im Figma-Beispiel auftaucht, hat derzeit kein eigenes Blueprint-Feld. Der Test belegt die verfügbaren Datums-, Orts- und Online-Hinweisfelder; eine strukturierte Start-/Endzeit ist damit noch nicht abgedeckt.

## Sicherung und Wiederholung

Der Inhaltsstand vor der Befüllung liegt unter:

`/Users/timballaschke/.codex/artifacts/nkb-website-test-2026-09-05/content-before.tar.gz`

Ein Vergleich mit der Sicherung bestätigt: Von den ursprünglichen Inhaltsdateien wurden nur Über Uns (zusätzliche Abschnitte) und Seminarpläne (zusätzliche Einträge) inhaltlich geändert. Kirby normalisiert beim Veröffentlichen zum Teil numerische Ordnerpräfixe; bestehende Slugs, UUIDs und Inhalte bleiben erhalten. Die Sicherung enthält auch vorhandene Entwürfe und nicht veröffentlichte Änderungen.

`php tests/seed-qa.php --apply` legt fehlende QA-Einträge additiv an und überspringt bereits vorhandene QA-Slugs. Die gesonderte Prüfung `npm run test:content` setzt diesen Testbestand voraus. Sie ist bewusst vom normalen Regressionstestlauf getrennt, damit spätere redaktionelle Änderungen oder das Entfernen der Testeinträge `npm test` nicht an feste QA-Inhalte koppeln. `npm run build:css` kompiliert die Styles. `npm test` führt die Regressionstests aus.

Alle Änderungen liegen lokal und sind nicht committed oder veröffentlicht.

# Winner Flex / Winner Design als Funktionsreferenz fuer OpenKitchenPlanner

Stand: 2026-10-27

## Zweck und Quellenbasis

Dieses Dokument ordnet den Zielumfang von OpenKitchenPlanner (OKP) am offiziell beschriebenen Funktionsumfang von Winner Design und Winner Flex aus. Es ist keine Aussage ueber technische oder rechtliche Kompatibilitaet und kein Anspruch auf pixel- oder verhaltensidentische Nachbildung.

Verwendet wurden ausschliesslich offizielle Winner-/Compusoft-/Cyncly-Hilfequellen. Wichtigste Ausgangspunkte:

- [Vergleich von Winner Design und Winner Flex](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/46410456836881-Vergleich-von-Winner-Design-und-Winner-Flex)
- [Was ist Winner Flex?](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/4410146091025-Was-ist-Winner-Flex)
- [Winner Flex Hilfezentrum](https://winnerdesign.support.compusoftgroup.com/hc/de)

## Produktgrenze: Winner Design gegen Winner Flex

Die offizielle Vergleichstabelle beschreibt fuer beide Produkte denselben fachlichen Kern: 3D-Kuechen-CAD, Herstellerkataloge, genaue Angebote und Bestellungen, detaillierte 3D-Visualisierung und einen integrierten Workflow von Design ueber Angebot bis Bestellung. Winner Design ist dort als lokale/offline Desktoploesung eingeordnet. Winner Flex Ultimate ergaenzt insbesondere Cloudzugriff, zentrale Projekte und Dateien, mehrere Shops/Mandanten, Dokumentenmanagement, Installationsplanung, Angebots- und Artikellisten-Automatisierung, BI, CRM/Projektmanagement, Lieferantenbestellungen, Rollen/Teamsteuerung, Katalogsynchronisation und modernere Renderoptionen. Quelle: [offizieller Produktvergleich](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/46410456836881-Vergleich-von-Winner-Design-und-Winner-Flex).

Winner Flex besteht fachlich aus Cloudplattform plus lokaler Designanwendung. Kontakte, Projekte und Dokumente sind auch ueber den Browser erreichbar; laut offizieller Projektsuche kann ein Design im Browser angesehen, aber zum Bearbeiten nur in der Desktopanwendung geoeffnet werden. Quellen: [Was ist Winner Flex?](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/4410146091025-Was-ist-Winner-Flex), [Flex Cloud: Projekt finden](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/8971423990673-Flex-Cloud-Projekt-finden).

**Konsequenz fuer OKP:** Ziel ist fachliche Winner-Flex-Paritaet als browsernative Anwendung. Eine Trennung in Desktop-CAD und Cloudportal ist keine Muss-Anforderung; die durchgaengige Bearbeitung im Browser ist ein bewusstes OKP-Unterscheidungsmerkmal.

## Offiziell belegte Funktionskategorien

### 1. Projekt-, Kunden- und Vertriebssteuerung

- Projektboard mit Status, Fachberater/Sachbearbeiter, Kundenbudget, Vertragswahrscheinlichkeit und geplantem Abschlussdatum; Projekte und Designs koennen geoeffnet, dupliziert, archiviert oder geloescht und ein bevorzugtes Design kann fuer Prognosen markiert werden. Quelle: [Flex: die Seitenleiste des Projektboards](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/29005508093073-Flex-die-Seitenleiste-des-Projektboards).
- Cloud-Projekte sind nach Suche, Projekt-/Designstatus, Berater, Sachbearbeiter, Kontakt, externer Referenz, Verweildauer im Status und Archivstatus filterbar. Quelle: [Flex Cloud: Projekt finden](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/8971423990673-Flex-Cloud-Projekt-finden).
- Flex synchronisiert Unternehmens-/Benutzereinstellungen und Katalogindexe, zentralisiert Kontakte, Projekte, Dokumente und Vertriebsberichte und unterstuetzt mehrere Shops/Mandanten. Quelle: [Was ist Winner Flex?](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/4410146091025-Was-ist-Winner-Flex).

### 2. Raum- und Wandmodellierung

- Raumeigenschaften umfassen Raumhoehe, Aussen-/Innenwandstaerke, automatische Wandnummerierung sowie Farben/Materialien fuer Oberflaechen. Quelle: [Raumeigenschaften](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/4404025352337-Raumeigenschaften).
- Wandeigenschaften umfassen editierbare Laenge, Dicke und Winkel, Sichtbarkeit, Name/Nummer, Fuss-/Deckenleisten, automatische Bemassung, Ausrichtung und Material/Farbe. Nach Raumabschluss lassen sich vorherige/naechste/allein die markierte Wand unter Erhalt definierter Winkel verschieben. Quelle: [Wandeigenschaften](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/25060099473937-Wandeigenschaften).
- Bemassungsprofile steuern automatische Objektmasse, Masslinien, Stile, Abstaende, Schrift/Farben, Winkelmasse, Positions- und Wandnummerierung sowie Standardmasse. Quelle: [Systemeinstellungen: Bemassung](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360018746218-Systemeinstellungen-Bema%C3%9Fung).

### 3. Synchronisierte 2D-, 3D- und Wandansicht

- Winner zeigt standardmaessig drei Arbeitsfenster: 2D-Grundriss, 3D-Perspektive und 2D-Ansicht der zuletzt beruehrten Wand. Fensteranordnungen koennen gewechselt und als Standard gespeichert werden. Quelle: [Fensterkonfiguration: Grundriss, Perspektive und Ansicht](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360019566017-Fensterkonfiguration-Grundriss-Perspektive-und-Ansicht).
- Sichtbarkeitsprofile koennen je Grundriss/Ansicht Ebenen, Masse, Kommentare und Bilder ein- oder ausblenden. Quelle: [„Zeige“-Einstellungen](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360017759038--Zeige-Einstellungen).

### 4. Kataloge, Artikel und Platzierung

- Der Katalogbrowser bietet Katalogauswahl, Bild-/Listenansicht, Artikelnummersuche, Filter, Produktdetails, Cursor-/Hoehensteuerung, Mehrfachplatzierung und zuletzt verwendete Artikel. Quelle: [Katalogbrowser: Artikel platzieren](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/29966943565201-Katalogbrowser-So-verwenden-Sie-ihn-um-Artikel-zu-platzieren).
- Objekte koennen beim Verschieben automatisch vom Boden auf eine Arbeitsplatte gesetzt werden; Undo und ein temporaeres Abschalten der Automatik sind vorgesehen. Quelle: [Automatische Hoehenplatzierung](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360016536757-Automatische-H%C3%B6henplatzierung-von-Objekten).
- Benutzerdefinierte Kataloge koennen Produktgruppen, Modelle, Artikelnummern, Zeichnungstypen, Berechnungsformeln, Preisgruppen und Einheitspreise enthalten. Quelle: [Eigenen Katalog erstellen](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360011709357-Wie-kann-ich-meinen-eigenen-Katalog-erstellen).

### 5. Arbeitsplatten und automatisch erzeugte Bauteile

- Arbeitsplatten werden bei vielen Unterschraenken automatisch erzeugt; ein eigenes Arbeitsplattenschema dient zur Kontrolle von Massen/Winkeln und zum Setzen von Schnitten. Quelle: [Preisgestaltung fuer Arbeitsplatten](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/4409158936721-Preisgestaltung-f%C3%BCr-Arbeitsplatten).
- Winner schlaegt automatische Schnittvarianten vor. Quelle: [Arbeitsplattenschema: Automatischer Schnitt](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360019042558-Arbeitsplattenschema-Automatischer-Schnitt).
- Kataloggestuetzte automatische Artikelnummern koennen Arbeitsplatten, Kantenprofile und Zuschnitte bepreisen; Modellwechsel aktualisieren die Zuordnung. Quelle: [Automatische Zuweisung von Arbeitsplatten-Artikelnummern](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360018921777-Automatische-Zuweisung-von-Artikelnummern-f%C3%BCr-Arbeitsplatten).

### 6. Kalkulation und Angebot

- Der Kernworkflow verbindet Design, Angebot und Bestellung; Angebote koennen auch ohne Raumzeichnung als Direktverkauf aus Katalogartikeln erstellt werden. Quellen: [Produktvergleich](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/46410456836881-Vergleich-von-Winner-Design-und-Winner-Flex), [Direktverkauf](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/19514304172817-Erstellen-eines-schnellen-Angebots-Direktverkauf).
- Angebotseinstellungen umfassen Gruppierung/Sortierung, Zwischen- und Einzelpreise, Katalog-/Globalrabatte, Rundung, MwSt.-Darstellung, Waehrung, Mehrpreise, Fracht/Montage/Versicherung, Einkaufs- und Verkaufsaufschlaege sowie Gewinn-/Deckungsbeitragsbetrachtung. Quelle: [Funktionen der Angebotseinstellungen](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360010139577-Funktionen-der-Angebotseinstellungen).

### 7. Bestellung, Lieferung und Installation

- Lieferantenbestellungen sowie erwartete und tatsaechliche Liefertermine werden je Alternative verwaltet. Quelle: [Bestellung und Lieferung](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360018626158-Bestellung-und-Lieferung-Bestellung).
- Der offizielle Produktvergleich nennt Installationsplanung und Lieferantenbestellverwaltung als Flex-Ultimate-Funktionen. Quelle: [Produktvergleich](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/46410456836881-Vergleich-von-Winner-Design-und-Winner-Flex).

### 8. Praesentation, Rendering, Ausgabe und Interoperabilitaet

- Die 3D-Perspektive kann als 360-Grad-Darstellung genutzt werden; Flex Ultimate nennt klassische und Cycles-GPU/KI-Renderengine sowie fotorealistische 360-Renderings. Quellen: [Fensterkonfiguration](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/360019566017-Fensterkonfiguration-Grundriss-Perspektive-und-Ansicht), [Produktvergleich](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/46410456836881-Vergleich-von-Winner-Design-und-Winner-Flex).
- Grundriss, Perspektive und Ansicht koennen einzeln gedruckt, als PDF exportiert und mit festem oder benutzerdefiniertem Massstab ausgegeben werden. Quelle: [Drucken von Grundriss, Perspektive oder Ansicht](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/4405438636049-Drucken-des-Grundrisses-der-Perspektive-oder-der-Ansicht).
- Winner exportiert IFC (laut Hilfe nur Moebel, keine Waende/Installationen/Dekoration) sowie seit 12.6a3 GLB/glTF fuer Viewer, AR/VR und Rendertools. Quellen: [IFC-Export](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/11089067749393-Wie-man-eine-IFC-Datei-exportiert), [GLB/glTF-Export](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/47360451356305-Design-als-glb-oder-glTF-exportieren).

### 9. Dokumente, Team und Cloudbetrieb

- Projektbezogene Angebote, Bestellungen, Rechnungen, Aufmasse, Fotos und Notizen werden zentral verwaltet; PDF-Ausgaben koennen automatisch in Flex hochgeladen und versioniert benannt werden. Quellen: [Was ist Winner Flex?](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/4410146091025-Was-ist-Winner-Flex), [Projektdokumente verwalten](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/4408064036241-Winner-Flex-So-verwalten-Sie-Projektdokumente).
- Mehrere Shops/Mandanten, Rollen und Teamsteuerung, BI/Dashboards und zentrale Katalogaktualisierung gehoeren zur Flex-Ultimate-Schicht. Quelle: [Produktvergleich](https://winnerdesign.support.compusoftgroup.com/hc/de/articles/46410456836881-Vergleich-von-Winner-Design-und-Winner-Flex).

## Mapping auf OpenKitchenPlanner

Statusbedeutung:

- `vorhanden`: belastbare Code-/Dokumentationsoberflaeche im Repository gefunden
- `teilweise`: Grundmodell oder Teilworkflow vorhanden, Winner-Referenzumfang nicht voll abgedeckt
- `kritisch pruefen`: Funktion wird dokumentiert, muss aber im realen Browser-/Backend-Goldpfad verifiziert werden

| Winner-Referenzbereich | OKP-Stand | Repo-Beleg | Wichtigste Luecke / Gate | Prioritaet |
|---|---|---|---|---|
| Projektboard, Status, Suche, CRM | vorhanden/teilweise | [`ROADMAP.md`](./ROADMAP.md) S25/S27/S31; `planner-frontend/src/pages/ProjectsPage.tsx`, `ContactsPage.tsx` | Budget, Abschlusswahrscheinlichkeit, bevorzugtes Design und Statushistorie als zusammenhaengender Vertriebsflow pruefen | P1 |
| Raum-/Wanddefinition | kritisch pruefen | `planner-frontend/src/editor/PolygonEditor.tsx`, `planner-api/src/routes/walls.ts`, `rooms.ts` | Persistenz, Wandselektion, editierbare Wandparameter und Folgeaktualisierung aller Ansichten muessen im Goldpfad stabil sein | **P0** |
| Gleichzeitige 2D-/3D-/Wandansicht | kritisch pruefen | [`EDITOR_1_1_ARCHITECTURE.md`](./EDITOR_1_1_ARCHITECTURE.md), `editor11/viewports/*` | Drei Ansichten muessen nach jeder Geometrieaenderung synchron bleiben; kein leerer/staler Wand-Viewport | **P0** |
| Bemassung und Wandnummern | teilweise | `planner-api/src/routes/dimensions.ts`, [`EDITOR_FEATURE_MATRIX.md`](./EDITOR_FEATURE_MATRIX.md) | Winner-artige Anzeigeprofile, automatische Objekt-/Wandbemassung und Druckprofile End-to-End verifizieren | P1 |
| Katalogbrowser und Artikelplatzierung | vorhanden/teilweise | `planner-frontend/src/components/catalog/CatalogBrowser.tsx`, `components/editor/CatalogSidePanel.tsx` | Modell-/Variantenauswahl, Hoehenlogik, Favoriten, letzte Artikel und konfigurierbare Eigenschaften als einheitlicher Flow | **P0** |
| Benutzerdefinierte Herstellerkataloge/Indexe | vorhanden/teilweise | [`ROADMAP.md`](./ROADMAP.md) S7/S29/S43; `planner-api/src/services/catalogImporter.ts` | Produktgruppen/Modelle/Formeln/Preisgruppen und automatische Cloud-Aktualisierung gegen reale Katalogdaten pruefen | P1 |
| Arbeitsplattenautomatik | teilweise | [`ROADMAP.md`](./ROADMAP.md) S20/S35; `planner-api/src/routes/autoCompletion.ts`, `worktops.ts` | Geometrieschema, Schnitte, Kanten/Ausschnitte, Artikelzuordnung und Preise in einem pruefbaren Workflow verbinden | **P0** |
| BOM, Kalkulation und Angebot | vorhanden/teilweise | [`ROADMAP.md`](./ROADMAP.md) S9/S13/S42; `planner-api/src/services/bomCalculator.ts`, `routes/quotes.ts`, `QuoteExportPanel.tsx` | Winner-Tiefe bei MwSt., Rabatten, Rundung, Zusatzkosten, EK/VK und Marge im UI/Export konsistent absichern | **P0** |
| Alternative/Design -> Bestellung/Lieferung | vorhanden/teilweise | [`ROADMAP.md`](./ROADMAP.md) S46; `planner-api/src/routes/purchaseOrders.ts`, `productionOrders.ts` | Liefertermine, AB/EK-Nachtrag, Bestellabschluss und Statushistorie als Goldpfad | P1 |
| Rendering, 360 und Praesentation | vorhanden/teilweise | [`EDITOR_FEATURE_MATRIX.md`](./EDITOR_FEATURE_MATRIX.md); `routes/renderJobs.ts`, `panoramaTours.ts`, `mediaCapture.ts` | Reale Qualitaet/Performance, Presets, freigegebene Kundenansicht und stabile Ausgabeformate pruefen | P2 |
| Druck/PDF/Ansichten | vorhanden/teilweise | [`ROADMAP.md`](./ROADMAP.md) S44; `routes/batchPrint.ts`, `layoutSheets.ts`, `viewerExports.ts` | Massstab, Formularprofile, Positionsnummern und gebuendelte Montageunterlagen browserseitig abnehmen | P1 |
| IFC, DXF, GLB/glTF und weitere CAD-Formate | vorhanden/teilweise | [`INTEROP.md`](./INTEROP.md), [`STATUS.md`](./STATUS.md); `routes/cadInterop.ts`, `ifcInterop.ts`, `exports.ts` | Formatversprechen je Richtung/Objekttyp exakt dokumentieren und mit Roundtrip-/Fixture-Gates belegen | P1 |
| DMS und Dateisynchronisation | vorhanden/teilweise | [`ROADMAP.md`](./ROADMAP.md) S26/S91; `planner-api/src/routes/documents.ts` | Versionen, Konflikte, Offline-/Online-Sync und aus CAD erzeugte Dokumente im realen Betrieb pruefen | P1 |
| Multi-Tenant, Rollen und Team | kritisch pruefen | [`ROADMAP.md`](./ROADMAP.md) S17/S50; [`STATUS.md`](./STATUS.md) S121 | Tenant-Scope darf nicht durch Demo-Fallbacks verdeckt werden; Auth/Rollen sind Release-Gate | **P0** |
| BI/Dashboards | vorhanden/teilweise | [`ROADMAP.md`](./ROADMAP.md) S28/S102; `planner-api/src/routes/bi.ts`, `dashboards.ts` | Kennzahlen aus bevorzugtem Design, Angebot, Auftrag und Umsatz fachlich verbinden | P2 |

## Empfohlene Umsetzungsreihenfolge

### P0 – Winner-tauglicher Kernpfad

1. `Projekt -> erster Raum -> geschlossene Waende -> Speichern -> Reload` ohne Sackgasse.
2. Nach jeder Geometrieaenderung sind 2D, 3D und Wandansicht synchron; Wandwahl und Wandparameter funktionieren.
3. `Katalog -> Modell/Variante -> Artikel platzieren -> Eigenschaften/Hoehe -> Preis/BOM` als durchgaengiger, getesteter Flow.
4. Arbeitsplatten-/Sockel-/Passstueck-Automatik mit Geometrie, Artikelnummern und Preisen verbinden.
5. `Planung -> BOM -> Kalkulation -> Angebot/PDF` einschliesslich MwSt., Rabatt, Zusatzkosten und Marge als Release-Gate.
6. Tenant-/Benutzerkontext ohne Demo-Verschleierung stabilisieren.

### P1 – Studio- und Auftragsworkflow

1. Bereiche/Alternativen, bevorzugtes Design, Projektstatus und Kunden-/Vertriebsdaten vervollstaendigen.
2. Angebot in Lieferantenbestellung/Produktionsauftrag ueberfuehren; Termine, AB und EK-Nachtrag abbilden.
3. Druck-/Montageunterlagen, Installationsplan, DMS-Versionen und CAD-Exporte als ein Paket abnehmen.
4. Katalogindexe, eigene Kataloge, Favoriten und Aktualisierung betriebssicher machen.

### P2 – Praesentation und Plattformtiefe

1. Rendering/360/Kundenfreigabe qualitativ und performant haerten.
2. BI/Dashboards aus realen Projekt-, Angebots- und Auftragsdaten ableiten.
3. Team-/Shop-Betrieb, Offlinefaehigkeit und Konfliktbehandlung ausbauen.

## Abnahmeregel

Ein Bereich gilt nicht allein wegen vorhandener Route, UI-Komponente oder Sprint-Dokumentation als Winner-orientiert fertig. Fuer P0/P1 ist mindestens ein browsergestuetzter Goldpfad mit echtem Backend, persistiertem Reload und sichtbarem Ergebnis in den betroffenen Ansichten erforderlich.

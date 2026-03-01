# TASKS_CLAUDE_CODE.md

## Aufgaben für Claude Code

**Zuständigkeit:** Architektur, API-Struktur, größere Refactorings, End-to-End-Features, Datenfluss Frontend ↔ API ↔ Worker ↔ Interop

> Stand 2026-03-01: Die Sprintliste ist für den aktuellen MVP-Stand abgeschlossen. Dokumentierte Restpunkte betreffen vor allem native DWG-Binary-Pfade; der produktive Interop-Pfad ist aktuell DXF-basiert.

---

## TASK-0-01 – Repo-Struktur und Grundgerüst anlegen

**Sprint:** 0
**Zuständig:** Claude Code
**Abhängigkeiten:** keine
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Repo-Struktur gemäß Plan anlegen, Grundpakete initialisieren.

### Akzeptanzkriterien
- [x] Verzeichnisse `planner-frontend/`, `planner-api/`, `render-worker/`, `shared-schemas/`, `interop-cad/`, `interop-sketchup/` angelegt
- [x] Basis-Package-Files je Paket vorhanden
- [x] `docs/` mit Platzhalter-Dokumenten befüllt

### Nicht in Scope
Echte Implementierung — nur Strukturgerüst

---

## TASK-0-02 – ARCHITECTURE.md verfassen

**Sprint:** 0
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-0-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Technische Architektur dokumentieren: Schichten, Kommunikationswege, Tech-Stack.

### Akzeptanzkriterien
- [x] Frontend ↔ API ↔ Worker ↔ Interop beschrieben
- [x] Datenbankstrategie (Postgres) festgehalten
- [x] Render-Protokoll-Überblick vorhanden
- [x] CAD/SKP-Interop-Strategie skizziert

---

## TASK-0-03 – ROOM_MODEL.md verfassen

**Sprint:** 0
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-0-02
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Domänenmodell für Räume, Wände, Öffnungen, Dachschrägen definieren.

### Akzeptanzkriterien
- [x] `Room`, `RoomBoundary`, `Vertex`, `WallSegment`, `Opening`, `CeilingConstraint` beschrieben
- [x] JSON-Beispielstruktur vorhanden
- [x] Platzierungskonzept `wall_id + offset` erklärt

---

## TASK-0-04 – PRICING_MODEL.md und QUOTE_MODEL.md verfassen

**Sprint:** 0
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-0-02
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Kaufmännische Kernobjekte und Berechnungsreihenfolge dokumentieren.

### Akzeptanzkriterien
- [x] 9-stufige Preislogik beschrieben (Listenpreis → Rundung)
- [x] `BOMLine`, `PriceComponent`, `PriceSummary`, `Quote`, `QuoteItem` definiert
- [x] API-Contracts für Pricing und Quote grob festgelegt

---

## TASK-0-05 – RENDER_PROTOCOL.md, CAD_INTEROP.md, SKP_INTEROP.md verfassen

**Sprint:** 0
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-0-02
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Render-Job-Protokoll: Worker-Registrierung, Job-Fetch, Ergebnis-Upload beschrieben
- [x] CAD-Interop: neutrales internes Austauschformat, Layer-Strategie, Scope DWG/DXF 2D
- [x] SKP-Interop: Referenzmodell-Konzept, Mapping-Strategie

---

## TASK-1-01 – Backend-Grundgerüst (planner-api)

**Sprint:** 1
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-0-02
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Lauffähiges Backend mit Postgres-Schema und erstem Projekt-CRUD.

### Akzeptanzkriterien
- [x] Tabellen: `users`, `projects`, `project_versions`, `rooms`, `price_lists`, `tax_groups`, `quote_settings`
- [x] API-Endpunkte: `POST /projects`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id`
- [x] Backend lokal startbar und testbar

---

## TASK-2-01 – Frontend-Grundgerüst (planner-frontend)

**Sprint:** 2
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-1-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Web-App-Hülle mit Editor-Layout bereitstellen.

### Akzeptanzkriterien
- [x] Projektliste zeigt Projekte aus API
- [x] Editor-Layout: Canvas-Bereich, linke Sidebar, rechte Sidebar, Status-/Summenbereich
- [x] Projekt öffnen navigiert in Editor-Ansicht

---

## TASK-3-01 – Polygon-Raumeditor Datenmodell und API

**Sprint:** 3
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-1-01, TASK-0-03
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Räume als Polygon speichern und laden – Datenfluss Backend ↔ Frontend.

### Akzeptanzkriterien
- [x] API: `POST /rooms`, `PUT /rooms/:id`, `GET /rooms/:id`
- [x] Polygon wird als `Vertex[]` + `WallSegment[]` persistiert
- [x] Frontend zeigt Polygon auf Canvas (Codex liefert Render-Logik)
- [x] Snap-Optionen konfigurierbar (0/45/90°, Raster)

---

## TASK-3-02 – CAD/SKP Import-Pipeline definieren (Sprint 3.5)

**Sprint:** 3.5
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-0-05, TASK-1-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Upload-Endpunkte und internes Austauschformat festlegen; Codex implementiert Parser.

### Akzeptanzkriterien
- [x] API: `POST /imports/cad` (DWG/DXF), `POST /imports/skp`
- [x] Neutrales internes Format (`ImportAsset`, `CadLayer`, `ReferenceGeometry`) definiert
- [x] Datei wird gespeichert, Import-Job angelegt, Status abrufbar
- [x] Frontend: Datei-Upload-UI vorhanden

---

## TASK-4-01 – Präzisionsbearbeitung Raumgeometrie (End-to-End)

**Sprint:** 4
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-3-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Vertex-Verschiebung und numerische Kantenlängenänderung durchgängig verbinden.

### Akzeptanzkriterien
- [x] Vertex-Move sendet PATCH an API, stable `wall_id` bleibt erhalten
- [x] Kantenlänge per Eingabefeld änderbar
- [x] CAD-Raumkontur-Übernahme: Polylinie → `RoomBoundary` Konvertierungsendpunkt
- [x] Layer-Filter-UI vorhanden

---

## TASK-5-01 – Öffnungen Datenmodell und API

**Sprint:** 5
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-3-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Türen/Fenster an Wänden persistieren und anzeigen.

### Akzeptanzkriterien
- [x] API: `POST /openings`, `PUT /openings/:id`, `DELETE /openings/:id`
- [x] `Opening` trägt: `wall_id`, `offset_mm`, `width_mm`, `height_mm`, `sill_height_mm`
- [x] Öffnungen aus CAD-Import übernehmbar (Endpunkt zur Übernahme)

---

## TASK-6-01 – Height Constraints Datenmodell und API

**Sprint:** 6
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-3-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] API: `POST /ceiling-constraints`, `PUT /ceiling-constraints/:id`
- [x] `CeilingConstraint`: `wall_id`, `kniestock_height_mm`, `slope_angle_deg`, `depth_into_room_mm`
- [x] Endpunkt `GET /rooms/:id/available-height?x=&y=` ruft Codex-Berechnung ab

---

## TASK-7-01 – Katalog-API und Datenmodell

**Sprint:** 7
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-1-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Tabellen: `catalog_items`, `pricing_groups`, `tax_groups`
- [x] Felder: `list_price_net`, `dealer_price_net`, `default_markup_pct`, `tax_group_id`, `pricing_group_id`
- [x] API: `GET /catalog/items`, `GET /catalog/items/:id`
- [x] SKP-Mapping-Endpunkt vorbereitet (Sprint 7.5)

---

## TASK-8-01 – Wandbasierte Platzierungsengine (End-to-End)

**Sprint:** 8
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-3-01, TASK-7-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Objekte an Wänden platzieren, verschieben, löschen – Full Stack.

### Akzeptanzkriterien
- [x] API: `POST /placements`, `PUT /placements/:id`, `DELETE /placements/:id`
- [x] `CabinetInstance`/`ApplianceInstance` mit `wall_id + offset_mm`
- [x] Frontend: Drag-along-wall mit Codex-Algorithmus verbunden
- [x] Innenrichtung der Wand korrekt aus Polygon abgeleitet

---

## TASK-9-01 – Geometrieprüfungs-Framework (End-to-End)

**Sprint:** 9
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-8-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Prüf-API aufbauen; Codex implementiert Kollisionslogik.

### Akzeptanzkriterien
- [x] API: `POST /projects/:id/validate`
- [x] Response: `{ errors: RuleViolation[], warnings: RuleViolation[], hints: RuleViolation[] }`
- [x] Frontend: Prüfpanel zeigt Ergebnisse
- [x] Kostenhinweise (Sonderblende, Sonderzuschnitt) als `hints` konfigurierbar

---

## TASK-10-01 – Höhenprüfung Dachschrägen (End-to-End)

**Sprint:** 10
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-6-01, TASK-9-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Höhenprüfung in `POST /projects/:id/validate` integriert
- [x] Flags `requires_customization`, `height_variant`, `labor_surcharge` in `RuleViolation`
- [x] Frontend zeigt Höhenkonflikte visuell an

---

## TASK-11-01 – BOM-API Endpunkt

**Sprint:** 11
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-8-01, TASK-7-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] API: `POST /projects/:id/calculate-bom`
- [x] Response: strukturierte `BOMLine[]` als JSON
- [x] Positionen: Möbel, Geräte, Zubehör, Zuschläge, Montage, Fracht
- [x] Codex-BOM-Logik über Service-Schicht eingebunden

---

## TASK-11-02 – CAD/DXF Export-Pipeline (Sprint 11.5)

**Sprint:** 11.5
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-3-02, TASK-8-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] API: `POST /projects/:id/export-dwg`, `POST /projects/:id/export-dxf`
- [x] Export enthält: Raumkontur, Wandlinien, Öffnungen, Möbelkonturen
- [x] Layer-Struktur und Einheiten/Skalierung definiert
- [x] Codex implementiert DWG/DXF-Schreib-Logik; Claude Code verbindet API ↔ Codex-Modul

---

## TASK-12-01 – Preisengine API

**Sprint:** 12
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-11-01, TASK-7-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] API: `POST /projects/:id/calculate-pricing`, `GET /projects/:id/price-summary`
- [x] Response: `{ net, vat, gross, contribution_margin, markup_pct }`
- [x] Codex-Preisregeln über Service-Schicht eingebunden

---

## TASK-13-01 – Angebotsmanagement (End-to-End)

**Sprint:** 13
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-12-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Tabellen: `quotes`, `quote_items`
- [x] API: `POST /projects/:id/create-quote`, `GET /quotes/:id`, `POST /quotes/:id/export-pdf`
- [x] Angebot enthält: Nummer, Gültig-bis, Freitext, Versionen
- [x] PDF light generierbar

---

## TASK-14-01 – Browser-3D-Preview (End-to-End)

**Sprint:** 14
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-8-01, TASK-3-02
**Priorität:** Soll
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Three.js/Babylon.js-Integration in Frontend
- [x] Floor-Polygon → trianguliert → gerendert
- [x] Wände extrudiert, Proxy-Meshes für Möbel
- [x] Orbit/Zoom/Pan funktioniert
- [x] DWG-/SKP-Referenzgeometrie ein-/ausblendbar
- [x] Preis-/Objektinfo beim Selektieren

---

## TASK-15-01 – Render-Job-System (End-to-End)

**Sprint:** 15
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-13-01
**Priorität:** Muss
**Status:** Erledigt (MVP, 2026-03-01)

### Ziel
Render-Worker-Protokoll implementieren; Job-Queue und Worker-Kommunikation.

### Akzeptanzkriterien
- [x] Tabellen: `render_jobs`, `render_job_results`, `render_nodes`
- [x] API: Job anlegen, Status abfragen, Worker-Registrierung, Job-Fetch (HTTPS), Ergebnis-Upload
- [x] Status-Flow: `queued → assigned → running → done/failed`
- [x] Scene Payload erzeugen und an Worker übergeben
- [x] End-to-End: Planung → Job → Bild zurück

---

## TASK-16-01 – Business-/Integrations-Sprint

**Sprint:** 16
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-12-01, TASK-13-01
**Priorität:** Soll
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Tabellen: `customer_price_lists`, `customer_discounts`, `project_line_items`
- [x] CRM-Felder: `lead_status`, `quote_value`, `close_probability`
- [x] Exports: JSON, CSV, Webhook-Integration

---

## TASK-17-01 – Blockverrechnung API-Rahmen

**Sprint:** 17
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-12-01
**Priorität:** Soll
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Tabellen: `block_programs`, `block_definitions`, `block_groups`, `block_conditions`, `project_block_evaluations`
- [x] API: Block-Programme verwalten, Bewertungsendpunkt `POST /projects/:id/evaluate-blocks`
- [x] Codex implementiert Bewertungsalgorithmus; Claude Code verbindet

---

## TASK-18-01 – Import-Job-System (asynchron)

**Sprint:** 18
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-3-02
**Priorität:** Soll
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Asynchrone Importjobs für große DWG-/SKP-Dateien
- [x] API: `POST /imports/cad`, `POST /imports/skp`, `GET /imports/:id`
- [x] Prüfprotokoll: importiert / ignoriert / manuelle Nacharbeit
- [x] Layer-/Komponenten-Mapping speicherbar

---

## TASK-19-01 – Interop-Härtung und Regressionstests (Koordination)

**Sprint:** 19
**Zuständig:** Claude Code
**Abhängigkeiten:** TASK-18-01, TASK-11-02
**Priorität:** Kann
**Status:** Erledigt (MVP, 2026-03-01)

### Akzeptanzkriterien
- [x] Import-/Export-Regressionstests orchestriert (Codex schreibt Tests)
- [x] Einheiten-/Skalierungsprüfung implementiert
- [x] Layer-Konventionen in `CAD_INTEROP.md` dokumentiert
- [x] Basis-Roundtrip DWG: Import → Bearbeitung → Export funktioniert

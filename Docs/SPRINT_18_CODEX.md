# SPRINT_18_CODEX.md

## Umfang

Umsetzung des Claude-Sprint-18-Rahmens fuer asynchrone Importjobs:

- TASK-18-01 - Import-Job-System
- API-Integration fuer CAD- und SKP-Importjobs
- isolierter Frontend-Upload-Client mit Job-Polling

## Umgesetzte Dateien

- `planner-api/src/routes/imports.ts`
- `planner-api/src/routes/imports.test.ts`
- `planner-frontend/src/api/imports.ts`
- `planner-frontend/src/components/imports/ImportJobPanel.tsx`
- `planner-frontend/src/components/imports/ImportJobPanel.module.css`

## Ergebnis

Implementierte Endpunkte:

- `POST /api/v1/imports/cad`
  - legt einen Importjob fuer DXF- oder DWG-basierte CAD-Dateien an
  - fuehrt den Statusfluss `queued -> processing -> done/failed` im API-Rahmen aus
  - verarbeitet DXF direkt ueber den vorhandenen Parser
  - legt fuer DWG einen reviewbaren Staging-Job mit Protokolleintrag an
  - speichert optionales Layer-Mapping im `import_asset`

- `POST /api/v1/imports/skp`
  - legt einen SKP-Importjob an
  - verarbeitet den Upload ueber den vorhandenen SKP-Parser
  - uebernimmt optionale Komponenten-Mappings in das gespeicherte Referenzmodell
  - erzeugt ein Import-Protokoll mit `imported`, `ignored` und `needs_review`

- `GET /api/v1/imports/:id`
  - liefert den gespeicherten Importjob inklusive `import_asset`, `protocol`, Status und Fehlerzustand

- `GET /api/v1/imports/:id/layers`
  - liefert die gespeicherten CAD-Layer eines Importjobs als `CadLayer[]`
  - gibt `409 IMPORT_ASSET_NOT_READY` zurueck, wenn der Job noch kein `import_asset` besitzt
  - gibt bei SKP- oder layerlosen Assets eine leere Liste zurueck

- `GET /api/v1/imports/:id/mapping-state`
  - liefert den gespeicherten Mapping-Snapshot eines Importjobs
  - gibt `409 IMPORT_ASSET_NOT_READY` zurueck, wenn der Job noch kein `import_asset` besitzt
  - liefert `{}` wenn kein Mapping-Zustand gespeichert wurde

Ergaenzende Details:

- bestehende Preview-Endpunkte fuer DXF und SKP bleiben erhalten
- der Legacy-Stub `POST /api/v1/imports` verweist jetzt auf die konkreten Endpunkte
- DXF-Dateien werden mit Parser-Ergebnis persistiert
- DWG-Dateien werden pragmatisch als gespeicherter Review-Fall behandelt, bis ein echter Binary-Adapter verdrahtet ist

Frontend-Anschluss (isoliert, ohne tiefe Editor-Eingriffe):

- neuer API-Client `planner-frontend/src/api/imports.ts`
  - `createCadImportJob(...)`
  - `createSkpImportJob(...)`
  - `getImportJob(id)`
  - Base64-Hilfsfunktion fuer `File`
- neue Komponente `ImportJobPanel`
  - Dateiauswahl fuer `.dxf`, `.dwg`, `.skp`
  - `.dxf` wird als Text (`dxf`) gesendet
  - `.dwg` und `.skp` werden als `file_base64` gesendet
  - Polling auf `GET /imports/:id` bis `done` oder `failed`
  - Anzeige von Dateiname, Status, Fehler und Protokoll-Eintraegen

## Testabdeckung

- DXF-Preview liefert geparstes `ImportAsset`
- SKP-Preview liefert geparstes Referenzmodell
- `POST /imports/cad` verarbeitet DXF-Imports inkl. Layer-Mapping
- `POST /imports/cad` legt reviewbare DWG-Jobs an
- `POST /imports/skp` verarbeitet SKP-Imports inkl. Komponenten-Mapping
- `GET /imports/:id` liefert gespeicherte Jobs
- `GET /imports/:id/layers` liefert gespeicherte Layer bzw. sauberen `409`-Status
- `GET /imports/:id/mapping-state` liefert gespeicherten Mapping-Zustand bzw. sauberen `409`-Status
- Validierungsfehler und Not-Found-Faelle sind abgesichert
- Frontend Build laeuft mit den neuen Import-Dateien gruen
- Frontend bestehende Tests bleiben gruen

## DoD-Status Sprint 18

- die geforderten Import-Job-Endpunkte sind vorhanden
- Importstatus und Importprotokoll sind abrufbar
- Mapping-Zustand fuer Layer und Komponenten kann im gespeicherten Job mitgefuehrt werden
- der API-Rahmen ist fuer spaetere echte asynchrone Worker-Verarbeitung vorbereitet
- Upload-Client arbeitet isoliert gegen die neuen Endpunkte
- Polling stoppt sauber bei `done` oder `failed`

## Naechster Sprint

Sinnvolle Anschlussarbeiten:

- minimale Einbindung des Panels an unkritischer Stelle (z. B. dedizierte Import-Seite)
- echter DWG-/SKP-Binary-Adapter statt Staging-/Mock-Pfad
- weitergehende Import-Haertung und Roundtrip-Regressionen aus Sprint 19

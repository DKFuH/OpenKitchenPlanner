# COPILOT_PROMPT_SPRINT_19_IMPORT_REVIEW.md

## Ziel

Baue eine isolierte Import-Review-Komponente fuer CAD-/SKP-Importjobs, die Status, Protokoll und Mapping-Zustand sichtbar macht, ohne die gesperrten Editor-Dateien anzufassen.

## Nicht anfassen

- `planner-frontend/src/components/editor/CanvasArea.tsx`
- `planner-frontend/src/components/editor/LeftSidebar.tsx`
- `planner-frontend/src/components/editor/RightSidebar.tsx`
- `planner-frontend/src/editor/PolygonEditor.tsx`
- `planner-frontend/src/pages/Editor.tsx`

## Backend-API

Verfuegbar sind:

- `POST /api/v1/imports/cad`
- `POST /api/v1/imports/skp`
- `GET /api/v1/imports/:id`

Importjobs enthalten:

- `status`
- `source_format`
- `source_filename`
- `protocol`
- `import_asset`
- optional `mapping_state`

## Umzusetzen

1. Neuer API-Client oder Erweiterung des bestehenden Import-Clients:
   - Datei: `planner-frontend/src/api/imports.ts`
   - Falls noch nicht vorhanden, sauber typisieren:
     - `ImportJob`
     - `ImportProtocolEntry`
     - `ImportAsset`

2. Neue isolierte Komponente:
   - `planner-frontend/src/components/imports/ImportReviewPanel.tsx`
   - `planner-frontend/src/components/imports/ImportReviewPanel.module.css`

3. Props:
   - `jobId: string`

4. Verhalten:
   - laedt `GET /api/v1/imports/:id`
   - zeigt:
     - Dateiname
     - Format
     - Status
     - Fehler
     - Protokolleintraege getrennt nach `imported`, `ignored`, `needs_review`
   - wenn vorhanden, zeigt Mapping-Zustand:
     - `mapping_state.layers`
     - `mapping_state.components`
   - wenn vorhanden, zeigt Units aus `import_asset.units`
   - hebt `needs_review` sichtbar hervor

5. Scope-Regeln:
   - keine Editor-Integration
   - keine globale State-Einfuehrung
   - keine Aenderungen an den ausgeschlossenen Editor-Dateien

## Akzeptanzkriterien

- Komponente ist isoliert renderbar.
- Importstatus und Protokoll werden sauber angezeigt.
- `needs_review`-Faelle sind klar sichtbar.
- Layer-/Komponenten-Mapping wird dargestellt, falls vorhanden.
- Keine Aenderungen an den ausgeschlossenen Editor-Dateien.

## Rueckmeldung

Bitte nur melden:

- welche Dateien neu/geaendert wurden
- ob die betroffenen Dateien fehlerfrei sind
- ob etwas ausserhalb des erlaubten Scopes angepasst werden musste

# COPILOT_PROMPT_SPRINT_18_UPLOAD_UI.md

## GitHub-Copilot-Prompt

Arbeite im Repo `YAKDS` und implementiere einen klar abgegrenzten Frontend-Anschluss fuer die bereits vorhandene Import-Job-API.

Ziel:
- Baue einen kleinen, separaten Frontend-Client fuer die neuen Backend-Endpunkte
- Fuege noch keine tiefe Editor-Integration in bestehende stark bewegte Dateien ein
- Liefere nur neue, isolierte Dateien plus optional minimale Verdrahtung an einer unkritischen Stelle

Backend-Vertrag:
- `POST /api/v1/imports/cad`
  - JSON Body:
    - `project_id: string`
    - `source_filename: string`
    - `source_format?: 'dxf' | 'dwg'`
    - `dxf?: string`
    - `file_base64?: string`
    - `layer_mapping?: Record<string, { action: 'imported' | 'ignored' | 'needs_review'; reason?: string }>`
- `POST /api/v1/imports/skp`
  - JSON Body:
    - `project_id: string`
    - `source_filename: string`
    - `file_base64: string`
    - `component_mapping?: Record<string, { target_type: 'cabinet' | 'appliance' | 'reference_object' | 'ignored'; catalog_item_id?: string | null; label?: string | null }>`
- `GET /api/v1/imports/:id`
  - liefert ImportJob mit `status`, `protocol`, `import_asset`, `error_message`

Bitte umsetzen:
- Neue Datei `planner-frontend/src/api/imports.ts`
  - `createCadImportJob(...)`
  - `createSkpImportJob(...)`
  - `getImportJob(id)`
  - Hilfsfunktion fuer Base64-Konvertierung aus `File`
- Neue isolierte Komponente `planner-frontend/src/components/imports/ImportJobPanel.tsx`
  - Dateiauswahl fuer `.dxf`, `.dwg`, `.skp`
  - Upload startet passenden Endpoint
  - Polling fuer `GET /imports/:id` bis `done` oder `failed`
  - Anzeige von Status, Fehlertext und Protocol-Eintraegen
- Optionales Stylesheet `planner-frontend/src/components/imports/ImportJobPanel.module.css`

Wichtige Grenzen:
- Nicht anfassen:
  - `planner-frontend/src/components/editor/CanvasArea.tsx`
  - `planner-frontend/src/components/editor/LeftSidebar.tsx`
  - `planner-frontend/src/components/editor/RightSidebar.tsx`
  - `planner-frontend/src/editor/PolygonEditor.tsx`
  - `planner-frontend/src/pages/Editor.tsx`
- Keine tiefen Refactors
- Bestehende API-Clients in `planner-frontend/src/api/` stilistisch nachvollziehen
- TypeScript strikt halten

Akzeptanz:
- Upload-Client arbeitet nur ueber die neuen Backend-Endpunkte
- `.dxf` nutzt Textinhalt als `dxf`, `.dwg` und `.skp` nutzen `file_base64`
- Polling stoppt sauber bei `done` oder `failed`
- UI zeigt mindestens Dateiname, Status und Protokoll

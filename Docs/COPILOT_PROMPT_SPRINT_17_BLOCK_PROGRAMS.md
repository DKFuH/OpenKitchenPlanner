# COPILOT_PROMPT_SPRINT_17_BLOCK_PROGRAMS.md

## Ziel

Baue fuer Sprint 17 eine isolierte Frontend-Verwaltung fuer Blockprogramme und Projektauswertungen, ohne die gesperrten Editor-Dateien anzufassen.

## Nicht anfassen

- `planner-frontend/src/components/editor/CanvasArea.tsx`
- `planner-frontend/src/components/editor/LeftSidebar.tsx`
- `planner-frontend/src/components/editor/RightSidebar.tsx`
- `planner-frontend/src/editor/PolygonEditor.tsx`
- `planner-frontend/src/pages/Editor.tsx`

## Backend-API

Verfuegbar sind:

- `GET /api/v1/block-programs`
- `POST /api/v1/block-programs`
- `GET /api/v1/block-programs/:id`
- `PUT /api/v1/block-programs/:id`
- `POST /api/v1/projects/:projectId/evaluate-blocks`
- `GET /api/v1/projects/:projectId/block-evaluations`

## Umzusetzen

1. Neuer API-Client:
   - Datei: `planner-frontend/src/api/blocks.ts`
   - Funktionen:
     - `listBlockPrograms()`
     - `getBlockProgram(id: string)`
     - `createBlockProgram(payload: ...)`
     - `updateBlockProgram(id: string, payload: ...)`
     - `evaluateProjectBlocks(projectId: string, payload: { program_id: string } | { blocks: ...; price_summary?: ... })`
     - `listProjectBlockEvaluations(projectId: string)`

2. Neue isolierte Komponenten:
   - `planner-frontend/src/components/blocks/BlockProgramManager.tsx`
   - `planner-frontend/src/components/blocks/BlockProgramManager.module.css`
   - optional zusaetzlich:
     - `planner-frontend/src/components/blocks/ProjectBlockEvaluations.tsx`
     - `planner-frontend/src/components/blocks/ProjectBlockEvaluations.module.css`

3. Verhalten:
   - `BlockProgramManager`
     - listet vorhandene Blockprogramme
     - zeigt Details eines gewaehlten Programms
     - erlaubt Anlegen/Bearbeiten von:
       - Name
       - Manufacturer
       - Notes
       - Aktiv-Flag
       - Groups
       - Definitions
       - Conditions
   - `ProjectBlockEvaluations`
     - nimmt `projectId` als Prop
     - kann eine gespeicherte Programmauswertung anstossen
     - listet gespeicherte Projektauswertungen mit `best_block`

4. Scope-Regeln:
   - keine Editor-Integration
   - keine globale State-Einfuehrung
   - keine Aenderungen an den ausgeschlossenen Editor-Dateien

## Akzeptanzkriterien

- Verwaltung ist isoliert renderbar.
- Blockprogramme koennen geladen, angelegt und aktualisiert werden.
- Projektauswertungen koennen angestossen und angezeigt werden.
- Fehler- und Leerzustand sind vorhanden.
- Keine Aenderungen an den ausgeschlossenen Editor-Dateien.

## Rueckmeldung

Bitte nur melden:

- welche Dateien neu/geaendert wurden
- ob die betroffenen Dateien fehlerfrei sind
- ob etwas ausserhalb des erlaubten Scopes angepasst werden musste

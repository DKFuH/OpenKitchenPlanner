# COPILOT_PROMPT_SPRINT_07_CATALOG_PANEL.md

## GitHub-Copilot-Prompt

Arbeite im Repo `YAKDS` und uebernimm eine klar isolierte Sprint-7-Anschlussaufgabe im Frontend.

Ziel:
- Baue eine kleine Katalog-Browser-Komponente auf Basis der bestehenden API
- Vermeide Eingriffe in stark bewegte Editor-Dateien

Vorhandene API:
- `GET /api/v1/catalog/items`
  - Query: `type`, `q`, `limit`, `offset`
- `GET /api/v1/catalog/items/:id`
- Frontend-Client vorhanden in `planner-frontend/src/api/catalog.ts`

Bitte umsetzen:
- Neue Komponente `planner-frontend/src/components/catalog/CatalogBrowser.tsx`
- Optionales Stylesheet `planner-frontend/src/components/catalog/CatalogBrowser.module.css`
- Funktionen:
  - Liste laden ueber `catalogApi.list(...)`
  - Filter fuer `type` und Suchtext
  - Ergebnisliste mit Name, SKU, Typ und Netto-Listenpreis
  - Klick auf ein Element laedt `catalogApi.getById(id)` und zeigt Detaildaten in einem einfachen Detailbereich

Wichtige Grenzen:
- Nicht anfassen:
  - `planner-frontend/src/components/editor/CanvasArea.tsx`
  - `planner-frontend/src/components/editor/LeftSidebar.tsx`
  - `planner-frontend/src/components/editor/RightSidebar.tsx`
  - `planner-frontend/src/editor/PolygonEditor.tsx`
  - `planner-frontend/src/pages/Editor.tsx`
- Kein globaler Refactor
- TypeScript strikt halten
- Stilistisch an bestehende `planner-frontend/src/api/*.ts` anlehnen

Akzeptanz:
- Komponente ist isoliert nutzbar
- Filter und Suche triggern API-Calls
- Detailansicht nutzt `getById`
- Keine Abhaengigkeit von den aktuellen Editor-Diffs anderer Agenten

# COPILOT_PROMPT_SPRINT_07_CATALOG_ROUTE.md

## GitHub-Copilot-Prompt

Arbeite im Repo `YAKDS` und integriere die bereits vorhandene Katalog-Komponente in eine unkritische Frontend-Route.

Bereits vorhanden:

- `planner-frontend/src/components/catalog/CatalogBrowser.tsx`
- `planner-frontend/src/components/catalog/CatalogBrowser.module.css`

Ziel:

- Fuege eine isolierte Katalog-Seite hinzu
- Vermeide Eingriffe in alle Editor-Dateien
- Nutze die bestehende Komponente ohne inhaltlichen Refactor

Bitte umsetzen:

- Neue Seite `planner-frontend/src/pages/CatalogPage.tsx`
  - rendert `CatalogBrowser`
  - einfacher Seitenrahmen mit Ueberschrift und kurzer Beschreibung
- Routing in `planner-frontend/src/main.tsx`
  - neue Route `/catalog`
- Kleine Navigation aus `planner-frontend/src/pages/ProjectList.tsx`
  - unaufdringlicher Link oder Button zur neuen Katalog-Seite
  - bestehendes Projektlisten-Verhalten unveraendert lassen

Wichtige Grenzen:

- Nicht anfassen:
  - `planner-frontend/src/components/editor/CanvasArea.tsx`
  - `planner-frontend/src/components/editor/LeftSidebar.tsx`
  - `planner-frontend/src/components/editor/RightSidebar.tsx`
  - `planner-frontend/src/editor/PolygonEditor.tsx`
  - `planner-frontend/src/pages/Editor.tsx`
- Kein globaler Layout-Refactor
- TypeScript strikt halten
- Bestehende Projektlisten-Interaktion nicht umbauen

Akzeptanz:

- `/catalog` ist direkt im Browser aufrufbar
- `CatalogBrowser` wird dort ohne Fehler gerendert
- Von der Projektliste kommt man zur Katalog-Seite und wieder zurueck

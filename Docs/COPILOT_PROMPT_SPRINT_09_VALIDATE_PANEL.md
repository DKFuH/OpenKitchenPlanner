# COPILOT_PROMPT_SPRINT_09_VALIDATE_PANEL.md

## GitHub-Copilot-Prompt

Arbeite im Repo `YAKDS` und uebernimm eine isolierte Frontend-Anschlussaufgabe fuer Sprint 9/10.

Backend-Vertrag:

- `POST /api/v1/projects/:id/validate`
- Body:
  - `user_id: string`
  - `roomPolygon: Point[]`
  - `objects: Array<{ id, type, wall_id, offset_mm, width_mm, depth_mm, height_mm, worldPos? }>`
  - `openings: Opening[]`
  - `walls: Wall[]`
  - `ceilingConstraints: CeilingConstraint[]`
  - `nominalCeilingMm?: number`
  - `minClearanceMm?: number`
- Response:
  - `valid: boolean`
  - `errors: RuleViolation[]`
  - `warnings: RuleViolation[]`
  - `hints: RuleViolation[]`
  - `violations: RuleViolation[]`

Ziel:

- Baue eine isolierte Validierungs-UI ohne Eingriff in die aktiven Editor-Dateien

Bitte umsetzen:

- Neue API-Datei `planner-frontend/src/api/validation.ts`
  - Funktion `validateProject(projectId, payload)`
- Neue Komponente `planner-frontend/src/components/validation/ValidationPanel.tsx`
  - Props fuer `projectId` und vorbereiteten Payload
  - Button zum Ausloesen der Validierung
  - getrennte Anzeige fuer Fehler, Warnungen und Hinweise
  - einfacher Leerzustand und Fehlerzustand
- Optionales Stylesheet `planner-frontend/src/components/validation/ValidationPanel.module.css`

Wichtige Grenzen:

- Nicht anfassen:
  - `planner-frontend/src/components/editor/CanvasArea.tsx`
  - `planner-frontend/src/components/editor/LeftSidebar.tsx`
  - `planner-frontend/src/components/editor/RightSidebar.tsx`
  - `planner-frontend/src/editor/PolygonEditor.tsx`
  - `planner-frontend/src/pages/Editor.tsx`
- Kein globaler Refactor
- TypeScript strikt halten

Akzeptanz:

- Panel ist isoliert renderbar
- API-Client nutzt den neuen projektgebundenen Validate-Endpoint
- Ergebnislisten sind nach `errors`, `warnings` und `hints` getrennt

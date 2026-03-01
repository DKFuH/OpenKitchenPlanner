# TEAM_CATCHUP_AB_SPRINT_05_2026-03-01

## Ziel

Die nachlaufenden Streams sollen auf denselben Arbeitsstand gezogen werden, damit ab jetzt keine Doppelimplementierungen mehr in denselben Bereichen entstehen.

## Gemeinsamer Zielstand

Technisch verfuegbar und dokumentiert:

- Sprint 06
- Sprint 07
- Sprint 08
- Sprint 09
- Sprint 10
- Sprint 11
- Sprint 11.5
- Sprint 12
- Sprint 13
- Sprint 14
- Sprint 15
- Sprint 17

Zusatzsprints mit fertiger Codex-Logik und Doku:

- Sprint 02
- Sprint 03
- Sprint 03.5
- Sprint 04
- Sprint 05
- Sprint 07.5
- Sprint 19

## Was inzwischen zusaetzlich im Workspace steckt

Bereits nutzbar und deshalb nicht neu bauen:

- `/api/v1/openings/validate`
- `/api/v1/openings/detect-from-cad`
- `/api/v1/validate` inklusive Dachschraegen-/Hoehenpruefung
- `/api/v1/bom/preview`
- `/api/v1/pricing/preview`
- `/api/v1/pricing/block-preview`
- `/api/v1/imports/preview/dxf`
- `/api/v1/imports/preview/skp`
- `/api/v1/exports/dxf`
- `/api/v1/projects/:projectId/export-dxf`

Lokale konsumierbare Interop-Pakete sind ebenfalls vorhanden:

- `@yakds/dxf-import`
- `@yakds/dxf-export`
- `@yakds/skp-import`
- `@yakds/shared-schemas`

## Pflicht-Lesereihenfolge fuer alle Nachzieher

1. `Docs/SPRINT_06_CODEX.md`
2. `Docs/SPRINT_07_CODEX.md`
3. `Docs/SPRINT_08_CODEX.md`
4. `Docs/SPRINT_09_CODEX.md`
5. `Docs/SPRINT_10_CODEX.md`
6. `Docs/SPRINT_11_CODEX.md`
7. `Docs/SPRINT_11_5_CODEX.md`
8. `Docs/SPRINT_12_CODEX.md`
9. `Docs/SPRINT_13_CODEX.md`
10. `Docs/SPRINT_14_CODEX.md`
11. `Docs/SPRINT_15_CODEX.md`
12. `Docs/SPRINT_17_CODEX.md`

Fuer Interop-Nachzug zusaetzlich:

1. `Docs/SPRINT_03_5_CODEX.md`
2. `Docs/SPRINT_07_5_CODEX.md`
3. `Docs/SPRINT_19_CODEX.md`

## Harte Sync-Regeln

- Erst lesen und abgleichen, dann implementieren.
- Keine bereits vorhandenen Preview-, Validate- oder Export-Endpunkte erneut anlegen.
- Keine Quellpfad-Imports ueber Paketgrenzen hinweg neu einfuehren, wenn bereits ein lokales Paket existiert.
- Generierte `.js`, `.d.ts` und `.map` Dateien nicht manuell fachlich editieren.
- Neue Arbeit ab jetzt nur noch in freien Bereichen oder auf Sprint 16+.

## Aktuelle Hotspots im Worktree

Dort laufen parallel bereits Aenderungen. Vor neuen Edits zuerst diff lesen:

- `planner-frontend/src/pages/Editor.tsx`
- `planner-frontend/src/components/editor/LeftSidebar.tsx`
- `planner-frontend/src/components/editor/RightSidebar.tsx`
- `planner-frontend/src/components/editor/Preview3D.tsx`
- `planner-api/src/routes/renderJobs.ts`
- `planner-api/src/routes/quotes.ts`
- `planner-api/src/routes/bom.ts`
- `planner-api/src/routes/pricing.ts`
- `planner-api/src/routes/openings.ts`
- `planner-api/src/routes/validate.ts`

## Installations-Schritte fuer Gleichstand

Im Repo-Root:

- `npm install`

Im API-Paket:

- `npm --prefix planner-api install`

Optional fuer Frontend-Nachzug:

- `npm --prefix planner-frontend install`

## Technische Verifikation nach Sync

Interop-Paket-Builds:

- `npx tsc -p interop-cad/dxf-import/tsconfig.json`
- `npx tsc -p interop-cad/dxf-export/tsconfig.json`
- `npx tsc -p interop-sketchup/skp-import/tsconfig.json`

Backend/API-Regressionsblock:

- `npm --prefix planner-api run build`
- `npm --prefix planner-api test`

Root-Regression:

- `npm test`

Frontend-Build und Tests:

- `npm --prefix planner-frontend run build`
- `npm --prefix planner-frontend test`

## Ready-Definition fuer "gleichgezogen"

Eine Person gilt als gleichgezogen, wenn:

- alle Pflicht-Dokus gelesen und mit dem aktuellen Worktree abgeglichen sind,
- keine Duplikat-Implementierungen gegen vorhandene Endpunkte oder Services offen sind,
- Root-Test, planner-api-Build/Test und die drei Interop-Builds lokal gruen laufen,
- neue Arbeit nur noch in freien Bereichen oder auf Sprint 16+ startet.

## Nachrichtenvorlage an alle

"Bitte jetzt auf gemeinsamen Stand ziehen. Erst die Sprint-Dokus 06 bis 17 lesen, fuer Interop zusaetzlich 03.5 und 07.5. Danach `npm install`, `npm --prefix planner-api install`, die drei Interop-Builds, `planner-api build/test` und Root-`npm test` laufen lassen. Vor Edits in Editor-, Sidebar-, renderJobs-, bom-, pricing-, openings- oder validate-Dateien immer erst den aktuellen Diff lesen. Rueckmeldung bitte nur mit `synced` oder konkretem Blocker."

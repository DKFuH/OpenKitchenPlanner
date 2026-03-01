# SPRINT_03_CODEX.md

## Umfang

Umsetzung der Codex-Aufgaben aus Sprint 3:

- TASK-3-C01 – Polygon-Validierung
- TASK-3-C02 – Snap-Logik für Canvas-Editor

## Umgesetzte Dateien

- `shared-schemas/src/geometry/validatePolygon.ts`
- `shared-schemas/src/geometry/validatePolygon.test.ts`
- `planner-frontend/src/editor/snapUtils.ts`
- `planner-frontend/src/editor/snapUtils.test.ts`

## Ergebnis TASK-3-C01

Implementiert wurde:

- `validatePolygon(vertices, minEdgeLengthMm)`
- Mindestanzahl Vertices (>= 3)
- automatische Ringschließung, falls letzter Punkt nicht gleich erster Punkt ist
- Kantenlängenprüfung gegen konfigurierbares Minimum
- Selbstüberschneidungsprüfung über Segment-Segment-Intersection (adjazente Kanten ausgenommen)

Tests abgedeckt:

- valides Rechteck
- valides L-Polygon (6 Ecken)
- selbstüberschneidendes Polygon
- zu kurze Kante
- zu wenige Punkte

## Ergebnis TASK-3-C02

Implementiert wurde:

- `snapToAngle(point, origin, allowedAngles)`
- `snapToGrid(point, gridSizeMm)`
- `snapPoint(point, origin, gridSizeMm, angleSnap)`

Logik:

- Winkel-Snap auf nächstgelegenen erlaubten Winkel
- Raster-Snap über Rundung auf Gitterabstand
- Kombinierter Snap: zuerst Grid, dann Winkel (falls aktiviert und Origin vorhanden)

Tests abgedeckt:

- 47° wird auf 45° gesnappt
- 1234 mm wird bei 100-mm-Raster auf 1200 mm gerundet
- Kombination aus Grid + Angle Snap

## DoD-Status Sprint 3

- Räume können validiert werden (Selbstüberschneidung, Mindestkantenlänge, Ring)
- Snap-Utilities für den Editor sind als reine Funktionen verfügbar
- Unit-Tests für Kernfälle vorhanden

## Nächster Sprint

Sprint 4 (TASK-4-C01):

- `moveVertex`
- `setEdgeLength`
- `polylineToRoomBoundary`
- inklusive Unit-Tests und Sprint-Doku

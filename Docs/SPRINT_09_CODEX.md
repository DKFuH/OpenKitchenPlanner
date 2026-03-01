# SPRINT_09_CODEX.md

## Umfang

Umsetzung der Codex-Aufgabe aus Sprint 9:

- TASK-9-C01 – Kollisionsdetektions-Algorithmen

## Umgesetzte Dateien

- `shared-schemas/src/validation/collisionDetector.ts`
- `shared-schemas/src/validation/collisionDetector.test.ts`

## Ergebnis

Implementierte Funktionen:

- `checkObjectOverlap(a, b)`
  - 1D-Intervall-Overlap auf gleicher Wand
  - Fehlercode: `OBJECT_OVERLAP`

- `checkObjectInRoom(obj, roomPolygon)`
  - Point-in-Polygon auf `obj.worldPos`
  - Fehlercode: `OBJECT_OUTSIDE_ROOM`

- `checkObjectVsOpening(obj, openings)`
  - Intervall-Overlap Objekt vs. Öffnung auf gleicher Wand
  - Fehlercode: `OBJECT_BLOCKS_OPENING`

- `checkMinClearance(obj, others, minMm)`
  - Abstand zwischen Objektintervallen
  - Warncode: `MIN_CLEARANCE_VIOLATED`

- `detectCostHints(obj, wall, openings)`
  - Hint `SPECIAL_TRIM_NEEDED` bei nicht-bündiger Endlage
  - Hint `LABOR_SURCHARGE` bei schrägen Wandwinkeln (>10° Abweichung von orthogonal)

## Testabdeckung

- Objekt-Overlap
- Objekt außerhalb Raum
- Objekt blockiert Öffnung
- Mindestabstandsverletzung
- Cost-Hints für Sonderblende/Montageaufwand

## DoD-Status Sprint 9

- Fehler-, Warn- und Hint-Detection in isolierter Validierungslogik vorhanden
- Backend-Validierungsantwort kann diese Violations in `errors`, `warnings` und `hints` gruppiert ausgeben

## Nächster Sprint

Sprint 10 (TASK-10-C01):

- Höhenprüfung gegen Dachschrägen
- Flags für Anpassung/Variante/Zuschlag
- Unit-Tests und Sprint-Dokumentation

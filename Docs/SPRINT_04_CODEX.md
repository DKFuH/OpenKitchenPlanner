# SPRINT_04_CODEX.md

## Umfang

Umsetzung der Codex-Aufgabe aus Sprint 4:

- TASK-4-C01 – Vertex-Verschiebung und Kantenlängenberechnung

## Umgesetzte Dateien

- `shared-schemas/src/geometry/polygonEditor.ts`
- `shared-schemas/src/geometry/polygonEditor.test.ts`

## Ergebnis

Implementierte Funktionen:

- `moveVertex(vertices, index, newPos)`
  - verschiebt genau einen Vertex
  - arbeitet immutabel
  - validiert Indexbereich

- `setEdgeLength(vertices, edgeIndex, newLengthMm)`
  - passt den End-Vertex der Kante `edgeIndex -> edgeIndex+1` entlang der Kantenrichtung an
  - alle anderen Vertices bleiben unverändert
  - validiert Edge-Index und Längenparameter

- `polylineToRoomBoundary(points)`
  - konvertiert CAD-Polylinie zu `Vertex[]`
  - erzeugt UUIDs pro Vertex via `crypto.randomUUID()`
  - schließt den Ring automatisch, falls nötig

## Testabdeckung

- Vertex-Move verändert nur Zielpunkt
- Kantenlänge wird numerisch korrekt angepasst
- Polyline wird korrekt geschlossen
- Fehlerfall bei zu wenigen Punkten

## DoD-Status Sprint 4

- Präzisionsbearbeitung als Kernlogik umgesetzt
- Unit-Tests für Haupt- und Edge-Cases vorhanden

## Nächster Sprint

Sprint 5 (TASK-5-C01):

- `validateOpening`
- `detectOpeningsFromCad`
- Unit-Tests
- Sprint-Dokumentation

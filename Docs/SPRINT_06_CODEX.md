# SPRINT_06_CODEX.md

## Umfang

Umsetzung der Codex-Aufgabe aus Sprint 6:

- TASK-6-C01 – Höhenberechnung (Dachschrägen)

## Umgesetzte Dateien

- `shared-schemas/src/geometry/ceilingHeight.ts`
- `shared-schemas/src/geometry/ceilingHeight.test.ts`

## Ergebnis

Implementierte Funktionen:

- `getHeightAtPoint(constraint, point, nominalCeilingMm)`
  - berechnet den senkrechten Abstand des Punkts zur Wandlinie
  - verwendet die definierte Schräge-Formel
  - gibt bei Distanz außerhalb `depth_into_room_mm` die volle nominelle Höhe zurück
  - begrenzt Ergebnisse auf maximal `nominalCeilingMm`

- `getAvailableHeight(constraints, point, nominalCeilingMm)`
  - liefert das Minimum über alle Constraints
  - liefert bei leerer Constraint-Liste die nominelle Höhe

## Testabdeckung

- Punkt direkt an Wand = Kniestockhöhe
- Punkt hinter Schräge = volle Raumhöhe
- Punkt innerhalb Schräge = interpolierter Wert
- mehrere Constraints = korrektes Minimum

## DoD-Status Sprint 6

- Dachschrägen als Height Constraints auswertbar
- mehrere Schrägen pro Raum fachlich abgebildet

## Nächster Sprint

Sprint 8 (TASK-8-C01):

- Wandrichtungs- und Innennormalenberechnung
- Projektion/Snap auf Wand
- Platzierbarkeitsprüfung
- Unit-Tests
- Sprint-Dokumentation

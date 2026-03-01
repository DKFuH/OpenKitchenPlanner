# SPRINT_10_CODEX.md

## Umfang

Umsetzung der Codex-Aufgabe aus Sprint 10:

- TASK-10-C01 – Höhenprüfung gegen Dachschrägen

## Umgesetzte Dateien

- `shared-schemas/src/validation/heightChecker.ts`
- `shared-schemas/src/validation/heightChecker.test.ts`

## Ergebnis

Implementierte Funktionen:

- `checkObjectHeight(obj, constraints, nominalCeilingMm)`
  - nutzt `getAvailableHeight` aus `ceilingHeight.ts`
  - erzeugt Violation bei Höhenüberschreitung
  - Codes:
    - `HEIGHT_EXCEEDED` (z. B. Hochschrank)
    - `HANGING_CABINET_SLOPE_COLLISION` (Hängeschrank-Typ)
  - setzt Flags:
    - `requires_customization` bei >50 mm Überschreitung
    - `height_variant = 'low_version'` bei <200 mm Überschreitung
    - `labor_surcharge = true` bei Verstoß

- `checkAllObjects(objects, constraints, nominalCeilingMm)`
  - wertet alle Objekte aus
  - gibt nur tatsächliche Violations zurück

## Testabdeckung

- Objekt passt unter verfügbare Höhe
- Kollision für Hängeschranktyp
- Flag-Setzung bei Überschreitung
- Sammelprüfung mehrerer Objekte

## DoD-Status Sprint 10

- Dachschrägen beeinflussen Platzierungs- und Höhenvalidierung
- kaufmännische Folgeflags als technische Grundlage vorhanden

## Nächster Sprint

Sprint 11 (TASK-11-C01):

- BOM-Berechnung
- Summenfunktion
- Unit-Tests
- Sprint-Dokumentation

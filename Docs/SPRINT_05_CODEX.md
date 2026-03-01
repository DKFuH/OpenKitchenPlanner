# SPRINT_05_CODEX.md

## Umfang

Umsetzung der Codex-Aufgabe aus Sprint 5:

- TASK-5-C01 – Öffnungs-Validierung

## Umgesetzte Dateien

- `shared-schemas/src/geometry/openingValidator.ts`
- `shared-schemas/src/geometry/openingValidator.test.ts`

## Ergebnis

Implementierte Funktionen:

- `validateOpening(wall, opening, existingOpenings)`
  - prüft `offset_mm >= 0`
  - prüft `width_mm > 0`
  - prüft `offset_mm + width_mm <= wall.length_mm`
  - prüft Überschneidung mit bestehenden Öffnungen auf derselben Wand

- `detectOpeningsFromCad(entities, wallLength_mm)`
  - extrahiert Linienintervalle aus CAD-Entities
  - merged überlappende Segmente
  - erkennt Lücken als Öffnungskandidaten
  - berücksichtigt nur Breiten im Bereich 500–3000 mm

## Testabdeckung

- gültige Öffnung
- negative Offsets
- Öffnung außerhalb Wandlänge
- Überlappung mit existierender Öffnung
- CAD-Lücken-Erkennung
- Filterung ungültiger Lückenbreiten

## DoD-Status Sprint 5

- Türen/Fenster an Polygonwänden fachlich validierbar
- Übernahme von Öffnungskandidaten aus CAD als Basislogik vorhanden

## Nächster Sprint

Sprint 6 (TASK-6-C01):

- `getHeightAtPoint`
- `getAvailableHeight`
- Unit-Tests
- Sprint-Dokumentation

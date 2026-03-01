# REVIEW_HANDOFF_GITHUB_COMPANION_2026-03-01.md

## Ziel

Diese Datei bündelt den aktuellen Umsetzungsstand für die Review-Tasks in `Docs/TASKS_GITHUB_COMPANION.md`.
Sprint 01 wird parallel von anderen Agents bearbeitet und ist hier **nicht** enthalten.

## Umgesetzt (Code + Tests)

- Sprint 3: Polygon-Validierung + Snap-Utils
- Sprint 4: Polygon-Editor-Funktionen
- Sprint 5: Opening-Validator
- Sprint 6: Ceiling-Height-Berechnung
- Sprint 8: Wall-Placement-Math
- Sprint 9: Collision-Detector
- Sprint 10: Height-Checker
- Sprint 11: BOM-Calculator

Zugehörige Sprint-Dokus:

- `Docs/SPRINT_03_CODEX.md`
- `Docs/SPRINT_04_CODEX.md`
- `Docs/SPRINT_05_CODEX.md`
- `Docs/SPRINT_06_CODEX.md`
- `Docs/SPRINT_08_CODEX.md`
- `Docs/SPRINT_09_CODEX.md`
- `Docs/SPRINT_10_CODEX.md`
- `Docs/SPRINT_11_CODEX.md`

## Validierungsstand

Letzter Gesamttest (grün):

`npm test -- shared-schemas/src/geometry/validatePolygon.test.ts shared-schemas/src/geometry/polygonEditor.test.ts shared-schemas/src/geometry/openingValidator.test.ts shared-schemas/src/geometry/ceilingHeight.test.ts shared-schemas/src/geometry/wallPlacement.test.ts shared-schemas/src/validation/collisionDetector.test.ts shared-schemas/src/validation/heightChecker.test.ts planner-frontend/src/editor/snapUtils.test.ts planner-api/src/services/bomCalculator.test.ts`

Ergebnis: 9 Test Files, 37 Tests, alle bestanden.

---

## Review-Pakete für Github Companion

### 1) TASK-3-R01 – Polygon-Editor PR

**Hinweis zur Dateikorrektur:**

- Statt `shared-schemas/src/geometry/snapUtils.ts` bitte `planner-frontend/src/editor/snapUtils.ts` verwenden.
- `planner-frontend/src/editor/PolygonEditor.tsx` existiert aktuell nicht im implementierten Scope.

**Betroffene Dateien (real):**

- `shared-schemas/src/geometry/validatePolygon.ts`
- `shared-schemas/src/geometry/validatePolygon.test.ts`
- `planner-frontend/src/editor/snapUtils.ts`
- `planner-frontend/src/editor/snapUtils.test.ts`

**Prompt für GROK (copy/paste):**

```text
Analysiere die Polygon- und Snap-Implementierung eines Küchenplaners auf Korrektheit und Robustheit.

Betroffene Dateien:
- shared-schemas/src/geometry/validatePolygon.ts
- shared-schemas/src/geometry/validatePolygon.test.ts
- planner-frontend/src/editor/snapUtils.ts
- planner-frontend/src/editor/snapUtils.test.ts

Prüfe:
1. Deckt die Polygon-Validierung Edge Cases ab?
   - degeneriertes Polygon (kollinear)
   - doppelte Punkte
   - sehr kurze Kanten
2. Ist die Segment-Intersection robust bei Grenzfällen (adjazent, collinear)?
3. Ist die Snap-Logik numerisch stabil (Floating-Point, Winkelgrenzen)?
4. Sind die Tests ausreichend für Grenzfälle?

Antworte mit: Befunde (Datei + Zeile), Risiko, konkrete Verbesserung.
```

### 2) TASK-5-R01 – Öffnungen

**Betroffene Dateien (real):**

- `shared-schemas/src/geometry/openingValidator.ts`
- `shared-schemas/src/geometry/openingValidator.test.ts`

**Prompt für GROK (copy/paste):**

```text
Analysiere die Öffnungs-Implementierung (Türen/Fenster) auf Logik, Edge Cases und Testabdeckung.

Dateien:
- shared-schemas/src/geometry/openingValidator.ts
- shared-schemas/src/geometry/openingValidator.test.ts

Prüfe:
1. Grenzwerte: offset < 0, width <= 0, offset+width == wall.length, > wall.length
2. Überlappungstest bei mehreren Öffnungen auf derselben Wand
3. CAD-Kandidaten-Erkennung: Gap-Logik, min/max Breite, Reihenfolge
4. Verhalten bei leeren/inkonsistenten CAD-Entities

Ergebnis als: Befunde (Datei + Zeile), Schweregrad, Fix-Vorschlag.
```

### 3) TASK-8-R01 – Platzierungsengine

**Betroffene Dateien (real):**

- `shared-schemas/src/geometry/wallPlacement.ts`
- `shared-schemas/src/geometry/wallPlacement.test.ts`

**Prompt für GROK (copy/paste):**

```text
Analysiere die wandbasierte Platzierungsengine auf mathematische Korrektheit und Robustheit.

Dateien:
- shared-schemas/src/geometry/wallPlacement.ts
- shared-schemas/src/geometry/wallPlacement.test.ts

Prüfe:
1. Innennormalen-Bestimmung für konvexe/konkave Polygone
2. Verhalten bei Wandlänge = 0
3. Snap/Projection: Clamp-Verhalten und numerische Stabilität
4. canPlaceOnWall: Intervallregeln und Randfälle (berührend vs. überlappend)

Bitte mit konkreten Befunden (Datei + Zeile) und Korrekturvorschlägen.
```

### 4) TASK-9-R01 – Kollisionserkennung

**Betroffene Dateien (real):**

- `shared-schemas/src/validation/collisionDetector.ts`
- `shared-schemas/src/validation/collisionDetector.test.ts`

**Prompt für GROK (copy/paste):**

```text
Analysiere die Kollisionserkennung auf Vollständigkeit, Korrektheit und Grenzfälle.

Dateien:
- shared-schemas/src/validation/collisionDetector.ts
- shared-schemas/src/validation/collisionDetector.test.ts

Prüfe:
1. Overlap, Outside-Room, Opening-Block, Min-Clearance jeweils logisch korrekt
2. Point-in-Polygon Grenzverhalten auf Kanten/Vertices
3. Cost-Hints: Kriterien für SPECIAL_TRIM_NEEDED und LABOR_SURCHARGE
4. Testabdeckung auf false positives / false negatives

Liefere Befunde mit Datei + Zeile, Risiko und Verbesserung.
```

### 5) TASK-10-R01 – Höhenprüfung

**Betroffene Dateien (real):**

- `shared-schemas/src/geometry/ceilingHeight.ts`
- `shared-schemas/src/geometry/ceilingHeight.test.ts`
- `shared-schemas/src/validation/heightChecker.ts`
- `shared-schemas/src/validation/heightChecker.test.ts`

**Prompt für Claude (copy/paste):**

```text
Reviewe die Höhenprüfung gegen Dachschrägen auf Modellkonsistenz und Regelkonformität.

Dateien:
- shared-schemas/src/geometry/ceilingHeight.ts
- shared-schemas/src/validation/heightChecker.ts
- Docs/ROOM_MODEL.md

Prüfe:
1. Stimmt die Formel und Distanzdefinition mit ROOM_MODEL.md überein?
2. Sind Flags (requires_customization, height_variant, labor_surcharge) konsistent gesetzt?
3. Sind Codes HEIGHT_EXCEEDED und HANGING_CABINET_SLOPE_COLLISION fachlich passend?
4. Gibt es unstabile Randfälle (z.B. near-zero Abstand, mehrere Constraints)?

Antwort mit Ja/Nein je Punkt + konkreten Befunden (Datei + Zeile).
```

### 6) TASK-11-R01 – BOM-Engine

**Betroffene Dateien (real):**

- `planner-api/src/services/bomCalculator.ts`
- `planner-api/src/services/bomCalculator.test.ts`
- `Docs/PRICING_MODEL.md`

**Prompt für Claude (copy/paste):**

```text
Reviewe die BOM-Implementierung auf Spec-Konformität zu PRICING_MODEL.md.

Dateien:
- planner-api/src/services/bomCalculator.ts
- planner-api/src/services/bomCalculator.test.ts
- Docs/PRICING_MODEL.md

Prüfe:
1. Werden benötigte BOMLineTypes korrekt erzeugt?
2. Sind Pflichtfelder der BOMLine vollständig und sinnvoll gefüllt?
3. Ist die Ableitung aus Flags (special_trim_needed, labor_surcharge, surcharges) korrekt?
4. Ist die Summenfunktion numerisch nachvollziehbar?

Antworte mit Befunden (Datei + Zeile), Abweichung zur Spec, konkrete Änderung.
```

---

## Offene Punkte für spätere Reviews

- API-/Route-Reviews für `rooms`, `placements`, `validate`, `bom` sind nur sinnvoll, sobald die entsprechenden Backend-Routen vorhanden sind.
- TASK-3.5/CAD-Import-Reviews können parallel für `interop-cad/dxf-import/src/dxfParser.ts` gestartet werden, da diese Dateien bereits vorhanden sind.

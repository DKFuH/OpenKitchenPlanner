# SPRINT_06_CODEX.md

## Umfang

Umsetzung der Sprint-6-Bausteine fuer Dachschraegen:

- TASK-6-C01 - Hoehenberechnung
- TASK-6-01 - Ceiling-Constraints-API

## Umgesetzte Dateien

- `shared-schemas/src/geometry/ceilingHeight.ts`
- `shared-schemas/src/geometry/ceilingHeight.test.ts`
- `planner-api/src/routes/ceilingConstraints.ts`
- `planner-api/src/routes/ceilingConstraints.test.ts`
- `planner-api/src/index.ts`

## Ergebnis

Implementierte Funktionen:

- `getHeightAtPoint(constraint, point, nominalCeilingMm)`
  - berechnet den senkrechten Abstand des Punkts zur Wandlinie
  - verwendet die definierte Schraegen-Formel
  - gibt bei Distanz ausserhalb `depth_into_room_mm` die volle nominelle Hoehe zurueck
  - begrenzt Ergebnisse auf maximal `nominalCeilingMm`

- `getAvailableHeight(constraints, point, nominalCeilingMm)`
  - liefert das Minimum ueber alle Constraints
  - liefert bei leerer Constraint-Liste die nominelle Hoehe

API-Integration:

- `POST /api/v1/ceiling-constraints`
  - legt einen Ceiling-Constraint fuer einen Raum an

- `PUT /api/v1/ceiling-constraints/:id`
  - aktualisiert einen vorhandenen Ceiling-Constraint innerhalb des Room-Payloads

- `GET /api/v1/rooms/:id/available-height?x=&y=`
  - berechnet die verfuegbare Hoehe an einem konkreten Punkt
  - nutzt `room.ceiling_height_mm` plus die gespeicherten Constraints des Raums

## Testabdeckung

- Punkt direkt an Wand = Kniestockhoehe
- Punkt hinter Schraege = volle Raumhoehe
- Punkt innerhalb Schraege = interpolierter Wert
- mehrere Constraints = korrektes Minimum
- Route-Test fuer Constraint-Anlage
- Route-Test fuer Constraint-Update
- Route-Test fuer verfuegbare Hoehe am Punkt

## DoD-Status Sprint 6

- Dachschraegen sind fachlich und per API auswertbar
- mehrere Schraegen pro Raum sind ueber die Room-JSON-Struktur abbildbar
- Available-Height kann direkt vom Frontend abgefragt werden

## Naechster Sprint

Fruehe offene Claude-Luecken:

- Snapshot-Endpunkt fuer `GET /projects/:id/price-summary`
- Blockbewertungs-Endpunkt `POST /projects/:id/evaluate-blocks`
- asynchrone Import-Job-Endpunkte fuer Sprint 18

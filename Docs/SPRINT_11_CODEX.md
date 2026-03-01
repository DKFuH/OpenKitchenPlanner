# SPRINT_11_CODEX.md

## Umfang

Umsetzung der Codex-Aufgabe aus Sprint 11:

- TASK-11-C01 – BOM-Berechnungslogik

## Umgesetzte Dateien

- `planner-api/src/services/bomCalculator.ts`
- `planner-api/src/services/bomCalculator.test.ts`

## Ergebnis

Implementierte Funktionen:

- `calculateBOM(project)`
  - erzeugt BOM-Zeilen für:
    - `cabinet`
    - `appliance`
    - `accessory` (falls vorhanden)
    - `surcharge` bei `special_trim_needed`
    - `assembly` bei `labor_surcharge`
    - `freight` pauschal (immer 1x)
  - übernimmt Preisbasis aus `priceListItems`
  - überträgt `variant_surcharge` und `object_surcharges` aus Flags
  - berechnet `line_net_after_discounts` aus Positions- und Gruppenrabatt

- `sumBOMLines(lines)`
  - summiert Listenpreis-basierten Nettowert
  - summiert Nettowert nach Rabatten

## Testabdeckung

- leeres Projekt → nur Frachtzeile
- 3 Unterschränke + 1 Gerät → korrekte Hauptzeilentypen
- `special_trim_needed` → zusätzliche Zuschlagszeile
- Summenfunktion geprüft

## DoD-Status Sprint 11

- Stücklisten-Engine v1 als isoliertes Service-Modul vorhanden
- kaufmännische Basisfelder für nachgelagerte Preisengine nutzbar

## Nächster Schritt

Regressionstest über alle bislang implementierten Codex-Sprints (3, 4, 5, 6, 8, 9, 10, 11).

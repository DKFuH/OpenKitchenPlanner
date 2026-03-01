# SPRINT_12_CODEX.md

## Umfang

Umsetzung der Preisengine fuer Sprint 12:

- TASK-12-C01 - Preisregel-Berechnungen
- TASK-12-01 - Pricing-API mit Snapshot-Zugriff

## Umgesetzte Dateien

- `planner-api/src/services/priceCalculator.ts`
- `planner-api/src/services/priceCalculator.test.ts`
- `planner-api/src/routes/pricing.ts`
- `planner-api/src/routes/pricing.test.ts`

## Ergebnis

Implementiert wurde:

- `applyDiscount(value, pct)`
- `calcLineNet(line)`
- `calculatePriceSummary(lines, settings)`
- `POST /api/v1/pricing/preview`
- `POST /api/v1/projects/:projectId/calculate-pricing`
- `GET /api/v1/projects/:projectId/price-summary`
- 9-stufige Preislogik ohne Zwischenrundung
- Verteilung von Rabatten, Zusatzkosten und MwSt auf Projektebene
- `PriceComponent[]` fuer die einzelnen Rechenschritte
- Berechnung von Deckungsbeitrag und Aufschlag

Snapshot-Verhalten:

- `GET /api/v1/projects/:projectId/price-summary`
  - liefert einen gespeicherten Preis-Snapshot zurueck
  - liest bevorzugt den neuesten `quote.price_snapshot`
  - nutzt als Fallback einen gespeicherten Snapshot aus `project_versions`, falls vorhanden
  - recalculiert nicht live

## Testabdeckung

- kein Rabatt -> Brutto = Netto x 1.19
- 100-%-Globalrabatt bei verbleibender Fracht und MwSt
- mehrere Steuergruppen
- Endrundung auf 2 Nachkommastellen
- Pricing-Preview-Route mit gueltigen BOM-Daten
- Pricing-Preview-Route validiert fehlerhafte Payloads
- Snapshot-Route fuer gespeicherten Projektstand

## DoD-Status Sprint 12

- Preisengine ist als pure Funktionslogik vorhanden
- kaufmaennische Summenberechnung ist deterministisch
- Grenzfaelle fuer Rabatte und Rundung sind per Unit-Test abgesichert
- Pricing ist ueber Preview und Snapshot-API konsumierbar

## Naechster Sprint

Sprint 17:

- projektgebundene Blockbewertung
- API-Rahmen fuer Block-Evaluation
- spaeterer Ausbau fuer verwaltete Blockprogramme

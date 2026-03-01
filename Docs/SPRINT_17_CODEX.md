# SPRINT_17_CODEX.md

## Umfang

Umsetzung der Blockbewertung fuer Sprint 17:

- TASK-17-C01 - Block-Bewertungsalgorithmus
- TASK-17-01 - projektgebundener Bewertungsendpunkt

## Umgesetzte Dateien

- `planner-api/src/services/blockEvaluator.ts`
- `planner-api/src/services/blockEvaluator.test.ts`
- `planner-api/src/routes/pricing.ts`
- `planner-api/src/routes/pricing.test.ts`

## Ergebnis

Implementiert wurde:

- `evaluateBlock(priceSummary, block)`
- `findBestBlock(priceSummary, blocks)`
- Tier-Auswahl ueber den hoechsten passenden `min_value`
- Basiswert-Berechnung fuer EK-, VK- und Punktebasis
- Preisvorteil als Netto-Vorteil gegenueber der Standardkalkulation
- Kennzeichnung des besten Blocks ueber `recommended: true`

API-Integration:

- `/api/v1/pricing/block-preview`
  - nimmt Preiszusammenfassung plus Blockdefinitionen entgegen
  - liefert Einzelbewertungen und den empfohlenen Block

- `/api/v1/projects/:projectId/evaluate-blocks`
  - wertet Blockdefinitionen im Projektkontext aus
  - akzeptiert optional eine direkte `price_summary`
  - faellt andernfalls auf einen gespeicherten Preis-Snapshot des Projekts zurueck

## Testabdeckung

- mehrere Blockprogramme mit unterschiedlichen Tiers
- kein passender Tier fuehrt zu 0 Prozent Rabatt
- bester Block wird korrekt identifiziert
- API-Test fuer Block-Preview
- API-Test fuer projektgebundene Block-Evaluation ueber gespeicherten Snapshot

## DoD-Status Sprint 17

- Blockbewertung ist als Service und als API nutzbar
- projektgebundene Evaluation funktioniert ohne erneute Preisberechnung
- Kernfaelle sind mit Unit- und Route-Tests abgesichert

## Naechster Sprint

Offene Claude-Luecken danach:

- Import-Job-System fuer Sprint 18
- Ausbau des Blockprogramm-Rahmens ueber reine Evaluation hinaus

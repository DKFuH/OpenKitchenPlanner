# SPRINT_17_CODEX.md

## Umfang

Umsetzung Sprint 17 (Blockverrechnung / Auto-Blockverrechnung):

- persistente Blockprogramm-Datenstruktur
- Verwaltungs-API fuer Blockprogramme
- projektgebundene Blockbewertung ueber gespeicherte Programme
- Speicherung der Projektauswertungen

## Umgesetzte Dateien

- `planner-api/prisma/schema.prisma`
- `planner-api/src/routes/blocks.ts`
- `planner-api/src/routes/blocks.test.ts`
- `planner-api/src/routes/pricing.ts`
- `planner-api/src/routes/pricing.test.ts`
- `planner-api/src/services/blockEvaluator.ts`
- `planner-api/src/services/blockProgramService.ts`
- `planner-api/src/index.ts`

## Ergebnis

Implementiert wurde:

- Neue Persistenz im Prisma-Schema:
  - `block_programs`
  - `block_definitions`
  - `block_groups`
  - `block_conditions`
  - `project_block_evaluations`

- Neue Verwaltungsrouten:
  - `GET /api/v1/block-programs`
  - `POST /api/v1/block-programs`
  - `GET /api/v1/block-programs/:id`
  - `PUT /api/v1/block-programs/:id`
  - `GET /api/v1/projects/:projectId/block-evaluations`

- Bewertungsintegration:
  - `POST /api/v1/projects/:projectId/evaluate-blocks`
    - akzeptiert jetzt entweder Inline-`blocks` oder `program_id`
    - filtert Blockdefinitionen aus gespeicherten Programmen ueber `block_conditions`
    - unterstuetzt Bedingungsfelder wie `subtotal_net`, `total_purchase_price_net`, `total_sell_price_net`, `total_points`, `dealer_price_net` und `lead_status`
    - speichert das Ergebnis in `project_block_evaluations`

- Preview-Pfad bleibt erhalten:
  - `POST /api/v1/pricing/block-preview`

## Verhalten

- Blockprogramme werden als Full Snapshot verwaltet: Gruppen, Definitionen und Conditions werden beim Update vollstaendig ersetzt.
- Definitionen koennen einer Blockgruppe zugeordnet werden.
- Conditions koennen programmweit oder definitionsspezifisch gepflegt werden.
- Projektbewertungen speichern:
  - verwendetes Programm
  - zugrunde liegende Preiszusammenfassung
  - alle Bewertungen
  - empfohlenen Block

## DoD-Status Sprint 17

- `block_programs`: **erfuellt**
- `block_definitions`: **erfuellt**
- `block_groups`: **erfuellt**
- `block_conditions`: **erfuellt**
- `project_block_evaluations`: **erfuellt**
- Block-Programme verwalten: **erfuellt**
- projektgebundene Blockbewertung: **erfuellt**

## Verifikation

- `npm run db:generate` in `planner-api`
- `npm run build` in `planner-api`
- `npm test -- --run src/routes/blocks.test.ts src/routes/pricing.test.ts` in `planner-api`
- `npm test` in `planner-api`

## Hinweise

- Die aktuelle Bedingungslogik ist bewusst schlank und arbeitet auf Preiszusammenfassung plus `lead_status`. Artikelgenaue Gruppenzuordnung ist als persistenter Rahmen vorhanden, aber noch nicht in die BOM-basierte Bewertung hineingezogen.
- Updates an Blockprogrammen sind Snapshot-basiert. Teilupdates einzelner Definitionen oder Conditions gibt es noch nicht.

## Naechster Sprint

Sprint 18:

- asynchrone Importjobs weiter haerten
- Layer-/Komponenten-Mapping speicherbar machen

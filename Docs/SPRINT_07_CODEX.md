# SPRINT_07_CODEX.md

## Umfang

Umsetzung Sprint 7 fuer den Katalog-MVP mit kaufmaennischen Stammdaten:

- Katalog-API fuer auswaehlbare Objekte
- Preisbasisfelder aus dem Datenmodell nutzbar machen
- SKP-Mapping-Endpunkt fuer Sprint 7.5 vorbereiten

## Umgesetzte Dateien

- `planner-api/src/routes/catalog.ts`
- `planner-api/src/routes/catalog.test.ts`
- `planner-api/src/index.ts`

## Ergebnis Sprint 7

Implementiert wurde:

- `GET /api/v1/catalog/items`
  - optionale Filter: `type`, `q`, `limit`, `offset`
  - liefert die Sprint-7-relevanten Preis- und Stammdatenfelder
- `GET /api/v1/catalog/items/:id`
  - Einzelobjekt inklusive Zeitstempel
- `POST /api/v1/catalog/skp-mapping`
  - bewusst als vorbereiteter Stub (`501`) fuer Sprint 7.5

Bereitgestellte kaufmaennische Kernfelder pro Katalogobjekt:

- `list_price_net`
- `dealer_price_net`
- `default_markup_pct`
- `tax_group_id`
- `pricing_group_id`

## DoD-Status Sprint 7

- Katalogobjekte sind per API auswaehlbar: erfuellt
- Objekte tragen Preisbasis: erfuellt
- SKP-Mapping-Endpunkt vorbereitet: erfuellt als Stub fuer 7.5

## Verifikation

- Route-Tests fuer Listen-, Detail- und Stub-Verhalten vorhanden
- `planner-api/src/routes/catalog.test.ts` gruen
- preisnahe Regression bleibt gruen:
  - `planner-api/src/services/priceCalculator.test.ts`
  - `planner-api/src/services/bomCalculator.test.ts`

## Naechster Sprint

Sprint 7.5:

- SKP-Mapping-Endpunkt konkretisieren
- Import- und Mapping-Flow zwischen Katalog und SKP-Referenzmodell verdrahten

# SPRINT_07_5_CODEX.md

## Umfang

Umsetzung des Sprint-7.5-Anschlusses fuer SKP-Mapping:

- TASK-7-C01 - SKP-Import-Parser
- stateless Katalog-Mapping fuer SKP-Komponenten

## Umgesetzte Dateien

- `interop-sketchup/skp-import/src/skpParser.ts`
- `interop-sketchup/skp-import/src/skpParser.test.ts`
- `interop-sketchup/skp-import/src/index.ts`
- `interop-sketchup/skp-import/package.json`
- `interop-sketchup/skp-import/tsconfig.json`
- `planner-api/src/routes/imports.ts`
- `planner-api/src/routes/imports.test.ts`
- `planner-api/src/routes/catalog.ts`
- `planner-api/src/routes/catalog.test.ts`

## Ergebnis

Implementiert wurde:

- `parseSkp(fileBuffer, sourceFilename)`
- `autoMapComponent(component)`
- Extraktion von Komponenten, Position, Rotation, Metadaten und Dimensionsschaetzung
- Bounding-Box-Berechnung fuer das Referenzmodell
- Heuristik-Mapping auf `cabinet`, `appliance`, `reference_object`
- Fallback auf mock- und JSON-basierte Testdaten statt echter binaerer SKP-Dateien

API-Integration:

- `/api/v1/imports/preview/skp`
  - nimmt Base64-kodierte SKP-Payloads plus Dateiname entgegen
  - liefert direkt das `SkpReferenceModel` fuer Preview- und Mapping-Flows zurueck

- `/api/v1/catalog/skp-mapping`
  - nimmt `SkpReferenceModel.components`-aehnliche Komponenten entgegen
  - bewertet Typ und Dimensionsnaehe gegen den Katalog
  - liefert Mapping-Vorschlaege inklusive Kandidatenliste und `needs_review`
  - bleibt bewusst zustandslos; Persistenz kann spaeter ueber eigene `skp-models`-Endpunkte folgen

Hinweis zur MVP-Umsetzung:

- Fuer den Sprint ist kein echtes binaeres SKP-Testfile notwendig
- Die Implementierung ist deshalb testbar auf Mock-Payloads ausgelegt
- Ein spaeterer Adapter auf einen echten Binary-Reader kann ohne API-Bruch ergaenzt werden

## Testabdeckung

- Referenzmodell aus Mock-Payload
- Appliance-Heuristik ueber Komponentenname
- Fallback fuer unbekannte Komponenten auf `reference_object`
- API-Test fuer SKP-Preview-Import
- API-Test fuer Katalog-Mapping von Cabinet- und Appliance-Komponenten
- API-Test fuer `reference_object` und explizit ignorierte Komponenten
- API-Test fuer ungueltige Mapping-Payloads

## DoD-Status Sprint 7.5

- SKP-Referenzmodell-Pfad ist fachlich vorbereitet und als API-Preview nutzbar
- Komponenten-Mapping ist als Heuristik und als Katalog-Suggestor nutzbar
- Parser- und Mapping-Verhalten sind mit Route- und Unit-Tests abgesichert

## Naechster Sprint

Sprint 8:

- wandbasierte Platzierungslogik
- Offset-Projektion auf Waende
- Platzierungsvalidierung entlang gerader und schraeger Waende

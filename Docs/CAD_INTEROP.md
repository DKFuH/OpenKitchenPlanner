# CAD_INTEROP.md

## CAD-Interoperabilitaet

Stand: 2026-03-01

## Scope

| Format | Import | Export | Status |
|---|---|---|---|
| DXF 2D | ja | ja | produktiver MVP-Pfad |
| DWG 2D | staging/review | nein | Binary-Adapter noch offen |
| SKP | ja | nein | Referenzmodell-/Komponentenpfad |

## Interne Formate

Zentral ist `ImportAsset` aus `shared-schemas`.

Enthaelt:

- `layers`
- `entities`
- `bounding_box`
- `units`
- `protocol`

Alle Geometriedaten werden intern in Millimetern gefuehrt.

## API-Stand

Import:

- `POST /api/v1/imports/preview/dxf`
- `POST /api/v1/imports/preview/skp`
- `POST /api/v1/imports/cad`
- `POST /api/v1/imports/skp`
- `GET /api/v1/imports/:id`

Export:

- `POST /api/v1/exports/dxf`
- `POST /api/v1/projects/:projectId/export-dxf`

## DXF-Import

Der DXF-Parser:

- liest `LINE`, `LWPOLYLINE`, `POLYLINE`, `ARC`, `CIRCLE`, `TEXT`, `MTEXT`, `INSERT`
- ignoriert unbekannte Entitaeten mit Protokolleintrag
- ignoriert Geometrie mit positivem `z`
- normalisiert bekannte `INSUNITS` nach Millimetern

Unit-/Skalierungspruefung:

- fehlendes `$INSUNITS` fuehrt zu `needs_review`
- unbekannter `INSUNITS`-Code fuehrt zu `needs_review`
- bekannte Nicht-mm-Einheiten werden protokolliert und nach mm normalisiert

Typische Protokollzustande:

- `imported`
- `ignored`
- `needs_review`

## DWG-Strategie

Direktes DWG-Parsing ist weiterhin nicht verdrahtet.

Aktueller MVP:

- `POST /api/v1/imports/cad` mit `source_format=dwg`
- Datei wird als Importjob gespeichert
- Job endet mit `done`, aber mit `needs_review`-Protokoll
- Rohpayload bleibt im gespeicherten `import_asset`

Damit ist DWG aktuell ein kontrollierter Staging-/Review-Pfad, kein echter Geometrieparser.

## SKP-Import

Der SKP-Pfad erzeugt ein Referenzmodell mit Komponentenliste.

Unterstuetzt:

- Komponenten-Mapping auf `cabinet`, `appliance`, `reference_object`, `ignored`
- Protokolleintraege je Komponente
- Persistenz des Mapping-Zustands im Job

## Export-Layer-Konventionen

Die DXF-Exporter-Layer sind im Code zentralisiert:

- `YAKDS_ROOM`
- `YAKDS_WALLS`
- `YAKDS_OPENINGS`
- `YAKDS_FURNITURE`

Bedeutung:

- `YAKDS_ROOM`: geschlossene Raumkontur
- `YAKDS_WALLS`: Wandsegmente
- `YAKDS_OPENINGS`: Oeffnungen an Waenden
- `YAKDS_FURNITURE`: Moebelkonturen in Draufsicht

## Einheiten

- intern: immer mm
- DXF-Export: `$INSUNITS = 4`
- DXF-Import: bekannte DXF-Einheiten werden nach mm umgerechnet

Bekannte Zuordnungen:

- `1` -> `inch`
- `2` -> `feet`
- `4` -> `mm`
- `5` -> `cm`
- `6` -> `m`

## Roundtrip-Stand

Abgesichert ist aktuell:

- DXF Export -> DXF Import fuer Raumkontur
- Layer-Konventionen im Export
- Einheitenkonvertierung fuer Inch-DXF
- Review-Faelle bei fehlenden Units
- Robustheit bei leeren oder gemischten DXF-Dateien

Nicht abgedeckt als echter Produktionspfad:

- nativer DWG Roundtrip
- verlustfreier Roundtrip beliebiger Fremd-DXF-Dateien
- 3D-CAD-Geometrie

## Offene Ausbaustufen

- echter DWG-Binary-Adapter
- Mapping-Review-UI fuer Layer und SKP-Komponenten
- staerkere semantische Extraktion fuer Raumkonturen, Oeffnungen und Referenzobjekte

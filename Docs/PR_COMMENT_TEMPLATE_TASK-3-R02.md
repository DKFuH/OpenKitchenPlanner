# PR_COMMENT_TEMPLATE_TASK-3-R02.md

## A) Raptor – Security

```text
TASK-3-R02 Security Review – CAD/DXF Import

Dateien:
- interop-cad/dxf-import/src/dxfParser.ts

Hinweis: planner-api/src/routes/imports.ts aktuell nicht vorhanden.

Prüfpunkte:
1) Parser-DoS-Risiko (große/fehlerhafte DXF, Endlosschleifen)
2) Input-Härtung bei unbekannten/inkonsistenten Entities
3) Potentielle Metadaten-/Info-Leaks im ImportAsset
4) Wenn Route folgt: Größenlimit, MIME+Magic-Bytes, Pfadtraversierung

Antwortformat:
- Schweregrad
- Befund (Datei + Zeile)
- Missbrauchsszenario
- Gegenmaßnahme
```

## B) Claude – Spec-Konformität

```text
TASK-3-R02 Review – Import-Spec Konformität

Dateien:
- interop-cad/dxf-import/src/dxfParser.ts
- interop-cad/dxf-import/src/dxfParser.test.ts
- Docs/CAD_INTEROP.md

Prüfpunkte:
1) Entspricht ImportAsset der Spezifikation?
2) INSUNITS -> mm korrekt und vollständig abgedeckt?
3) Protokollierung imported/ignored/needs_review nachvollziehbar?
4) Fehlen laut Spec relevante Felder oder Statusübergänge?

Antwortformat:
- Befund (Datei + Zeile)
- Abweichung zur Spec
- Konkreter Fix
```

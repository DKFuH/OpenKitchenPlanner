# REVIEW_TEMPLATES.md

Archivierte PR-Kommentar-Templates für Code-Reviews (MVP Sprints 3–11).

---

# PR_COMMENT_TEMPLATES_INDEX.md

## Verfügbare Vorlagen

- `Docs/PR_COMMENT_TEMPLATE_TASK-3-R01.md`
- `Docs/PR_COMMENT_TEMPLATE_TASK-3-R02.md`
- `Docs/PR_COMMENT_TEMPLATE_TASK-5-R01.md`
- `Docs/PR_COMMENT_TEMPLATE_TASK-8-R01.md`
- `Docs/PR_COMMENT_TEMPLATE_TASK-9-R01.md`
- `Docs/PR_COMMENT_TEMPLATE_TASK-10-R01.md`
- `Docs/PR_COMMENT_TEMPLATE_TASK-11-R01.md`

## Handoff / Kontext

- `Docs/REVIEW_HANDOFF_GITHUB_COMPANION_2026-03-01.md`


---

## PR_COMMENT_TEMPLATE_TASK-10-R01

# PR_COMMENT_TEMPLATE_TASK-10-R01.md

## A) Claude – Modell/Regelkonformität

```text
TASK-10-R01 Review – Height Constraints

Dateien:
- shared-schemas/src/geometry/ceilingHeight.ts
- shared-schemas/src/validation/heightChecker.ts
- Docs/ROOM_MODEL.md

Prüfpunkte:
1) Formel und Distanzdefinition konsistent zu ROOM_MODEL?
2) Codes HEIGHT_EXCEEDED / HANGING_CABINET_SLOPE_COLLISION fachlich korrekt?
3) Flag-Logik (requires_customization, height_variant, labor_surcharge) konsistent?
4) Verhalten bei mehreren Constraints und Randfällen nachvollziehbar?

Antwortformat:
- Befund (Datei + Zeile)
- Abweichung
- Fix
```

## B) GROK – Numerik/Edge Cases

```text
TASK-10-R01 Technical Review – Height Checker

Dateien:
- shared-schemas/src/geometry/ceilingHeight.test.ts
- shared-schemas/src/validation/heightChecker.test.ts

Prüfpunkte:
1) Testen wir Grenzfälle ausreichend (nahe Wand, Tiefe-Grenze, multiple Constraints)?
2) Schwellenwerte >50 und <200 korrekt und robust?
3) Gibt es potenzielle false positives durch Floating-Point?

Antwortformat:
- Befund
- Risiko
- Test-/Code-Fix
```


---

## PR_COMMENT_TEMPLATE_TASK-11-R01

# PR_COMMENT_TEMPLATE_TASK-11-R01.md

## Verwendung

Diese Vorlage ist für Github Companion (Sprint 11 / TASK-11-R01).
Sie enthält:

- einen direkt nutzbaren PR-Kommentar für **Claude** (Spec-Konformität)
- einen direkt nutzbaren PR-Kommentar für **GROK** (Numerik + Edge Cases)
- einen kurzen Statuskommentar für den PR-Thread

Hinweis: `planner-api/src/routes/bom.ts` ist aktuell nicht vorhanden; Review fokussiert daher auf das Service-Modul.

---

## A) PR-Kommentar für Claude (Spec-Konformität)

```text
TASK-11-R01 Review – BOM-Engine (Sprint 11)

Bitte reviewe die BOM-Implementierung auf Vollständigkeit und Spec-Konformität.

Betroffene Dateien:
- planner-api/src/services/bomCalculator.ts
- planner-api/src/services/bomCalculator.test.ts
- Docs/PRICING_MODEL.md

Prüfpunkte:
1) Werden BOMLineTypes gemäß Spec korrekt erzeugt?
   - cabinet, appliance, accessory, surcharge, assembly, freight, extra
2) Sind Pflichtfelder je BOMLine sinnvoll und vollständig befüllt?
   - list_price_net, variant_surcharge, object_surcharges,
     position_discount_pct, pricing_group_discount_pct,
     line_net_after_discounts, tax_group_id, tax_rate
3) Ist die Ableitung aus Flags konsistent?
   - special_trim_needed -> surcharge
   - labor_surcharge -> assembly
4) Gibt es Abweichungen zur Dokumentation in Docs/PRICING_MODEL.md?

Antwortformat:
- Befund (Datei + Zeile)
- Abweichung zur Spec
- Risiko (hoch/mittel/niedrig)
- Konkreter Änderungsvorschlag
```

---

## B) PR-Kommentar für GROK (Numerik + Edge Cases)

```text
TASK-11-R01 Technical Review – BOM-Berechnung

Bitte prüfe die BOM-Berechnung auf numerische Korrektheit, Robustheit und Grenzfälle.

Betroffene Dateien:
- planner-api/src/services/bomCalculator.ts
- planner-api/src/services/bomCalculator.test.ts

Prüfpunkte:
1) Werden Summen korrekt berechnet (List-Netto vs. Netto nach Rabatten)?
2) Gibt es Rundungs-/Präzisionsrisiken (Number/Float) in kaufmännischen Schritten?
3) Edge Cases:
   - leeres Projekt
   - fehlender PriceListItem-Eintrag
   - qty = 0 oder negative Werte
   - fehlende TaxGroup
4) Ist clampPercent ausreichend gegen ungültige Rabatte (>100 / <0)?
5) Sind Tests ausreichend, oder fehlen kritische Edge-Case-Tests?

Antwortformat:
- Befund (Datei + Zeile)
- Risiko (hoch/mittel/niedrig)
- Konkreter Fix
- Optional: zusätzlicher Testfall
```

---

## C) Kurztext für PR-Thread (Status)

```text
TASK-11-R01 ist für Review bereit (BOM-Service + Tests).
Route-Review für planner-api/src/routes/bom.ts folgt, sobald die Route implementiert ist.
```


---

## PR_COMMENT_TEMPLATE_TASK-3-R01

# PR_COMMENT_TEMPLATE_TASK-3-R01.md

## A) GROK – Algorithmik/Robustheit

```text
TASK-3-R01 Review – Polygon + Snap

Bitte prüfe die Implementierung auf Korrektheit und Edge Cases.

Dateien:
- shared-schemas/src/geometry/validatePolygon.ts
- shared-schemas/src/geometry/validatePolygon.test.ts
- planner-frontend/src/editor/snapUtils.ts
- planner-frontend/src/editor/snapUtils.test.ts

Prüfpunkte:
1) Polygon-Validierung: Selbstschnitt, kurze Kanten, Ringschluss, doppelte Punkte
2) Segment-Intersection bei collinear/adjazent stabil?
3) Snap numerisch stabil an Winkelgrenzen (45/90 etc.)?
4) Fehlende Grenzfall-Tests?

Antwortformat:
- Befund (Datei + Zeile)
- Risiko
- Konkreter Fix
```

## B) Claude – Datenfluss/API

```text
TASK-3-R01 Review – Datenfluss Room-Editor

Prüfe Konsistenz Frontend <-> API <-> Modell.

Dateien:
- planner-api/src/routes/rooms.ts
- planner-frontend/src/api/rooms.ts
- Docs/ROOM_MODEL.md

Hinweis: planner-api/src/services/roomService.ts ist aktuell nicht vorhanden.

Prüfpunkte:
1) API-Shape konsistent mit ROOM_MODEL?
2) wall_id-Stabilität beim Vertex-Move fachlich sichergestellt?
3) Fehlende API-Validierungen (z.B. max 64 Vertices)?
4) Reichen Response-Felder fürs Frontend?

Antwortformat:
- Ja/Nein je Punkt
- Befunde (Datei + Zeile)
- Fixvorschlag
```


---

## PR_COMMENT_TEMPLATE_TASK-3-R02

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


---

## PR_COMMENT_TEMPLATE_TASK-5-R01

# PR_COMMENT_TEMPLATE_TASK-5-R01.md

## GROK – Öffnungen

```text
TASK-5-R01 Review – Opening Validator

Dateien:
- shared-schemas/src/geometry/openingValidator.ts
- shared-schemas/src/geometry/openingValidator.test.ts

Hinweis: planner-api/src/routes/openings.ts aktuell nicht vorhanden.

Prüfpunkte:
1) Randfälle: offset < 0, width <= 0, offset+width == wall.length, > wall.length
2) Überlappungslogik korrekt (Berührung vs. Überlappung)?
3) CAD-Gap-Erkennung robust bei unsortierten/überlappenden Segmenten?
4) Testabdeckung ausreichend für Grenzfälle?

Antwortformat:
- Befund (Datei + Zeile)
- Risiko
- Fix
```


---

## PR_COMMENT_TEMPLATE_TASK-8-R01

# PR_COMMENT_TEMPLATE_TASK-8-R01.md

## A) GROK – Mathematik/Robustheit

```text
TASK-8-R01 Review – Wall Placement Math

Dateien:
- shared-schemas/src/geometry/wallPlacement.ts
- shared-schemas/src/geometry/wallPlacement.test.ts

Prüfpunkte:
1) Innennormale für konvexe/konkave Polygone robust?
2) Verhalten bei Null-Länge-Wänden (Division by Zero)?
3) snapToWall/getPlacementWorldPos korrekt geclampt?
4) canPlaceOnWall: Randfälle bei Berührung/Überlappung?

Antwortformat:
- Befund (Datei + Zeile)
- Risiko
- Fix
```

## B) Claude – API-Vollständigkeit

```text
TASK-8-R01 Review – Placement API Vollständigkeit

Dateien:
- Docs/ROOM_MODEL.md

Hinweis: planner-api/src/routes/placements.ts und planner-frontend/src/editor/PlacementManager.tsx sind aktuell nicht vorhanden.

Bitte liefern:
1) konkrete Checkliste der benötigten Endpunkte/Validierungen laut ROOM_MODEL
2) Risiken, wenn atomare Persistenz/Server-Validierung fehlt
3) empfohlene minimale API-Contracts für nächsten Implementierungsschritt
```


---

## PR_COMMENT_TEMPLATE_TASK-9-R01

# PR_COMMENT_TEMPLATE_TASK-9-R01.md

## Verwendung

Diese Vorlage ist für Github Companion (Sprint 9 / TASK-9-R01).
Sie enthält:

- einen direkt nutzbaren PR-Kommentar für **GROK** (Code-Qualität, Edge Cases)
- einen vorbereiteten PR-Kommentar für **Raptor** (Security), sobald `planner-api/src/routes/validate.ts` existiert

---

## A) PR-Kommentar für GROK (jetzt ausführbar)

```text
TASK-9-R01 Review – Kollisionserkennung (Sprint 9)

Bitte reviewe die aktuelle Implementierung auf Vollständigkeit, Korrektheit und Grenzfälle.

Betroffene Dateien:
- shared-schemas/src/validation/collisionDetector.ts
- shared-schemas/src/validation/collisionDetector.test.ts

Prüfpunkte:
1) Werden die Kernregeln korrekt umgesetzt?
   - OBJECT_OVERLAP
   - OBJECT_OUTSIDE_ROOM
   - OBJECT_BLOCKS_OPENING
   - MIN_CLEARANCE_VIOLATED
   - Hint-Detection (SPECIAL_TRIM_NEEDED, LABOR_SURCHARGE)
2) Gibt es Grenzfälle bei Point-in-Polygon (Punkt auf Kante/Vertex)?
3) Gibt es false positives/false negatives bei Intervall-Logik (Berührung vs. Überlappung)?
4) Ist die aktuelle Testabdeckung ausreichend, oder fehlen kritische Edge-Case-Tests?
5) Performance-Einschätzung: Reicht die aktuelle Komplexität für n <= 50 Objekte?

Antwortformat:
- Befund (Datei + Zeile)
- Risiko (hoch/mittel/niedrig)
- Konkreter Verbesserungsvorschlag
- Optional: Zusätzlicher Testfall (kurz)
```

---

## B) PR-Kommentar für Raptor (vorbereitet)

**Hinweis:** Dieser Kommentar ist vorgesehen, sobald die Server-Route `planner-api/src/routes/validate.ts` vorhanden ist.

```text
TASK-9-R01 Security Review – Validierungs-Endpunkt

Bitte prüfe den Validierungs-Endpunkt auf Missbrauchs- und Sicherheitsrisiken.

Betroffene Datei:
- planner-api/src/routes/validate.ts

Prüfpunkte:
1) DoS-Risiko bei großen Payloads (z. B. 1000 Objekte)
   - Eingabegrößen-Limits
   - Komplexitätsgrenzen
   - Rate-Limiting
2) Autorisierung
   - Wird geprüft, ob der User zum Projekt gehört?
3) Input-Validierung vor Berechnung
   - malformed Polygon
   - ungültige Offsets/Dimensionen
   - fehlende Pflichtfelder

Antwortformat:
- Schweregrad (kritisch/hoch/mittel/niedrig)
- Befund (Datei + Zeile)
- Exploit-/Missbrauchsszenario (kurz)
- Konkrete Gegenmaßnahme
```

---

## C) Kurztext für PR-Thread (Status)

```text
TASK-9-R01 ist für Code-Review bereit (Collision-Engine + Tests).
Server-seitiger Security-Review für /validate wird nachgezogen, sobald planner-api/src/routes/validate.ts vorhanden ist.
```


---


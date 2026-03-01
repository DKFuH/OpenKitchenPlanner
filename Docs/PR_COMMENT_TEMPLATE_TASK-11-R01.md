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

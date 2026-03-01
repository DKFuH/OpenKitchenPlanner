# PHASE_2_DOD_AND_EXECUTION_PLAN.md

Stand: 2026-03-01

---

## 1) Executive Summary: Phase-2 Definition of Done (DoD)

- **Volle Interoperabilität:** Herstellerartikel (`CatalogArticle`) und generierte Langteile (`GeneratedItem`) sind nahtlos in BOM und Pricing (9-stufige Logik) integriert.
- **Mandantentrennung (Multi-Tenant):** Jede Anfrage ist über `tenant_id` isoliert; Cross-Tenant-Access ist technisch ausgeschlossen.
- **Automatisierung:** Arbeitsplatten und Sockel werden deterministisch berechnet und bei Planungsänderungen automatisch aktualisiert.
- **Rule Engine v2:** Mindestens 15 Regeln (Kollision, Ergonomie, Vollständigkeit) liefern Live-Feedback im Frontend.
- **Lead-to-Project Pipeline:** Endkunden-Planungen werden verlustfrei in den Profi-Editor übernommen.
- **Test-Coverage:** Neue Sprints 20-24 erreichen mindestens 80% Abdeckung durch Unit- und Integrationstests.

### Aktuelle Blocker

1. **Logic (P0):** Rule Engine ignoriert Kollisionen über Eck (Wall-ID-Fokus statt World-Position).
2. **Price (P0):** Herstellerartikel werden in der BOM mit `0,00 EUR` bewertet (Bridge Gap).
3. **Security (P1):** Export-/Import-Endpunkte sind nicht durchgängig mandantengesichert.

---

## 2) Gap Matrix: Soll vs. Ist

| Feature | Soll | Ist | Gap | Risiko |
|---|---|---|---|---|
| Catalog Bridge | BOM nutzt `CatalogArticle` + Varianten | BOM fokussiert Legacy-Pfad | Keine belastbare Preisfindung für Phase-2-Artikel | P0 |
| Security | Volle Multi-Tenant-Isolation | Middleware vorhanden, Export/Import mit Lücken | Unbefugter Zugriff auf Fremddaten | P1 |
| Check-Engine | 15+ Regeln inkl. 2D-Intersection | Basis-Engine vorhanden, Eckfall fehlerhaft | Falsch-Negative bei Kollisionsprüfung | P0 |
| Auto-Complete | Deterministischer Rebuild (Worktop/Plinth) | Backend-Ansätze vorhanden | Fehlende Kopplung an Preislogik | P1 |
| BI / Analytics | Dashboard mit KPI-Cards + Filtern | API-Aggregatoren vorhanden | Fehlende Visualisierung | P2 |
| Lead Promotion | Reibungslose Konvertierung in Profi-Projekt | API-Pfad vorhanden | UI-Handover + Validierung unvollständig | P1 |

---

## 3) Konkrete Tasks (priorisiert)

### TASK-20-C01 - Article Pricing & BOM Bridge

- **Sprint:** 20 / 21
- **Zuständig:** Claude Code, Codex
- **Abhängigkeiten:** keine
- **Priorität:** Muss
- **Status:** Offen
- **Ziel:** Herstellerartikel aus Phase 2 korrekt bepreisen.

**Akzeptanzkriterien**

- `bomCalculator.ts` löst `article_variant_id` auf.
- Preisfindung nutzt `ArticlePrice`.
- BOM-Zeilen für `CatalogArticle` enthalten korrekte MwSt-Sätze.

**How to verify**

- Unit-Test in `bomCalculator.test.ts` mit `CatalogArticle`-Placement, Erwartung: Netto-Preis > 0.

**Aufwand:** M

---

### TASK-22-L01 - Fix Rule Engine: 2D World-Collision

- **Sprint:** 22
- **Zuständig:** Codex
- **Abhängigkeiten:** TASK-20-C01
- **Priorität:** Muss (P0)
- **Status:** Offen
- **Ziel:** Kollisionsprüfung über Eck (wandübergreifend) korrigieren.

**Akzeptanzkriterien**

- Nutzung von `getWorldPolygon()` für alle Placements.
- SAT-Kollisionsprüfung (Separating Axis Theorem) implementiert.
- Warnung `COLL-001` bei Überschneidung an Wandecken.

**How to verify**

- Testszenario mit zwei Schränken an einer 90°-Ecke, die sich physisch überlappen.

**Aufwand:** M

---

### TASK-23-S01 - Security: Tenant Scoping Export/Import

- **Sprint:** 23
- **Zuständig:** Claude Code
- **Abhängigkeiten:** keine
- **Priorität:** Muss (P1)
- **Status:** Offen
- **Ziel:** Zugriffslücken bei Mandantendaten schließen.

**Akzeptanzkriterien**

- `exports.ts`: Jede Abfrage validiert `project.tenant_id`.
- `imports.ts`: ImportJobs strikt dem Request-Tenant zugeordnet.
- Tenant-Routen nur für Super-Admins oder mit klarer AuthZ.

**How to verify**

- Request mit Tenant-A-Token auf Tenant-B-Projekt wird mit 403/404 abgelehnt.

**Aufwand:** S

---

### TASK-21-A01 - Auto-Completion Determinismus

- **Sprint:** 21
- **Zuständig:** Codex
- **Abhängigkeiten:** TASK-20-C01
- **Priorität:** Soll (P1)
- **Status:** Offen
- **Ziel:** Verknüpfung von autogenerierten Langteilen mit Kalkulation stabilisieren.

**Akzeptanzkriterien**

- `GeneratedItem`-Einträge fließen in `priceCalculator.ts` ein.
- Rebuild-Logik löscht nur verwaiste generierte Items desselben Projekts.
- `is_generated` bleibt über Speicherzyklen stabil.

**How to verify**

- Schrank verschieben -> Auto-Completion triggern -> BOM ersetzt alte Segmente durch neue, bepreiste Segmente.

**Aufwand:** M

---

### TASK-20-F01 - Frontend: Varianten-Selector Pro

- **Sprint:** 20
- **Zuständig:** Claude Code
- **Abhängigkeiten:** keine
- **Priorität:** Soll (P1)
- **Status:** In Arbeit
- **Ziel:** `KonfiguratorPanel` für Fronten- und Griffauswahl vervollständigen.

**Akzeptanzkriterien**

- Dynamisches Mapping von `ArticleOption` (`enum`) auf Dropdowns.
- Update von `selectionOptions` im Editor-State bei Auswahl.
- Live-Anzeige des resultierenden Variantenpreises (Preview).

**How to verify**

- Artikel mit Option "Frontfarbe" im Konfigurator öffnen; Auswahl aktualisiert BOM-Payload.

**Aufwand:** L

---

## 4) Reihenfolgeplan (14 Tage Sprint)

### Phase A: Zero Trust & Core Logic (Tag 1-4)

- Tag 1-2: **TASK-23-S01** (Tenant Scoping)
- Tag 3-4: **TASK-22-L01** (Rule Engine Collision)

### Phase B: Functional Bridge (Tag 5-9)

- Tag 5-7: **TASK-20-C01** (BOM/Pricing Bridge)
- Tag 8-9: **TASK-21-A01** (Auto-Completion)

### Phase C: UI & User Experience (Tag 10-14)

- Tag 10-12: **TASK-20-F01** (Varianten-Selector)
- Tag 13-14: Cleanup + Integrationstests für `leads`, `bi`, `manufacturers`

---

## 5) Offene Fragen (blockierend)

1. **Hersteller-Datenquelle:** Liegt ein finales Import-Format (JSON/CSV-Schema) für den Pilot-Hersteller vor?
2. **AuthZ-Ebene:** Reicht Header-basiertes Tenant-Scoping für Phase 2, oder ist IdP-Prüfung (z. B. Auth0/Keycloak) verpflichtend?
3. **BOM-Sichtbarkeit:** Sollen `is_generated`-Items im PDF einzeln gelistet oder als Pauschale gebündelt werden?
4. **DWG-Binary:** Ist der Verzicht auf nativen DWG-Parser im MVP final bestätigt?

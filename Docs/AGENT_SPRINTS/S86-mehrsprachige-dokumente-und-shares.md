# Sprint 86 - Mehrsprachige Dokumente & Shares

**Branch:** `feature/sprint-86-multilingual-docs-shares`
**Gruppe:** B (startbar nach S84, sinnvoll nach S61 und S80)
**Status:** `planned`
**Abhaengigkeiten:** S61 (PDF/Firmenprofil), S80 (Viewer-/SVG-Exporte), S84 (i18n-Core), S85 optional

---

## Ziel

Nicht nur die UI, sondern auch Kundenartefakte werden sprachfaehig:
Angebote, Werkstattpakete, Viewer-Shares und Praesentationsseiten sollen in
einer gewaehlten Sprache erzeugt werden koennen.

---

## 1. Datenmodell

Bestehende Dokument-/Share-Modelle um Sprachkontext erweitern:

- `locale_code`

Oder als JSON-Konfiguration in bereits vorhandenen Dokument-/Exportmodellen.

---

## 2. Backend

Neue oder angepasste Dateien:

- `planner-api/src/services/pdfGenerator.ts`
- `planner-api/src/routes/quotes.ts`
- `planner-api/src/routes/specificationPackages.ts`
- `planner-api/src/routes/viewerExports.ts`

Funktionen:

- PDF-Generator nimmt `locale_code`
- Exporte und Share-Payloads koennen sprachspezifisch erzeugt werden
- Viewer bekommt lokalisierte UI-Strings

---

## 3. Frontend

Neue oder angepasste Dateien:

- Export-Dialoge
- Share-Dialoge
- Angebots-/Dokumentenaktionen

Funktionen:

- Sprache fuer Export auswaehlen
- Default aus Tenant/User/Projekt uebernehmen
- sprachspezifische Vorschau oder Labeling

---

## 4. Deliverables

- locale-aware Dokumentgenerierung
- lokalisierte Share-/Viewer-Payloads
- Sprachwahl in Exportdialogen
- 8-12 Tests

---

## 5. DoD

- Angebot/PDF kann mindestens in `de` und `en` erzeugt werden
- Viewer-Share verwendet die gewaehlte Sprache
- Exportdialoge zeigen und speichern Sprachwahl
- Dokumenttexte sind nicht hart auf eine Sprache fixiert


# S109 Fluent 2 UI Foundation

**Bezug:** Sprint 109  
**Status:** `planned`  
**Quelle:** `https://fluent2.microsoft.design/`

## Ziel

Verbindliche UI-Basis fuer S109, damit alle Bereiche einheitlich umgesetzt werden:
- ein gemeinsames Design-System (Fluent 2)
- konsistente Komponentenwahl
- klare Token-Regeln
- vorhersehbare UX in allen Workflows

## 1. Grundregeln

1. Neue Shell-/Workflow-Komponenten nutzen `Fluent UI v9`.
2. Keine ad-hoc Styles fuer Farben/Spacing/Typografie in neuen Komponenten.
3. Alle neuen Texte laufen ueber i18n Keys.
4. CAD-/Canvas-/3D-Interaktion bleibt custom, aber visuell an Tokens gebunden.

## 2. Token-Strategie

Verbindliche Token-Gruppen:

- `color`: surface, text, border, status, accent
- `spacing`: xs/sm/md/lg/xl
- `radius`: control, panel, overlay
- `typography`: title, section, body, caption
- `elevation`: shell, panel, overlay, dialog

Regel:

- keine Hex-Werte direkt in Komponenten.
- keine festen Pixelabstaende ohne Token.

## 3. Komponenten-Mapping

Header/Navigation:

- `Toolbar`, `Button`, `Menu`, `MenuItem`, `TabList`, `Avatar`, `Badge`

Form und Einstellungen:

- `Field`, `Input`, `Dropdown`, `Combobox`, `Switch`, `Checkbox`, `Slider`

Dialoge und Feedback:

- `Dialog`, `Toast`, `MessageBar`, `ProgressBar`, `Spinner`

Struktur:

- `Card`, `Accordion`, `Divider`, `Tooltip`

## 4. UX-Standards

- Jede deaktivierte Aktion zeigt den Grund.
- Lade- und Fehlerzustaende sind pro Panel sichtbar.
- Wichtige globale Aktionen bleiben im Header erreichbar.
- Tastatursteuerung und Fokusreihenfolge sind verpflichtend.

## 5. Seitenabdeckung in S109

Pflichtseiten:

- Startseite
- Projekte
- Editor
- Praesentationsmodus
- Einstellungen

Auf jeder Seite:

- gleicher Header-Rahmen
- konsistente Menuegruppen
- konsistente Statusmeldungen

## 6. Integrationsstandards

Backend:

- jede integrierte Backend-Funktion hat:
  - Loading UI
  - Error UI
  - Empty State
  - Success Feedback

Plugin:

- Plugin-Slots nutzen Fluent-konforme Container und Actions.

MCP:

- MCP-Actions erscheinen als regulaere Fluent-Actions (kein Sonder-UI).

i18n:

- alle Labels/Meldungen im Locale-File.

## 7. Definition of Ready fuer UI-PRs

- betroffene Komponenten sind im Fluent-Mapping enthalten
- neue Strings sind i18n-faehig
- keine Hardcoded Colors/Spacing
- Disabled Reason implementiert (falls Aktion deaktivierbar)

## 8. Definition of Done fuer UI-PRs

- visuell im Fluent-2-Rahmen
- a11y smoke-check bestanden (keyboard + focus + aria labels)
- Tests fuer Action-State vorhanden
- keine regressiven Layout-Bruche in Desktop und Mobile


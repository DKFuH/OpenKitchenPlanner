# Sprint 109 - Vollstaendige UI Ueberarbeitung, Workflow, Integrationen

**Branch:** `feature/sprint-109-ui-workflow-full-overhaul`
**Gruppe:** C
**Status:** `phase_4_completed`
**Abhaengigkeiten:** S56, S84-S86, S87, S99, S100-S108

## Ziel

S109 ist ein vollstaendiger Frontend-Umbau fuer OKP:
- einheitliche UI in allen Bereichen
- sauberer End-to-End Workflow
- vollstaendige Frontend-Integration der vorhandenen Backend-Funktionen
- Beruecksichtigung von Plugin-System, MCP und i18n von Beginn an

Leitidee: ein konsistentes Produkt statt isolierter Teil-Features.

Fluent-2-Basis ist verbindlich dokumentiert in:
- `Docs/AGENT_SPRINTS/S109-fluent2-ui-foundation.md`

---

## 1. Scope

In Scope:

- komplette UI-Neustruktur fuer Start, Projekte, Editor, Praesentation, Einstellungen
- durchgehender globaler Header und konsistente Navigation
- sinnvolle Menuegruppen + CAD-Toolbox + Kontextaktionen
- zentrale Action-Matrix (visible/enabled/reason)
- Integration aller relevanten Backend-Funktionen in die UI-Flows
- Plugin-faehige UI-Erweiterungspunkte (Menue, Sidebar, Actions, Panels)
- MCP-beruecksichtigte Workflows (Assistenz-/Task-/Autofill-Einstiegspunkte)
- i18n-first Aufbau (alle neuen Strings lokalisierbar, keine Hardcodes)
- Tenant/User/Session-Fehler robust und user-verstaendlich behandeln

Nicht in Scope:

- kompletter Austausch des 3D-Runtime-Kerns
- Server-seitiges Plugin-Execution-Framework (nur UI-/Contract-Seite in S109)

---

## 2. Zielarchitektur

### 2.1 UI Foundation

- `Fluent UI v9` fuer App-Shell, Menues, Dialoge, Formulare, Panels
- custom Rendering bleibt fuer Canvas/3D/CAD-Interaktionen
- zentrale Design-Tokens (Spacing, Typography, Colors, Density)
- verbindliche Token-/Komponentenregeln gemaess `S109-fluent2-ui-foundation.md`

### 2.2 Workflow Core

- `AppShell` als einheitlicher Rahmen fuer alle Seiten
- `editorModeStore` + `workflowStateStore`
- `actionStateResolver` als Single Source fuer Buttons/Menues/Shortcuts

### 2.3 Integrationsschicht

- `featureRegistry` mappt Backend-Capabilities auf UI-Features
- `pluginExtensionPoints` fuer spaetere Erweiterungen
- `mcpAdapter` fuer MCP-Actions im UI-Kontext
- `i18nService` fuer Runtime-Locale und Namespaces

---

## 3. Menues und CAD Toolbox

Menuegruppen:

- `Datei`: Neu, Oeffnen, Speichern, Duplizieren, Export
- `Bearbeiten`: Undo/Redo, Cut/Copy/Paste, Delete
- `Ansicht`: 2D/3D/Split, Grid, Panels, Kamera, Visibility
- `Einfuegen`: Fenster, Tueren, Moebel, Labels, Assets
- `CAD`: Wand, Raum, Polyline, Bemassung, Split, Join, Reverse
- `Daten`: Interop, ERP, Reporting, Workflows
- `Render/Output`: Screenshot, 360, Renderjobs, Praesentation
- `Hilfe/Assistenz`: MCP-Assistent, Doku, Debug-Infos

CAD-Toolbox Gruppen:

- `Zeichnen`: Wall, Room, Polyline, Dimension, Label
- `Bearbeiten`: Select, Move, Split, Join, Reverse
- `Snap/Ausrichtung`: Grid, Magnetismus, Winkel, Längenraster
- `Objekte`: Fenster, Tueren, Moebel, Bibliothek

---

## 4. Vollstaendige Backend-Feature-Integration (S109 Pflicht)

S109 liefert UI-Anbindung fuer bestehende Backend-Bereiche, mindestens:

- Projekte, Umgebungen, Sichtbarkeit, Auto-Dollhouse
- Kamera-Presets und FOV
- Render-Umgebungen und Render-Jobs
- Screenshot- und 360-Capture
- Workflows (S99) inkl. Status/Transitions
- Interop-Endpunkte aus PR30/PR31-Kontext (Parser-/Exchange-Flows)
- Fehlerbilder fuer Tenant/User/Autorisierung mit klaren Recovery-Aktionen

Regel:

- Kein Backend-Feature gilt als "fertig", solange es nicht als bedienbarer Frontend-Flow existiert.

---

## 5. Plugin-System Beruecksichtigung

S109 schafft plugin-faehige UI-Contracts:

- registrierbare Menueeintraege
- registrierbare Sidebar-Panels
- registrierbare Toolbar-Actions
- capability-basierte Sichtbarkeit (pro Tenant/Rolle)

Lieferobjekte:

- `pluginUiContract.ts`
- `pluginSlotRegistry.ts`
- `PluginSlot` Komponenten in Header/Sidebar

---

## 6. MCP Beruecksichtigung

S109 integriert MCP sichtbar in den Workflow:

- MCP-Einstiegspunkt im Header und Kontextmenues
- MCP-Actions fuer wiederkehrende Aufgaben (z. B. Objektvorschlaege, Datenuebernahme, Validierung)
- sichere Laufzeitkontexte (Projekt, Tenant, Sprache, Auswahl)

Lieferobjekte:

- `mcpActionBridge.ts`
- `McpQuickActions` UI-Komponente
- klare Fallback-UX bei nicht verfuegbarem MCP

---

## 7. i18n Beruecksichtigung

S109 setzt i18n konsequent durch:

- alle neuen UI-Texte via i18n-Keys
- Namespace-Struktur fuer Shell, Editor, Menues, Fehler, MCP
- Locale-Switch ohne Seitenbruch, inkl. Persistenz
- no-hardcoded-strings-Regel in geaenderten Bereichen

Lieferobjekte:

- `locales/de/*.json`, `locales/en/*.json` Erweiterungen
- `useI18nLabel` / `t()` Nutzung in allen neuen Komponenten

---

## 8. Umsetzungsplan (Dateiebene)

Core:

- `planner-frontend/src/main.tsx`
- `planner-frontend/src/layout/AppShell.tsx` (neu)
- `planner-frontend/src/layout/AppHeader.tsx` (neu)
- `planner-frontend/src/layout/AppNavigation.tsx` (neu)
- `planner-frontend/src/layout/CommandBar.tsx` (neu)
- `planner-frontend/src/theme/fluentTheme.ts` (neu)
- `planner-frontend/src/theme/fluentTokens.ts` (neu)

Workflow/State:

- `planner-frontend/src/editor/editorModeStore.ts` (neu)
- `planner-frontend/src/editor/workflowStateStore.ts` (neu)
- `planner-frontend/src/editor/actionStateResolver.ts` (neu)
- `planner-frontend/src/editor/CadToolbox.tsx` (neu)

Integration:

- `planner-frontend/src/integration/featureRegistry.ts` (neu)
- `planner-frontend/src/integration/backendCapabilityMap.ts` (neu)
- `planner-frontend/src/integration/runtimeErrorNormalizer.ts` (neu)

Plugin/MCP:

- `planner-frontend/src/plugins/pluginUiContract.ts` (neu)
- `planner-frontend/src/plugins/pluginSlotRegistry.ts` (neu)
- `planner-frontend/src/mcp/mcpActionBridge.ts` (neu)
- `planner-frontend/src/components/mcp/McpQuickActions.tsx` (neu)

Seitenintegration:

- `planner-frontend/src/pages/Editor.tsx`
- `planner-frontend/src/pages/PresentationModePage.tsx`
- `planner-frontend/src/pages/ProjectsPage.tsx`
- `planner-frontend/src/pages/HomePage.tsx` (oder entsprechende Startseite)

---

## 9. Tests

Mindestens:

- 20+ Unit-Tests fuer Action-Resolver, Registry, Error-Normalizer
- 12+ Component-Tests fuer Header, Menues, CAD-Toolbox, Plugin-Slots, MCP-QuickActions
- 8+ E2E-Flows:
  - Start -> Projekte -> Editor (durchgehender Header)
  - Toolwechsel und Moduswechsel
  - Backend-Feature-Flows (Visibility, Camera Presets, Render, Capture)
  - Tenant/User-Fehlerbehandlung
  - Plugin-Slot Rendering
  - MCP-Action Trigger/Fallback
  - i18n DE/EN Umschaltung

Regression:

- vorhandene Frontend-Tests bleiben gruen
- Build bleibt gruen (bekannte Chunk-Warnung toleriert)

---

## 10. DoD

- UI ist in allen Hauptbereichen konsistent ueberarbeitet.
- Menues und CAD-Toolbox sind logisch gruppiert und funktionsfaehig.
- Fluent-2 Foundation ist umgesetzt (Tokens, Komponenten, Action-Verhalten).
- Relevante Backend-Funktionen sind frontendseitig sauber integriert.
- Plugin-UI-Contracts sind implementiert und nutzbar.
- MCP ist sichtbar integriert und robust bei Ausfall.
- i18n fuer alle neuen/angepassten UI-Texte umgesetzt.
- Keine blockierenden Tenant/User-Fehlfluesse ohne klare Handlungsoption.
- Test- und Build-Pipeline gruen.

---

## 11. Risiken / Notes

- Hohe Eingriffstiefe mit Konfliktrisiko in `Editor.tsx` und Layout-Routen.
- Gegenmassnahme: Umsetzung in klaren Phasen mit Integrations-Gates.

Phasenempfehlung:

1. Foundation (Fluent-2 Tokens + AppShell + Action-Matrix + i18n-Basis)
2. Editor/CAD Toolbox Migration
3. Backend-Feature-Coverage
4. Plugin/MCP Integration
5. Hardening + E2E

---

## 12. Fortschritt (Phase 1)

Erledigt:

- Fluent-Theme-Basis eingefuehrt (`fluentTokens.ts`, `fluentTheme.ts`)
- `main.tsx` mit globalem `FluentProvider` verdrahtet
- Globalen `AppShell` und `AppHeader` auf Fluent-2-Komponenten migriert
- Zentrale Basis fuer Workflow/Mode/Action-Matrix gebuendelt in:
  - `planner-frontend/src/editor/appShellState.ts`
- Unit-Tests fuer die neue zentrale Basis ergaenzt:
  - `planner-frontend/src/editor/appShellState.test.ts`

Mitvalidiert:

- `npm run --workspace planner-frontend build` erfolgreich
- Vitest-Suites gruen:
  - `src/editor/appShellState.test.ts`
  - `src/editor/actionStateResolver.test.ts`
  - `src/editor/workflowStateStore.test.ts`
  - `src/editor/editorModeStore.test.ts`

Offen (naechste Phase):

- Editor/CAD-Toolbox Migration auf die neue Header-/Workflow-Architektur
- Integrationsschicht (`featureRegistry`, Backend-Capability-Mapping, Error-Normalizer)
- Plugin-/MCP-Slots in Header/Sidebar

## 13. Fortschritt (Phase 2-4)

Erledigt:

- Editor mit `AppShell`/`AppHeader` live verdrahtet (Bridge-State fuer Workflow, Mode, Action-Matrix)
- CAD-Toolbox als Fluent-basierte Gruppenstruktur aktiv integriert
- Action-Matrix live in Menues, Tabs und Shortcut-Feedback mit Disabled-Reasons
- Backend-Feature-Coverage als Header-Menue verdrahtet:
  - `planner-frontend/src/integration/backendCapabilityMap.ts`
  - `planner-frontend/src/components/layout/AppHeader.tsx`
- Plugin-/MCP-Slots in Header und Sidebar integriert:
  - `planner-frontend/src/plugins/pluginUiContract.ts`
  - `planner-frontend/src/plugins/pluginSlotRegistry.ts`
  - `planner-frontend/src/mcp/mcpActionBridge.ts`
  - `planner-frontend/src/components/mcp/McpQuickActions.tsx`
  - `planner-frontend/src/components/editor/LeftSidebar.tsx`

Zusatztests (neu):

- Unit:
  - `planner-frontend/src/integration/backendCapabilityMap.test.ts`
  - `planner-frontend/src/plugins/pluginSlotRegistry.test.ts`
  - `planner-frontend/src/mcp/mcpActionBridge.test.ts`
- E2E-Smoke (Header-Menues + Sidebar-Slots in einem Flow):
  - `planner-frontend/e2e/s109-shell-smoke.spec.ts`
  - Harness-Route: `/projects/:id/__e2e/s109-shell`

Mitvalidiert:

- `npm run test -- src/integration/backendCapabilityMap.test.ts src/plugins/pluginSlotRegistry.test.ts src/mcp/mcpActionBridge.test.ts` gruen
- `npm run build` (workspace `planner-frontend`) gruen

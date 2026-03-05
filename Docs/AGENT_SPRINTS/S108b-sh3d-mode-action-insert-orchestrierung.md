# Zwischensprint S108b - SH3D Mode, Action und Insert-Orchestrierung

**Branch:** `feature/s108b-sh3d-mode-action-insert-orchestrierung`
**Gruppe:** C
**Status:** `done`
**Abhaengigkeiten:** `editorModeStore`, `workflowStateStore`, `actionStateResolver`

## Ziel

Mode-, Action- und Insert-Flows als konsistente Single-Source-Orchestrierung etablieren, analog zur SH3D-Controller-Denke.

## Scope

In Scope:
- Insert-/Drop-/Paste-Pipeline vereinheitlichen
- Harte Rueckkehrregel auf `selection` nach Insert-nahen Aktionen finalisieren
- Action-Matrix fuer Header, Menues, Toolbars und Shortcuts komplettieren
- Grundlegende Sichtbarkeitsregeln (`visible`) in den Resolver einziehen

Nicht in Scope:
- Persistenz von Nutzerpraeferenzen (S108c)
- Geometrie-Reparatur/Auto-Fix (S108e)

## Deliverables

- Erweiterter `actionStateResolver` inkl. klarer State-Typen
- Reduzierte Inline-Bedingungen in `planner-frontend/src/pages/Editor.tsx`
- Konsolidierte Shortcut-Gates fuer editorweite Tastaturaktionen

## DoD

- Keine widerspruechlichen Enable/Disable-Zustaende zwischen UI und Shortcuts
- Insert-nahe Flows enden konsistent im Selection-Modus
- Editor-Tests und Build sind gruen

## Umsetzung (2026-03-05)

- `actionStateResolver` erweitert:
	- `ResolvedActionState` unterstuetzt jetzt `visible` neben `enabled` und `reasonIfDisabled`
	- Sichtbarkeitsregeln fuer `presentation`, `daylight`, `materials` zentralisiert
- `planner-frontend/src/pages/Editor.tsx` auf resolver-gesteuerte Sichtbarkeit umgestellt:
	- Toolbox- und Mehr-Menue-Aktionen nutzen `actionStates.*.visible`
	- reduzierte verstreute Plugin-Checks in den betroffenen Menuepfaden
- Shortcut-/Action-Gates bleiben zentral in Resolver/Shortcut-State und laufen konsistent mit
- Tests erweitert in `planner-frontend/src/editor/actionStateResolver.test.ts`

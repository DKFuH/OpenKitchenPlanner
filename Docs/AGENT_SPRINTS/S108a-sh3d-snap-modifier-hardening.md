# Zwischensprint S108a - SH3D Snap und Modifier Hardening

**Branch:** `feature/s108a-sh3d-snap-modifier-hardening`
**Gruppe:** C
**Status:** `planned`
**Abhaengigkeiten:** bestehender PolygonEditor-Flow, `snapUtils`, `usePolygonEditor`

## Ziel

Die bestehende Snap- und Modifier-Logik auf SH3D-Niveau stabilisieren: deterministische Snap-Pipeline, robuste Priorisierung und konsistente Nutzerfuehrung.

## Scope

In Scope:
- Snap-Pipeline klar definieren und in fester Reihenfolge auswerten (`Grid -> Angle -> Vertex/Edge -> Length`)
- Konfliktaufloesung bei konkurrierenden Snap-Kandidaten vereinheitlichen
- Modifier-Verhalten (`Shift`, `Alt`, `Ctrl`) in allen relevanten Draw/Drag-Pfaden harmonisieren
- Visuelle Hinweise auf aktive temporaere Modi vereinheitlichen

Nicht in Scope:
- Persistente User-Preferences (S108c)
- Insert-/Drop-/Paste-Orchestrierung (S108b)

## Deliverables

- Konsolidierte Snap-Pipeline in `planner-frontend/src/editor/snapUtils.ts`
- Einheitliche Modifier-Auswertung in `planner-frontend/src/editor/PolygonEditor.tsx` und `planner-frontend/src/editor/usePolygonEditor.ts`
- Erweiterte Unit-Tests fuer Snap-Priorisierung und Modifier-Kombinationen

## DoD

- Deterministische Snap-Ergebnisse bei identischen Eingaben
- Modifier verhalten sich in Draw und Drag konsistent
- Editor-Tests und Build sind gruen

# Zwischensprint S108d - SH3D Wall-Topologie Robustheit

**Branch:** `feature/s108d-sh3d-wall-topologie-robustheit`
**Gruppe:** C
**Status:** `planned`
**Abhaengigkeiten:** S108a, S108b

## Ziel

Wandoperationen topologisch robust machen (`split`, `join`, `reverse`, `move`) inklusive konsistenter Nachbar- und Oeffnungsbeziehungen.

## Scope

In Scope:
- Split/Join-Operationen mit stabiler Geometrie und Referenzuebernahme
- Reverse/Move ohne Verlust von Beziehungen
- Oeffnungs-Rebind bei Wandumbauten

Nicht in Scope:
- Vollstaendige Arc-Wall-Einfuehrung
- IFC-spezifische Topologieabgleiche

## Deliverables

- Robuste Wand-Operationen in den relevanten Editor-/Model-Pfaden
- Rebind-Strategie fuer Oeffnungen
- Regressionstests fuer typische Umbau-Sequenzen

## DoD

- Keine inkonsistenten Nachbarverweise nach Split/Join
- Oeffnungen bleiben nach Wandoperationen valide zugeordnet
- Tests und Build sind gruen

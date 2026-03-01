# SPRINT_08_CODEX.md

## Umfang

Umsetzung der Codex-Aufgabe aus Sprint 8:

- TASK-8-C01 – Wandbasierte Platzierungsalgorithmen

## Umgesetzte Dateien

- `shared-schemas/src/geometry/wallPlacement.ts`
- `shared-schemas/src/geometry/wallPlacement.test.ts`

## Ergebnis

Implementierte Funktionen:

- `getWallDirection(wall)`
  - liefert normierten Richtungsvektor von `start` nach `end`

- `getWallInnerNormal(wall, polygon)`
  - berechnet rechte/ linke Normale
  - prüft per Point-in-Polygon, welche Normale ins Rauminnere zeigt

- `getPlacementWorldPos(wall, offsetMm)`
  - liefert Weltkoordinate auf der Wand für den gegebenen Offset

- `snapToWall(dragWorldPos, wall)`
  - projiziert beliebigen Punkt auf Wandachse
  - liefert geclampten Offset `[0, wall.length_mm]`

- `canPlaceOnWall(wall, offsetMm, widthMm, existing)`
  - prüft Wandgrenzen
  - prüft Intervall-Überlappung mit bestehenden Placements auf derselben Wand

## Testabdeckung

- normierte Wandrichtung
- Innennormale auf rechteckigem Polygon
- Weltposition aus Offset
- Projektion auf Wand
- Überlappungsprüfung bestehender Objekte

## DoD-Status Sprint 8

- Platzierung entlang beliebiger Wände mathematisch als pure Funktionen vorhanden
- Grundlage für wandbasiertes Drag/Drop und Regelprüfung geschaffen

## Nächster Sprint

Sprint 9 (TASK-9-C01):

- Objekt-Kollisionen
- Objekt-vs-Raum / Objekt-vs-Öffnung
- Mindestabstände und Cost-Hints
- Unit-Tests und Sprint-Dokumentation

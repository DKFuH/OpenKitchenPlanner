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

# PR_COMMENT_TEMPLATE_TASK-9-R01.md

## Verwendung

Diese Vorlage ist für Github Companion (Sprint 9 / TASK-9-R01).
Sie enthält:

- einen direkt nutzbaren PR-Kommentar für **GROK** (Code-Qualität, Edge Cases)
- einen vorbereiteten PR-Kommentar für **Raptor** (Security), sobald `planner-api/src/routes/validate.ts` existiert

---

## A) PR-Kommentar für GROK (jetzt ausführbar)

```text
TASK-9-R01 Review – Kollisionserkennung (Sprint 9)

Bitte reviewe die aktuelle Implementierung auf Vollständigkeit, Korrektheit und Grenzfälle.

Betroffene Dateien:
- shared-schemas/src/validation/collisionDetector.ts
- shared-schemas/src/validation/collisionDetector.test.ts

Prüfpunkte:
1) Werden die Kernregeln korrekt umgesetzt?
   - OBJECT_OVERLAP
   - OBJECT_OUTSIDE_ROOM
   - OBJECT_BLOCKS_OPENING
   - MIN_CLEARANCE_VIOLATED
   - Hint-Detection (SPECIAL_TRIM_NEEDED, LABOR_SURCHARGE)
2) Gibt es Grenzfälle bei Point-in-Polygon (Punkt auf Kante/Vertex)?
3) Gibt es false positives/false negatives bei Intervall-Logik (Berührung vs. Überlappung)?
4) Ist die aktuelle Testabdeckung ausreichend, oder fehlen kritische Edge-Case-Tests?
5) Performance-Einschätzung: Reicht die aktuelle Komplexität für n <= 50 Objekte?

Antwortformat:
- Befund (Datei + Zeile)
- Risiko (hoch/mittel/niedrig)
- Konkreter Verbesserungsvorschlag
- Optional: Zusätzlicher Testfall (kurz)
```

---

## B) PR-Kommentar für Raptor (vorbereitet)

**Hinweis:** Dieser Kommentar ist vorgesehen, sobald die Server-Route `planner-api/src/routes/validate.ts` vorhanden ist.

```text
TASK-9-R01 Security Review – Validierungs-Endpunkt

Bitte prüfe den Validierungs-Endpunkt auf Missbrauchs- und Sicherheitsrisiken.

Betroffene Datei:
- planner-api/src/routes/validate.ts

Prüfpunkte:
1) DoS-Risiko bei großen Payloads (z. B. 1000 Objekte)
   - Eingabegrößen-Limits
   - Komplexitätsgrenzen
   - Rate-Limiting
2) Autorisierung
   - Wird geprüft, ob der User zum Projekt gehört?
3) Input-Validierung vor Berechnung
   - malformed Polygon
   - ungültige Offsets/Dimensionen
   - fehlende Pflichtfelder

Antwortformat:
- Schweregrad (kritisch/hoch/mittel/niedrig)
- Befund (Datei + Zeile)
- Exploit-/Missbrauchsszenario (kurz)
- Konkrete Gegenmaßnahme
```

---

## C) Kurztext für PR-Thread (Status)

```text
TASK-9-R01 ist für Code-Review bereit (Collision-Engine + Tests).
Server-seitiger Security-Review für /validate wird nachgezogen, sobald planner-api/src/routes/validate.ts vorhanden ist.
```

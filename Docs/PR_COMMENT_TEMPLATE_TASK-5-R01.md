# PR_COMMENT_TEMPLATE_TASK-5-R01.md

## GROK – Öffnungen

```text
TASK-5-R01 Review – Opening Validator

Dateien:
- shared-schemas/src/geometry/openingValidator.ts
- shared-schemas/src/geometry/openingValidator.test.ts

Hinweis: planner-api/src/routes/openings.ts aktuell nicht vorhanden.

Prüfpunkte:
1) Randfälle: offset < 0, width <= 0, offset+width == wall.length, > wall.length
2) Überlappungslogik korrekt (Berührung vs. Überlappung)?
3) CAD-Gap-Erkennung robust bei unsortierten/überlappenden Segmenten?
4) Testabdeckung ausreichend für Grenzfälle?

Antwortformat:
- Befund (Datei + Zeile)
- Risiko
- Fix
```

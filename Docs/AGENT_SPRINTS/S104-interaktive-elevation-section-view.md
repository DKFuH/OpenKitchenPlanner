# Sprint 104 - Interaktive Elevation- und Section-View im Editor

**Branch:** `feature/sprint-104-interactive-elevation-section-view`
**Gruppe:** A
**Status:** `done`
**Abhaengigkeiten:** S64 (Layout Sheets), S59 (Bemassung Frontansicht), S102 (Process Reporting Stabilitaet)

## Ziel

Neben Grundriss und 3D soll eine echte interaktive Elevation-/Section-Arbeitsansicht im Editor verfuegbar sein, inklusive Selektion, Snapping und direkter Bemaßungs-/Objektbearbeitung.

Leitidee: view is not export, view is editing space.

---

## 1. Scope

In Scope:

- Editor-Modus fuer `elevation` und `section`
- Interaktive Objekt-/Oeffnungsselektion in der Ansichtsprojektion
- Snapping/Bemaßung in der jeweiligen Ansicht
- Persistente Ansichtskonfiguration je Projekt/Raum

Nicht in Scope:

- Vollstaendige CAD-Zeichenwerkzeuge (Hatch/Blocks/LayerManager)
- Druck-Layout-Feature-Paritaet mit Desktop-CAD

---

## 2. Architektur

Frontend:

- neuer View-Mode im Editor-State (`plan`, `elevation`, `section`)
- Projektionspipeline fuer sichtbare Kanten/Oeffnungen/Placements
- Overlay fuer Dimensionen und Interaktions-Hotspots

Backend:

- Reuse bestehender Datenmodelle (`rooms`, `openings`, `placements`, `dimensions`)
- optional dedizierter Endpoint fuer vorberechnete Elevation-Ansichtsdaten

---

## 3. API und Daten

Geplante Endpunkte (falls serverseitige Projektion noetig):

- `GET /projects/:id/elevations`
- `GET /rooms/:id/sections/:sectionId/view`
- `POST /rooms/:id/sections`
- `PATCH /rooms/:id/sections/:sectionId`

Daten:

- `section_lines` als Quelle fuer Schnitte
- zusaetzliche `view_config_json` je Ansicht (scale, offset, visibility)

---

## 4. UX-Anforderungen

- schneller View-Wechsel ohne Voll-Reload
- klare visuelle Trennung zwischen Schnittlinie und Schnittergebnis
- Selektionsfeedback fuer Waende/Oeffnungen/Objekte in Elevation
- Bemaßung in Elevation darf Plan-Bemaßung nicht korrupt ueberschreiben

---

## 5. Tests

Mindestens:

- 8+ Frontend-Tests fuer View-State, Selektion und Interaktion
- 6+ API/Service-Tests fuer Section-Daten und Projektion
- Regressionstests fuer bestehende Grundriss-/3D-Workflows

---

## 6. DoD

- Elevation/Section als editierbare Modi nutzbar
- Interaktion (select/move/measure) in beiden Modi stabil
- persistente View-Konfiguration speicher- und ladbar
- keine Regression in Layout-/Export-Pfaden

---

## 7. Nicht Teil von Sprint 104

- Layer-Authoring-System
- vollautomatische Ansichtsableitung fuer alle Wandraeume ohne Konfiguration
- BIM-konforme Annotationstiefe

---

## 8. Umsetzungsnotiz

- Backend umgesetzt: `GET /projects/:id/elevations`, `GET /rooms/:id/sections/:sectionId/view`, `POST /rooms/:id/sections`, `PATCH /rooms/:id/sections/:sectionId`.
- Frontend umgesetzt: neue Editor-Modi `elevation` und `section`, inklusive Auswahl/Interaktion fuer projizierte Oeffnungen/Placements und persistente `view_config`-Speicherung.
- Validierung: gezielte API-Tests und Frontend-View-Settings-Tests gruen, Build fuer `planner-api` und `planner-frontend` gruen.

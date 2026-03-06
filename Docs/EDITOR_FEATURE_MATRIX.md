# Editor-Funktionsmatrix (2D/3D/Rendering)

Stand: 2026-03-06

Legende:
- `vorhanden`: produktiv im Code mit UI/API-Pfad
- `teilweise`: Basis vorhanden, aber nicht vollstaendig wie in CAD-/Render-Tools
- `fehlt`: derzeit keine belastbare Umsetzung gefunden

## 1) 2D-Zeichnung

| Feature | Status | Beleg | Prioritaet |
|---|---|---|---|
| Raeume/Waende (Polygon, auch komplexe Geometrie) | vorhanden | `planner-frontend/src/editor/PolygonEditor.tsx` | - |
| Oeffnungen (Tuer/Fenster etc.) in Waenden | vorhanden | `planner-api/src/routes/openings.ts` | - |
| Hilfsgeometrie (Grid, Snapping/Pan/Zoom) | vorhanden | `planner-frontend/src/editor/PolygonEditor.tsx` | - |
| Bemassung (CRUD + Auto/Smart/Chain) | vorhanden | `planner-api/src/routes/dimensions.ts` | - |
| 2D-Symbole/Objekte (mehr als reine Geometrie) | teilweise | Platzierungen/Gruppen vorhanden, dedizierter Symbolkatalog als eigener UX-Flow noch ausbaufaehig | P2 |
| Ansichten (Grundriss/Ansicht/Schnitt) | vorhanden | S104 Elevation/Section-View + bestehende Plan-/Schnittpfade | - |

## 2) 3D-Modell & Darstellung

| Feature | Status | Beleg | Prioritaet |
|---|---|---|---|
| 3D-Vorschau/Geometrie aus 2D-Daten | vorhanden | `planner-frontend/src/components/editor/Preview3D.tsx` | - |
| 3D-Objekte (Moebel/Geraete) inkl. Materialzuweisung | vorhanden | `planner-api/src/routes/materialLibrary.ts`, `planner-frontend/src/components/editor/MaterialPanel.tsx` | - |
| Oeffnungen in 3D mit baulichen Details (Laibung/Sims/Sturz) | teilweise | Oeffnungsdarstellung vorhanden, Detailtiefe je Bauteil ausbaufaehig | P2 |
| Mehrere 3D-Ansichten (2D/3D/Split) | vorhanden | `planner-frontend/src/pages/Editor.tsx` | - |

## 3) Kamera, Sichtbarkeit, Himmel/Transparenz

| Feature | Status | Beleg | Prioritaet |
|---|---|---|---|
| View-Wechsel 2D/3D/Split | vorhanden | `planner-frontend/src/pages/Editor.tsx` | - |
| Virtueller Besucher/Kamerahoehe | vorhanden | `planner-frontend/src/pages/Editor.tsx` | - |
| Navigationsprofile (Pan/Zoom/Orbit/Touch) | vorhanden | `planner-frontend/src/components/editor/NavigationSettingsPanel.tsx` | - |
| Tageslicht/Sonne/Kompass | vorhanden | `planner-api/src/routes/projectEnvironment.ts`, `planner-frontend/src/components/editor/DaylightPanel.tsx` | - |
| Skybox/Himmel-Boden als frei konfigurierbare Renderumgebung | vorhanden | S107 (`renderEnvironments` API + Panel) | - |
| Wandtransparenz/Dollhouse (automatisches Frontwand-Ausblenden) | vorhanden | S105 (`visibility` API + Auto-Dollhouse-Logik) | - |
| Selektive Sichtbarkeit (Wand/Bemassung/Objekte) | vorhanden | `planner-frontend/src/components/editor/VisibilityPanel.tsx` | - |

## 4) Ausgabe/Rendering

| Feature | Status | Beleg | Prioritaet |
|---|---|---|---|
| HTML-Viewer + SVG-Exporte | vorhanden | `planner-api/src/routes/viewerExports.ts` | - |
| Renderjobs mit Presets (draft/balanced/best) | vorhanden | `planner-api/src/routes/renderJobs.ts` | - |
| Panorama/Sharing (Touren) | vorhanden | `planner-api/src/routes/panoramaTours.ts`, `planner-frontend/src/pages/PanoramaToursPage.tsx` | - |
| Direkter Screenshot-Button aus Editor | vorhanden | S108 (`mediaCapture` API + Editor Flow) | - |
| 360-Grad-Ausgabe als standardisierter Einzel-Export | vorhanden | S108 (`export-360` API + Editor/Presentation Flow) | - |

## 5) Empfohlene naechste Umsetzung (kurz)

1. `P1`: S110 Hardening: Shell-E2E als CI-Gate verpflichtend machen.
2. `P1`: Fehlerpfade tenant/user/project ohne Proxy-Noise weiter stabilisieren.
3. `P2`: 3-teiliges Fenster als echtes Multi-View-Objekt (Draufsicht/3D/Wandansicht).
4. `P2`: Detailtiefe bei 3D-Oeffnungen (Laibung/Sims/Sturz) vereinheitlichen.
5. `P2`: Plugin-Slots mit produktiven Extension-Flows belegen.


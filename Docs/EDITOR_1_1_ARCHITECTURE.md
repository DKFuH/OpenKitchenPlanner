# EDITOR_1_1_ARCHITECTURE.md

## Ziel

Dieses Dokument definiert den technischen Neuaufbau des Planer-Editors als `Editor 1.1`.

Der bisherige Editor ist funktional gewachsen, aber strukturell zu stark gekoppelt:

- Layout, Tool-State, View-State, API-Laden und Shell-Anbindung liegen gemischt in einer großen Seite.
- `2D`, `3D` und `Wandansicht` sind nicht als gleichwertige, synchronisierte Arbeitsfenster modelliert.
- Das bestehende Plugin-System ist derzeit Tenant-/Route-Gating, nicht ein echtes Editor-Erweiterungssystem.

`Editor 1.1` ersetzt diese Struktur durch einen modularen Editor-Kern mit klaren Viewports, zentralem Zustand und einem echten Editor-Plugin-Host.

---

## Produktziel

Der neue Editor orientiert sich fachlich an professionellen Küchen-/CAD-Workflows:

- links ein großer `2D`-Grundriss als primäre Arbeitsfläche
- rechts oben `3D`
- rechts unten `Wandansicht` der aktuell gewählten Wand
- rechts außen ein schmaler, einklappbarer Inspector
- kompakte Werkzeuge oben, nicht als flächenfressende Hauptstruktur

Wichtige Eigenschaft:

- alle Arbeitsfenster reagieren auf dieselbe Auswahl
- `Raum`, `Wand`, `Öffnung`, `Objekt` und `Maß` werden zentral geführt
- ein Wechsel der aktiven Wand aktualisiert `2D`, `3D`, `Wandansicht` und Inspector gleichzeitig

---

## Nicht-Ziele

- kein vollständiger Wechsel des 3D-Stacks auf Babylon.js in `Editor 1.1`
- kein Einsatz von OpenJSCAD als Haupt-Editor-Framework
- keine weitere Vergrößerung des bestehenden monolithischen `Editor.tsx`
- keine Plugin-Wildwest-API mit direktem Vollzugriff auf beliebige Editor-Interna

---

## Technische Leitentscheidung

### 1. 2D

`2D` bleibt ein eigener interaktiver Editor-Layer.

Bestehende 2D-Bausteine wie `PolygonEditor`, `CanvasArea` und die Geometrie-/Snap-Logik bleiben wertvoll, werden aber aus dem bisherigen Seitenmonolithen herausgelöst und neu organisiert.

### 2. 3D

`3D` bleibt in `Three.js`.

Begründung:

- `Three.js` ist bereits produktiv im Projekt verankert
- `Preview3D` und Offscreen-Worker sind vorhanden
- ein Wechsel auf `Babylon.js` würde den Rework unnötig vergrößern

### 3. OpenJSCAD

`OpenJSCAD` wird nicht als Hauptframework für den Editor eingesetzt.

Es ist optional interessant für:

- parametrische Objektgeneratoren
- generative Bauteile
- CSG-Operationen
- exportierbare Konstruktionskörper

Es ist aber nicht die richtige Grundlage für den interaktiven Haupteditor mit Multi-Viewport, Selektion, Snap, Wandlogik und UI-Arbeitsfluss.

### 4. Plugin-System

Das bestehende Tenant-/Route-Plugin-System bleibt bestehen.

Zusätzlich wird ein neues `EditorPluginHost` eingeführt, das gezielten Zugriff auf Editor-Funktionen erlaubt.

---

## Zielarchitektur

```text
AppShell / Ribbon
    |
    v
EditorPage
    |
    v
EditorShell
    |
    +-- EditorStateCore
    |     +-- selection
    |     +-- active room / wall / object
    |     +-- tool state
    |     +-- viewport sync state
    |     +-- commands / undo / redo
    |
    +-- Plan2DViewport
    +-- Preview3DViewport
    +-- WallElevationViewport
    +-- InspectorPanel
    +-- EditorPluginHost
```

---

## Kernmodule

### EditorPage

Verantwortung:

- Routing
- Projekt laden
- API-Datenzugriff orchestrieren
- EditorShell mit geladenem Projektzustand initialisieren

Nicht verantwortlich für:

- konkretes Fensterlayout
- Tool-Interaktion
- Viewport-Synchronisation

### EditorShell

Verantwortung:

- Viewport-Anordnung
- Splitter / Resize
- Vollbild / Popout
- Docking von Inspector und Hilfspanels
- responsive Regeln

Zielbild:

- linke Hauptspalte `2D`
- rechte Arbeits-Spalte `3D` + `Wandansicht`
- optionale Inspector-Spalte

### EditorStateCore

Verantwortung:

- zentrale Editor-Wahrheit
- aktive Auswahl
- aktive Werkzeuge
- aktive Wand / aktiver Raum
- Viewport-übergreifende Synchronisation
- Command-Bus
- Undo / Redo

Der State-Core ist das wichtigste neue Modul.

Er ersetzt die heutige Verteilung von Zustand über:

- Seitenkomponente
- einzelne Panels
- Viewport-Lokalzustände
- Shell-Bridge-Zustände

### Plan2DViewport

Verantwortung:

- Grundrissdarstellung
- Wände, Öffnungen, Objekte, Maße
- Selektion
- Snap
- Zeichnen / Bearbeiten
- Fokus auf produktive Arbeitsinteraktion

### Preview3DViewport

Verantwortung:

- Darstellung des aktuellen Projekt-/Raumzustands
- Kamerazustand
- Material- und Umweltvorschau
- visuelle Selektion / Hervorhebung

Nicht verantwortlich für:

- eigene fachliche Auswahlquelle

### WallElevationViewport

Verantwortung:

- feste Darstellung der aktiven Wand
- Öffnungen
- Fronten / Schranklinie
- Maße / Installationskontext
- später direkte Bearbeitung an der Wand

Dies ist kein Nebenpanel, sondern ein echter dritter Arbeitsviewport.

### InspectorPanel

Verantwortung:

- kontextbezogene Eigenschaften
- Umschalten je nach aktiver Auswahl:
  - Raum
  - Wand
  - Öffnung
  - Objekt
  - Maß

Der Inspector darf die Hauptarbeitsfläche nicht dominieren.

---

## Editor-Zustandsmodell

### Minimaler Kernzustand

```ts
type EditorSelection =
  | { kind: 'none' }
  | { kind: 'room'; roomId: string }
  | { kind: 'wall'; roomId: string; wallId: string }
  | { kind: 'opening'; roomId: string; openingId: string }
  | { kind: 'placement'; roomId: string; placementId: string }
  | { kind: 'dimension'; roomId: string; dimensionId: string }

type EditorTool =
  | 'select'
  | 'draw-wall'
  | 'draw-room'
  | 'add-opening'
  | 'place-object'
  | 'dimension'
  | 'pan'
  | 'orbit'

interface EditorStateSnapshot {
  projectId: string
  activeLevelId: string | null
  activeRoomId: string | null
  activeWallId: string | null
  selection: EditorSelection
  activeTool: EditorTool
  inspectorOpen: boolean
  viewLayout: 'triple' | 'focus-2d' | 'focus-3d' | 'focus-wall'
}
```

### Regel

`activeWallId` und `selection` dürfen nicht parallel in widersprüchlichen Teilzuständen leben.

Wenn eine Wand gewählt ist, müssen alle Viewports auf dieselbe Wand reagieren.

---

## Command-Modell

Anstelle verteilter Callback-Ketten bekommt der Editor einen Command-Bus.

Beispiele:

- `select.room`
- `select.wall`
- `tool.activate`
- `viewport.focusWall`
- `viewport.toggleInspector`
- `geometry.wall.create`
- `geometry.wall.update`
- `opening.create`
- `placement.move`

Vorteile:

- Undo/Redo wird konsistenter
- Plugins können Kommandos registrieren oder auslösen
- Viewports bleiben dünner

---

## Plugin-System: Neu

### Bestehendes System

Heute existiert bereits:

- Backend-Plugin-Registry für Routen
- Tenant-Feature-Gating
- Frontend-Slots für Navigation / Shell

Das bleibt erhalten.

### Neues Ziel

Zusätzlich wird ein editornahes Plugin-System eingeführt:

```ts
interface EditorPlugin {
  id: string
  title: string
  requires?: string[]
  register: (host: EditorPluginHost) => void | (() => void)
}
```

### EditorPluginHost

Der Host gibt nur kontrollierte Fähigkeiten frei:

```ts
interface EditorPluginHost {
  getState(): EditorStateSnapshot
  subscribe(listener: () => void): () => void
  commands: {
    dispatch(command: EditorCommand): void
    register(commandId: string, handler: EditorCommandHandler): () => void
  }
  toolbar: {
    register(slot: string, action: ToolbarAction): () => void
  }
  inspector: {
    registerSection(section: InspectorSection): () => void
  }
  overlays2d: {
    register(entry: Overlay2DProvider): () => void
  }
  overlays3d: {
    register(entry: Overlay3DProvider): () => void
  }
  wallView: {
    registerOverlay(entry: WallViewOverlayProvider): () => void
  }
}
```

### Plugin-Slots

Zulässige Slots in `Editor 1.1`:

- `toolbar`
- `context-command`
- `inspector-section`
- `overlay-2d`
- `overlay-3d`
- `overlay-wall-view`
- `selection-transformer`

### Beispiele

- Material-Plugin registriert Inspector-Section und 3D-Overlay
- Daylight-Plugin registriert 3D-Overlay und Render-Toolbar-Aktion
- Survey-Plugin registriert Import-Command und 2D-Overlay
- Tischler-Plugin registriert Wand-/Zuschnitt-Kommandos

---

## Migrationsstrategie

### Phase 1: Parallel-Gerüst

- neues `EditorShell` anlegen
- `EditorStateCore` anlegen
- bestehende Datenladepfade weiterverwenden
- noch keine komplette Funktionsparität

### Phase 2: Bestehende Viewports andocken

- `CanvasArea` in `Plan2DViewport`
- `Preview3D` in `Preview3DViewport`
- bisherige Elevation-Logik in `WallElevationViewport`

### Phase 3: Selektion zentralisieren

- Auswahlmodell aus Monolith herauslösen
- aktive Wand / aktiver Raum aus zentralem State leiten
- Inspector daran koppeln

### Phase 4: Inspector entkoppeln

- `RightSidebar` in kontextbezogene Inspector-Segmente aufteilen
- breite Seitenleiste abbauen

### Phase 5: Commands und Undo/Redo

- wiederkehrende Interaktionen auf Command-Bus umstellen
- Undo/Redo an Commands knüpfen

### Phase 6: EditorPluginHost

- neue editornahe Plugin-Schnittstelle einziehen
- bestehende Plugins schrittweise an den Host anbinden

### Phase 7: Altlasten abbauen

- großen Seitenmonolithen reduzieren
- überholte Panel-/Bridge-Verkabelung entfernen

---

## Ziel-Dateistruktur

```text
planner-frontend/src/editor11/
  EditorPage11.tsx
  shell/
    EditorShell.tsx
    EditorLayoutStore.ts
    EditorDockHost.tsx
  state/
    EditorStateCore.ts
    EditorSelection.ts
    EditorCommands.ts
    EditorHistory.ts
  viewports/
    Plan2DViewport.tsx
    Preview3DViewport.tsx
    WallElevationViewport.tsx
  inspector/
    InspectorPanel.tsx
    sections/
      RoomInspectorSection.tsx
      WallInspectorSection.tsx
      OpeningInspectorSection.tsx
      PlacementInspectorSection.tsx
  plugins/
    EditorPluginHost.ts
    EditorPluginRegistry.ts
    slots.ts
```

---

## Ableitung für bestehende Dateien

Die folgenden bestehenden Dateien sind fachlich wertvoll, aber strukturell neu einzubetten:

- `planner-frontend/src/pages/Editor.tsx`
- `planner-frontend/src/components/editor/CanvasArea.tsx`
- `planner-frontend/src/components/editor/Preview3D.tsx`
- `planner-frontend/src/components/editor/RightSidebar.tsx`
- `planner-frontend/src/components/editor/WallFeaturesPanel.tsx`
- `planner-frontend/src/components/editor/RoomFeaturesPanel.tsx`
- `planner-frontend/src/editor/PolygonEditor.tsx`
- `planner-frontend/src/editor/usePolygonEditor.ts`

Die folgenden Plugin-Dateien bleiben relevant, aber nur als äußere Plugin-/Tenant-Schicht:

- `planner-api/src/plugins/pluginRegistry.ts`
- `planner-api/src/plugins/index.ts`
- `planner-frontend/src/plugins/pluginUiContract.ts`
- `planner-frontend/src/plugins/pluginSlotRegistry.ts`

---

## Technische Entscheidungsvorlage

### Beibehalten

- `Three.js` für 3D
- bestehende Geometrie-/Polygonlogik als Ausgangsbasis
- Tenant-/Route-Plugin-System

### Neu aufbauen

- Shell
- State-Core
- Command-Modell
- Inspector
- editornahes Plugin-System

### Optional später evaluieren

- OpenJSCAD für parametrische Objektgeneratoren
- Babylon.js nur bei bewusstem 3D-Stack-Wechsel

---

## Definition of Done für Editor 1.1

`Editor 1.1` ist erreicht, wenn:

- `2D`, `3D` und `Wandansicht` gleichzeitig produktiv nutzbar sind
- alle drei Viewports auf dieselbe Auswahl reagieren
- der Inspector nicht mehr Hauptarbeitsfläche verdrängt
- neue Editor-Funktionen über Commands statt Direktverkabelung integriert werden
- mindestens ein echtes Editor-Plugin über den neuen `EditorPluginHost` eingebunden ist
- der alte Monolith sichtbar reduziert oder ersetzt ist

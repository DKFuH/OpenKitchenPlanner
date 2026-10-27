# Dateibasierte Objektvorlagen

Alle mitgelieferten Fenster, Türen und Starter-Katalogobjekte werden aus Dateien in `planner-frontend/object-library/<id>/template.json` geladen. Objektvarianten gehören in diese Dateien, nicht in TypeScript-Listen. Der Renderer enthält die allgemeinen Regeln für Bauteilfamilien.

Eine Vorlage enthält eine stabile ID, Kategorie, Millimetermaße, Parameter, benannte Materialflächen und die Dateinamen ihrer Austauschgeometrie. Katalogvorlagen enthalten zusätzlich Artikelnummern und ausdrücklich als Starterpreise zu verstehende Beispielpreise.

```json
{
  "schema_version": 1,
  "id": "window-tilt-turn-double",
  "name": "Dreh-Kipp-Fenster, 2-flügelig",
  "category": "window",
  "units": "mm",
  "dimensions": { "width_mm": 1400, "height_mm": 1200, "depth_mm": 120 },
  "parameters": { "leaf_count": 2, "sill_height_mm": 900, "variant": "Dreh-Kipp" },
  "material_slots": ["frame", "leaf", "glass", "sill"],
  "files": { "model": "model.gltf", "plan": "plan.dxf" }
}
```

`npm run library:build --workspace planner-frontend` erzeugt für jede Vorlage unter `planner-frontend/public/object-library/<id>/`:

- `template.json`: lesbare Parameterdatei für Maße und Varianten.
- `model.gltf`: glTF 2.0 mit eingebetteter Geometrie, benannten Bauteilen und Materialien; Meter als glTF-Einheit. Die Bibliothek lädt genau dieses Modell für ihre Vorschaubilder.
- `plan.dxf`: DXF in Millimetern mit getrennten Layern für Grundriss, Ansicht, Pfosten und Sprossen. Die Ansicht liegt oberhalb des Grundrisses, damit beide separat auswählbar sind.

Der Generator läuft vor Frontend-Start und Frontend-Build. Die Datenbankinitialisierung liest die Katalogdaten aus denselben Vorlagen. Türen und Fenster speichern die Vorlagen-ID (`family_id`), individuelle Maße, Varianten und Materialfarben. Starter-Katalogmöbel referenzieren ihre daraus erzeugte Artikel-ID. Importierte eigene Modelle speichern eine unabhängige `asset_id` an jeder Platzierung; die 3D-Ansicht lädt die zugehörige Originalgeometrie.

## Austauschformate und aktuelle Grenzen

DXF ist das CAD-Austauschformat für die maßhaltigen Zeichnungen. glTF ergänzt es für Browser-3D und Materialzuordnungen. DXF kennt auch 3D-Flächen; diese Ausbaustufe exportiert bewusst die beiden 2D-Ansichten. Die parametrisierbare Quelle bleibt die offen dokumentierte JSON-Datei, da glTF seine Autorenparameter nicht speichert.

Quellen: [Autodesk DXF 3DFACE](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-747865D5-51F0-45F2-BEFE-9572DBC5B151.htm), [Khronos glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).

Die mitgelieferten Vorlagen decken rechteckige Türen, Fenster und einfache Katalogmöbel ab. Bogenfenster und ein Herstellerkatalog mit parametrischer Beschlag- und Artikelkonfiguration sind noch offen.

## Eigene Dateien importieren

Im Möbelkatalog unter **Eigene Vorlagen → Importieren** lassen sich eigene Vorlagen prüfen, in 3D ansehen, speichern und an einer Wand platzieren. Unterstützt werden:

- **glTF 2.0 / GLB:** statische Geometrie mit eingebetteten Puffern und Texturen, benannten Materialien und Knotentransformationen. Externe Dateien, verpflichtende Erweiterungen, Skinning und Morph-Geometrie werden abgewiesen. glTF-Maße sind Meter; angezeigt und gespeichert werden Millimeter.
- **DXF-Grundriss:** geschlossene `LWPOLYLINE`-Konturen mit geraden Kanten und `$INSUNITS` (mm, cm, m, Zoll oder Fuß). Die Höhe wird beim Import in Millimetern angegeben; der Renderer extrudiert die Kontur. Existiert der Layer `PLAN`, werden nur dessen geschlossene Konturen verwendet. Ansichtszeichnungen beeinflussen dann die Maße nicht. Mehrere Konturen erzeugen separate Körper; Aussparungen und verschachtelte Lochkonturen werden noch nicht interpretiert. 3DFACE, Blöcke, offene Linienzüge und Bogenkonturen werden in diesem Vorlagenimport noch nicht zu 3D-Körpern verarbeitet.
- **OBJ / DAE:** bestehende Importformate bleiben verfügbar. Ihre Maße werden weiterhin heuristisch aus m/cm/mm abgeleitet; deshalb vor dem Speichern die angezeigten Maße prüfen. Referenzierte externe Material- oder Texturdateien werden nicht nachgeladen.

Die Originaldatei (maximal 8 MB) bleibt erhalten. Metadaten liegen in PostgreSQL, Dateiinhalte im Dokumentenspeicher (`DOCUMENT_STORAGE_DIR`, standardmäßig `.storage/documents`). Docker verwendet dafür das persistente Volume `document_data`. Der Download erfolgt über `/api/v1/tenant/assets/:id/file` mit Mandantenprüfung. Bereits früher importierte Datensätze ohne gespeicherte Originaldatei müssen erneut importiert werden.

Nachträgliche Maßänderungen skalieren das importierte Modell als Ganzes. Ein importiertes Fenster als freies Modell erzeugt noch keinen Wanddurchbruch; dafür weiterhin eine parametrisierte Fenster-/Türvorlage verwenden. Die Vorlage ist gegenwärtig an eine Wand gebunden; freie Verschiebung im Raum und bauteilweise Materialbearbeitung eigener Modelle folgen separat.

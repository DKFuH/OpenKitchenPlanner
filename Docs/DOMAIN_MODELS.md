# DOMAIN_MODELS.md

Domänenmodelle für YAKDS – Raumgeometrie, Preislogik und Angebotswesen.

---

## Teil 1 – Raummodell

### Grundprinzip

Alle Räume sind **Polygone** — kein Sonderfall für Rechtecke.
Platzierungen erfolgen immer relativ zu `wall_id + offset_mm`.
Dachschrägen sind `CeilingConstraints` — keine separate Geometrie.

### `Room`

```typescript
interface Room {
  id: string;
  project_id: string;
  name: string;
  boundary: RoomBoundary;
  ceiling_height_mm: number;
  ceiling_constraints: CeilingConstraint[];
  openings: Opening[];
  created_at: string;
  updated_at: string;
}
```

### `RoomBoundary`

CCW-orientiertes, geschlossenes Polygon. `wall_segments[i]` verbindet `vertices[i]` mit `vertices[(i+1) % n]`.

```typescript
interface RoomBoundary {
  vertices: Vertex[];           // mind. 3, max. 64
  wall_segments: WallSegment[]; // automatisch abgeleitet
}

interface Vertex {
  id: string; x_mm: number; y_mm: number; index: number;
}

interface WallSegment {
  id: string;               // stabil, ändert sich nicht beim Vertex-Move
  room_id: string;
  index: number;
  start_vertex_id: string;
  end_vertex_id: string;
  length_mm: number;        // berechnet
  inner_normal: Vector2D;   // zeigt ins Rauminnere
}
```

### `Opening` – Türen & Fenster

```typescript
interface Opening {
  id: string;
  wall_id: string;
  type: 'door' | 'window' | 'pass-through';
  offset_mm: number;        // Abstand vom Wandanfang
  width_mm: number;
  height_mm: number;
  sill_height_mm: number;   // 0 bei Türen
  source: 'manual' | 'cad_import';
}
```

Regeln: `offset_mm + width_mm <= wall.length_mm`, keine Überschneidungen, Objekte nicht in Öffnungen.

### `CeilingConstraint` – Dachschräge

```typescript
interface CeilingConstraint {
  id: string;
  room_id: string;
  wall_id: string;
  kniestock_height_mm: number;
  slope_angle_deg: number;
  depth_into_room_mm: number;
}
```

Verfügbare Höhe an Punkt `(x, y)`:
```
d = senkrechter Abstand zur Wand
if d >= depth_into_room_mm:  available = ceiling_height_mm
else:                        available = kniestock_height_mm + tan(slope_angle_deg) * d
```
Bei mehreren Constraints gilt das Minimum.

### Platzierungsobjekte

```typescript
interface CabinetInstance {
  id: string; room_id: string; catalog_item_id: string;
  wall_id: string; offset_mm: number;
  width_mm: number; height_mm: number; depth_mm: number;
  flags: PlacementFlags;
}

interface PlacementFlags {
  requires_customization: boolean;
  height_variant: string | null;
  labor_surcharge: boolean;
  special_trim_needed: boolean;
}

interface RuleViolation {
  severity: 'error' | 'warning' | 'hint';
  code: RuleCode;
  message: string;
  affected_ids: string[];
}

type RuleCode =
  | 'OBJECT_OVERLAP' | 'OBJECT_OUTSIDE_ROOM' | 'OBJECT_BLOCKS_OPENING'
  | 'MIN_CLEARANCE_VIOLATED' | 'HEIGHT_EXCEEDED'
  | 'HANGING_CABINET_SLOPE_COLLISION' | 'SPECIAL_TRIM_NEEDED'
  | 'SPECIAL_CUT_NEEDED' | 'LABOR_SURCHARGE';
```

### Validierungsregeln (Übersicht)

| Regel | Zuständig |
|-------|-----------|
| Polygon geschlossen, keine Selbstüberschneidung | Codex |
| Mindestkantenlänge 100 mm | Codex |
| Mind. 3, max. 64 Vertices | API (Zod) |
| Öffnung innerhalb Wandgrenzen, keine Überlappungen | Codex |
| Platzierung innerhalb Raum, keine Kollisionen | Codex |
| Höhe vs. CeilingConstraint | Codex |

---

## Teil 2 – Preismodell

### Grundprinzip

Preise werden deterministisch pro Projekt berechnet:
`POST /projects/:id/calculate-pricing` → immer dasselbe Ergebnis für denselben Zustand.

### 9-stufige Preislogik

```
1. list_price_net          Listenpreis
2. + variant_surcharge     Varianten-/Mehrpreise
3. + object_surcharges     Montage, Sondermaß …
4. - position_discount_pct Positionsrabatt
5. - group_discount_pct    Warengruppenrabatt
6. - global_discount_pct   Globalrabatt
7. + extra_costs           Fracht, Montage pauschal
8. + VAT                   MwSt aus tax_group_id
9.   Rundung               kaufmännisch auf 0,01 €
```

### Kernobjekte

```typescript
interface BOMLine {
  id: string; project_id: string; type: BOMLineType;
  catalog_item_id: string | null;
  description: string; qty: number;
  unit: 'stk' | 'm' | 'm2' | 'pauschal';
  list_price_net: number; variant_surcharge: number;
  object_surcharges: number;
  position_discount_pct: number; pricing_group_discount_pct: number;
  line_net_after_discounts: number;
  tax_group_id: string; tax_rate: number;
}

type BOMLineType = 'cabinet' | 'appliance' | 'accessory' | 'surcharge' | 'assembly' | 'freight' | 'extra';

interface PriceSummary {
  project_id: string; calculated_at: string;
  total_list_price_net: number; total_variant_surcharges: number;
  total_object_surcharges: number; total_position_discounts: number;
  total_group_discounts: number; total_global_discount: number;
  total_extra_costs: number;
  subtotal_net: number; vat_amount: number; total_gross: number;
  dealer_price_net: number; contribution_margin_net: number; markup_pct: number;
  bom_lines: BOMLine[];
}

interface GlobalDiscountSettings {
  project_id: string;
  global_discount_pct: number;
  extra_costs: ExtraCost[];
}
```

### API-Contracts

```
POST /projects/:id/calculate-pricing  → PriceSummary
GET  /projects/:id/price-summary      → PriceSummary
PUT  /projects/:id/discount-settings  → GlobalDiscountSettings
```

### Berechnungsbeispiel

| Schritt | Wert |
|---------|------|
| Listenpreis | 1.000,00 € |
| + Variante | 1.050,00 € |
| + Sondermaß | 1.130,00 € |
| − 5% Positionsrabatt | 1.073,50 € |
| − 10% Warengruppe | 966,15 € |
| − 3% Global | 937,17 € |
| + 89 € Fracht | 1.026,17 € |
| + 19% MwSt | **1.221,14 €** |

---

## Teil 3 – Angebotsmodell

### Grundprinzip

Ein Angebot wird aus Projekt + PriceSummary erzeugt.
Angebote sind **versioniert** und nach Erstellung **schreibgeschützt** — Änderungen erzeugen eine neue Version.

### Workflow

```
Projekt (geplant + berechnet)
  → POST /projects/:id/create-quote
    → Quote (draft)
      → sent → accepted / rejected / expired
```

### Kernobjekte

```typescript
interface Quote {
  id: string; project_id: string; version: number;
  quote_number: string;           // z.B. "ANG-2026-0042"
  status: QuoteStatus;
  valid_until: string;
  free_text: string | null; footer_text: string | null;
  price_summary: PriceSummary;    // Snapshot
  items: QuoteItem[];
  created_at: string; created_by: string;
  pdf_url: string | null;
}

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

interface QuoteItem {
  id: string; quote_id: string; position: number;
  type: BOMLineType; description: string;
  qty: number; unit: string;
  unit_price_net: number; line_net: number;
  tax_rate: number; line_gross: number;
  notes: string | null; show_on_quote: boolean;
}
```

### PDF-Struktur

1. Kopf (Logo, Firmendaten, Angebotsnummer, Gültig-bis)
2. Freitext oben
3. Positionstabelle (Nr. | Bezeichnung | Menge | EP netto | GP netto)
4. Summenblock (netto / MwSt / brutto)
5. Freitext unten / Fußnote

### API-Contracts

```
POST /projects/:id/create-quote       → Quote
GET  /quotes/:id                      → Quote
GET  /projects/:id/quotes             → Quote[]
PATCH /quotes/:id/status              → Quote
POST /quotes/:id/export-pdf           → { pdf_url }
```

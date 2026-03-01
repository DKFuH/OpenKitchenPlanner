# YAKDS — Yust another Kitchen Design Software (Business)

YAKDS is a **web-based kitchen design and business tool** built for real-world renovation projects: **non-rectangular rooms**, **sloped ceilings**, **CAD interoperability**, and **quote-ready commercial output**.

The core idea: planning is only valuable if it reliably turns into **a bill of materials, prices, and a customer-ready quote** — and if it can ingest existing floor plans from the field.

---

## Status (Sprint 19)
YAKDS is in active development. The current milestone delivers:

### Planning (Geometry & Rules)
- **Polygon rooms** (multiple corners, irregular angles)
- **Wall-based placement** of objects (`wall_id + offset`) for deterministic layouts
- **Openings** (doors/windows) attached to wall segments
- **Sloped-ceiling constraints** (height constraints) with rule checks
- **Collision + validation checks** (geometry correctness and feasibility signals)

### CAD / SketchUp Interop
- **DWG/DXF import/export** (2D floor plan exchange)
- **SketchUp (`.skp`) reference import** (as overlay/reference geometry)
- **Import jobs** for larger files (track status, results, and warnings)

### Commercial (Business Core)
- **Bill of Materials (BOM)** generation from a design
- **Pricing engine** with:
  - list/dealer price support
  - markups
  - position/group/global discounts
  - VAT groups
  - rounding rules
- **Quotes / offers**:
  - quote objects + versions
  - PDF export (light)
- **Block pricing support** (special discount model) with evaluation and application to quotes

### Rendering
- **Browser 3D preview** (lightweight, for fast verification)
- **External render worker** via HTTPS:
  - job queue
  - status tracking (`queued/assigned/running/done/failed`)
  - returns rendered images back to the system
- Architecture supports scaling to multiple workers (render farm concept)

---

## Architecture Overview

YAKDS is split into clear subsystems:

- **Planner Frontend** (web UI)
  - room editor, placement tools, validations
  - BOM/pricing/quote views
  - CAD/SKP overlay handling

- **Planner API** (backend)
  - projects, versions, catalog, pricing, quotes
  - validations and rule execution
  - import/export jobs (DWG/DXF/SKP references)
  - render job orchestration

- **Render Worker** (external service)
  - pulls render jobs over HTTPS
  - renders in an isolated environment
  - posts results back (images + metadata)

- **Shared Schemas**
  - JSON contracts for project layout, scene payloads, BOM/pricing, imports/exports

---

## Key Concepts

### Room Model
Rooms are represented as a **closed polygon** with derived wall segments.
Doors/windows are modeled as **openings on wall segments**.

### Height Constraints (Sloped Ceilings)
Vertical constraints are expressed as **height rules** tied to walls/zones.
Objects can be validated against available height at their position.

### Deterministic Placement
Objects are placed relative to walls (not “free-floating”) to keep:
- predictable snapping
- stable reconstruction from stored data
- reliable automation for long parts (later phases)

### Business Objects
A design can be transformed into:
- **BOM lines**
- **pricing summary**
- **quote** (versioned)

---

## Repository Layout (suggested)
```text
docs/
planner-frontend/
planner-api/
render-worker/
shared-schemas/
interop-cad/
interop-sketchup/
tests/
scripts/

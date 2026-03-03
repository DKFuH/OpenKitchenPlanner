# Sprint 62 – MCP: Claude als Planungsassistent

**Branch:** `feature/sprint-62-mcp-planungsassistent`
**Gruppe:** A (unabhängig, baut auf S9-MCP auf)
**Status:** `planned`
**Abhängigkeiten:** Sprint 9-MCP (mcp.ts + mcpService.ts vorhanden)

---

## Ziel

Claude (und andere MCP-fähige KI-Systeme) können als vollwertiger
Planungsassistent agieren: Raumgeometrie lesen, Möbel platzieren,
Angebote erstellen, Projektstatus weiterschalten — alles über Tools,
ohne direkten API-Zugriff. Die bestehenden 5 Read-Tools werden auf
**15 Tools** ausgebaut (Read + Write).

---

## Übersicht neue Tools

| # | Tool | Typ | Beschreibung |
|---|------|-----|-------------|
| 1 | `list_projects` | R | bereits vorhanden |
| 2 | `get_project` | R | bereits vorhanden |
| 3 | `suggest_kitchen_layout` | R | bereits vorhanden |
| 4 | `get_catalog_articles` | R | bereits vorhanden |
| 5 | `get_bom` | R | bereits vorhanden |
| 6 | `get_rooms` | R | **NEU** – alle Räume eines Projekts mit Fläche |
| 7 | `get_room_detail` | R | **NEU** – Raumpolygon, Wände, Öffnungen, Placements |
| 8 | `get_placements` | R | **NEU** – platzierte Artikel in einem Raum |
| 9 | `get_quote` | R | **NEU** – aktuelles Angebot mit Positionen + Summen |
| 10 | `search_contacts` | R | **NEU** – Kunden/Leads suchen |
| 11 | `create_project` | W | **NEU** – neues Projekt anlegen |
| 12 | `update_project_status` | W | **NEU** – Projektstatus weiterschalten |
| 13 | `add_placement` | W | **NEU** – Artikel in Raum platzieren |
| 14 | `remove_placement` | W | **NEU** – Platzierung entfernen |
| 15 | `create_quote_from_bom` | W | **NEU** – Angebot aus Stückliste erzeugen |

---

## 1. Erweiterung `mcpService.ts`

### Neue Tool-Definitionen (anhängen an `MCP_TOOLS`-Array)

```typescript
// ── get_rooms ────────────────────────────────────────────────────────────────
{
  name: 'get_rooms',
  description: 'Listet alle Räume eines Projekts mit Name, Fläche und Deckenhöhe.',
  inputSchema: {
    type: 'object',
    required: ['project_id'],
    properties: {
      project_id: { type: 'string', description: 'UUID des Projekts' },
    },
    additionalProperties: false,
  },
},

// ── get_room_detail ──────────────────────────────────────────────────────────
{
  name: 'get_room_detail',
  description: 'Gibt Raumpolygon, Wände (mit Längen), Öffnungen (Türen/Fenster) und platzierte Artikel zurück.',
  inputSchema: {
    type: 'object',
    required: ['room_id'],
    properties: {
      room_id: { type: 'string', description: 'UUID des Raums' },
    },
    additionalProperties: false,
  },
},

// ── get_placements ───────────────────────────────────────────────────────────
{
  name: 'get_placements',
  description: 'Gibt alle platzierten Artikel in einem Raum zurück (Artikel-ID, Name, Position, Abmessungen).',
  inputSchema: {
    type: 'object',
    required: ['room_id'],
    properties: {
      room_id: { type: 'string', description: 'UUID des Raums' },
    },
    additionalProperties: false,
  },
},

// ── get_quote ────────────────────────────────────────────────────────────────
{
  name: 'get_quote',
  description: 'Gibt das aktuelle Angebot eines Projekts zurück (Positionen, Netto/Brutto-Summen, Status).',
  inputSchema: {
    type: 'object',
    required: ['project_id'],
    properties: {
      project_id: { type: 'string', description: 'UUID des Projekts' },
    },
    additionalProperties: false,
  },
},

// ── search_contacts ──────────────────────────────────────────────────────────
{
  name: 'search_contacts',
  description: 'Sucht nach Kunden/Leads anhand von Name oder E-Mail.',
  inputSchema: {
    type: 'object',
    properties: {
      query:     { type: 'string', description: 'Name oder E-Mail-Fragment' },
      tenant_id: { type: 'string', description: 'Optionale Tenant-ID' },
      limit:     { type: 'number', default: 10 },
    },
    additionalProperties: false,
  },
},

// ── create_project ───────────────────────────────────────────────────────────
{
  name: 'create_project',
  description: 'Legt ein neues Planungsprojekt an.',
  inputSchema: {
    type: 'object',
    required: ['name', 'tenant_id'],
    properties: {
      name:        { type: 'string', description: 'Projektname' },
      tenant_id:   { type: 'string', description: 'Tenant-UUID' },
      description: { type: 'string', description: 'Optionale Beschreibung' },
      lead_id:     { type: 'string', description: 'Optionale Lead/Kunden-UUID' },
    },
    additionalProperties: false,
  },
},

// ── update_project_status ────────────────────────────────────────────────────
{
  name: 'update_project_status',
  description: 'Schaltet den Status eines Projekts weiter (lead → planning → quoted → contract → production → installed).',
  inputSchema: {
    type: 'object',
    required: ['project_id', 'status'],
    properties: {
      project_id: { type: 'string' },
      status: {
        type: 'string',
        enum: ['lead', 'planning', 'quoted', 'contract', 'production', 'installed'],
      },
    },
    additionalProperties: false,
  },
},

// ── add_placement ────────────────────────────────────────────────────────────
{
  name: 'add_placement',
  description: 'Platziert einen Katalogartikel in einem Raum an einer Wand.',
  inputSchema: {
    type: 'object',
    required: ['room_id', 'article_id', 'wall_id', 'offset_mm'],
    properties: {
      room_id:    { type: 'string', description: 'UUID des Raums' },
      article_id: { type: 'string', description: 'UUID des Katalogartikels' },
      wall_id:    { type: 'string', description: 'UUID der Wand' },
      offset_mm:  { type: 'number', description: 'Abstand vom Wand-Startpunkt in mm' },
    },
    additionalProperties: false,
  },
},

// ── remove_placement ─────────────────────────────────────────────────────────
{
  name: 'remove_placement',
  description: 'Entfernt eine Platzierung aus einem Raum.',
  inputSchema: {
    type: 'object',
    required: ['placement_id'],
    properties: {
      placement_id: { type: 'string', description: 'UUID der Platzierung' },
    },
    additionalProperties: false,
  },
},

// ── create_quote_from_bom ────────────────────────────────────────────────────
{
  name: 'create_quote_from_bom',
  description: 'Erzeugt ein neues Angebot aus der aktuellen Stückliste des Projekts.',
  inputSchema: {
    type: 'object',
    required: ['project_id'],
    properties: {
      project_id:  { type: 'string' },
      valid_days:  { type: 'number', description: 'Gültigkeitsdauer in Tagen (default 30)', default: 30 },
      free_text:   { type: 'string', description: 'Optionaler Angebotstext' },
    },
    additionalProperties: false,
  },
},
```

---

### Tool-Implementierungen in `callMcpTool()`

```typescript
case 'get_rooms': {
  const projectId = args.project_id as string
  if (!projectId) return { content: [{ type: 'text', text: 'project_id required' }], isError: true }
  const rooms = await anyDb.room.findMany({
    where: { project_id: projectId },
    select: { id: true, name: true, area_sqm: true, ceiling_height_mm: true, created_at: true },
    orderBy: { created_at: 'asc' },
  })
  return { content: [{ type: 'text', text: JSON.stringify({ rooms, count: rooms.length }) }] }
}

case 'get_room_detail': {
  const roomId = args.room_id as string
  if (!roomId) return { content: [{ type: 'text', text: 'room_id required' }], isError: true }
  const room = await anyDb.room.findUnique({
    where: { id: roomId },
    include: {
      walls: { include: { openings: true } },
      placements: { include: { catalog_article: { select: { name: true, sku: true, width_mm: true, depth_mm: true, height_mm: true } } } },
    },
  })
  if (!room) return { content: [{ type: 'text', text: `Room ${roomId} not found` }], isError: true }
  return { content: [{ type: 'text', text: JSON.stringify(room) }] }
}

case 'get_placements': {
  const roomId = args.room_id as string
  const placements = await anyDb.placement.findMany({
    where: { room_id: roomId },
    include: { catalog_article: { select: { name: true, sku: true, width_mm: true, depth_mm: true } } },
  })
  return { content: [{ type: 'text', text: JSON.stringify({ placements, count: placements.length }) }] }
}

case 'get_quote': {
  const projectId = args.project_id as string
  const quote = await anyDb.quote.findFirst({
    where: { project_id: projectId },
    orderBy: { version: 'desc' },
    include: { lines: { orderBy: { position: 'asc' } } },
  })
  if (!quote) return { content: [{ type: 'text', text: 'No quote found for project' }], isError: true }
  return { content: [{ type: 'text', text: JSON.stringify(quote) }] }
}

case 'search_contacts': {
  const query = args.query as string | undefined
  const limit = Math.min(50, Number(args.limit ?? 10))
  const where: Record<string, unknown> = {}
  if (args.tenant_id) where.tenant_id = args.tenant_id
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ]
  }
  const contacts = await anyDb.lead.findMany({
    where, take: limit,
    select: { id: true, name: true, email: true, phone: true, created_at: true },
  })
  return { content: [{ type: 'text', text: JSON.stringify({ contacts, count: contacts.length }) }] }
}

case 'create_project': {
  const { name, tenant_id, description, lead_id } = args as Record<string, string>
  if (!name || !tenant_id) return { content: [{ type: 'text', text: 'name and tenant_id required' }], isError: true }
  const project = await anyDb.project.create({
    data: { name, tenant_id, description: description ?? null, lead_id: lead_id ?? null, project_status: 'lead' },
  })
  return { content: [{ type: 'text', text: JSON.stringify({ project_id: project.id, name: project.name, status: project.project_status }) }] }
}

case 'update_project_status': {
  const projectId = args.project_id as string
  const status = args.status as string
  const validStatuses = ['lead', 'planning', 'quoted', 'contract', 'production', 'installed']
  if (!validStatuses.includes(status)) {
    return { content: [{ type: 'text', text: `Invalid status. Allowed: ${validStatuses.join(', ')}` }], isError: true }
  }
  const project = await anyDb.project.update({
    where: { id: projectId },
    data: { project_status: status as never },
    select: { id: true, name: true, project_status: true },
  })
  return { content: [{ type: 'text', text: JSON.stringify(project) }] }
}

case 'add_placement': {
  const { room_id, article_id, wall_id, offset_mm } = args as Record<string, unknown>
  if (!room_id || !article_id || !wall_id) {
    return { content: [{ type: 'text', text: 'room_id, article_id and wall_id required' }], isError: true }
  }
  const article = await anyDb.catalogArticle.findUnique({ where: { id: article_id as string } })
  if (!article) return { content: [{ type: 'text', text: `Article ${article_id} not found` }], isError: true }
  const placement = await anyDb.placement.create({
    data: {
      room_id: room_id as string,
      article_id: article_id as string,
      wall_id: wall_id as string,
      offset_mm: Number(offset_mm ?? 0),
      width_mm: article.width_mm,
      depth_mm: article.depth_mm,
      height_mm: article.height_mm,
    },
  })
  return { content: [{ type: 'text', text: JSON.stringify({ placement_id: placement.id }) }] }
}

case 'remove_placement': {
  const placementId = args.placement_id as string
  await anyDb.placement.delete({ where: { id: placementId } }).catch(() => null)
  return { content: [{ type: 'text', text: JSON.stringify({ removed: placementId }) }] }
}

case 'create_quote_from_bom': {
  const projectId = args.project_id as string
  const validDays = Number(args.valid_days ?? 30)
  const freeText = args.free_text as string | undefined

  const bom = await anyDb.projectLineItem.findMany({ where: { project_id: projectId } })
  if (bom.length === 0) return { content: [{ type: 'text', text: 'No BOM items found' }], isError: true }

  const existing = await anyDb.quote.findFirst({ where: { project_id: projectId }, orderBy: { version: 'desc' } })
  const version = (existing?.version ?? 0) + 1
  const validUntil = new Date(Date.now() + validDays * 86_400_000)

  const quote = await anyDb.quote.create({
    data: {
      project_id: projectId,
      version,
      valid_until: validUntil,
      free_text: freeText ?? null,
      lines: {
        create: bom.map((item, idx) => ({
          position: idx + 1,
          description: item.name,
          qty: item.quantity,
          unit: 'Stk',
          unit_price_net: item.unit_price ?? 0,
          line_net: item.total_price ?? 0,
          tax_rate: 19,
          show_on_quote: true,
        })),
      },
    },
    include: { lines: true },
  })
  return { content: [{ type: 'text', text: JSON.stringify({ quote_id: quote.id, version, lines: quote.lines.length }) }] }
}
```

---

## 2. Capabilities im MCP-Info-Endpoint aktualisieren

```typescript
// GET /mcp
return reply.send({
  name: 'open-kitchen-planner',
  version: '2.0.0',
  description: 'MCP-Server für den Open Kitchen Planner – Küchen planen, Angebote erstellen, Projekte verwalten',
  protocol: 'MCP/1.0',
  capabilities: {
    tools: true,
    read_tools: ['list_projects','get_project','get_rooms','get_room_detail','get_placements','get_quote','search_contacts','get_catalog_articles','get_bom','suggest_kitchen_layout'],
    write_tools: ['create_project','update_project_status','add_placement','remove_placement','create_quote_from_bom'],
  },
})
```

---

## 3. Tests (`planner-api/src/routes/mcp.test.ts` erweitern)

Neue Tests (10 Mindest-Tests, existierende behalten):

1. `tools/list` → 15 Tools zurückgegeben
2. `get_rooms` mit gültiger project_id → rooms-Array
3. `get_rooms` mit unbekannter project_id → leeres Array (kein 404, Tool gibt `[]` zurück)
4. `get_room_detail` → walls + openings + placements enthalten
5. `get_room_detail` unbekannt → isError: true
6. `get_quote` → aktuelle Quote mit lines
7. `search_contacts` mit query → gefilterte Ergebnisse
8. `create_project` → project_id zurückgegeben
9. `update_project_status` mit ungültigem Status → isError: true
10. `create_quote_from_bom` → quote_id + lines.length zurückgegeben
11. `add_placement` → placement_id zurückgegeben
12. `remove_placement` → removed-Key zurückgegeben

---

## 4. Frontend: MCP-Konfigurationspanel (optional, light)

Neue Seite `planner-frontend/src/pages/McpInfoPage.tsx`:
- Zeigt `GET /api/v1/mcp` Info (Tools, Version, Capabilities)
- Copy-Button für den MCP-Endpunkt-URL (`/api/v1/mcp`)
- Kurzanleitung: „So verbindest du Claude mit deinem Planner"

Erreichbar über `/settings/mcp`.

---

## DoD-Checkliste

- [ ] 10 neue Tools in `MCP_TOOLS`-Array
- [ ] `callMcpTool()` – alle 10 Cases implementiert
- [ ] `GET /mcp` → version 2.0.0, capabilities mit read/write-Listen
- [ ] `tools/list` → 15 Tools
- [ ] 12+ neue Tests grün, bestehende Tests weiterhin grün
- [ ] `McpInfoPage.tsx` mit Endpunkt-URL und Kurzanleitung
- [ ] ROADMAP Sprint 62 → `done`

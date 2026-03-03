import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const projectId = '11111111-1111-1111-1111-111111111111'
const roomId = '22222222-2222-2222-2222-222222222222'
const articleId = '33333333-3333-3333-3333-333333333333'
const placementId = '44444444-4444-4444-4444-444444444444'
const quoteId = '55555555-5555-5555-5555-555555555555'
const tenantId = 'tenant-1'
const userId = '66666666-6666-6666-6666-666666666666'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    room: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    catalogArticle: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    quote: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    contact: {
      findMany: vi.fn(),
    },
    projectLineItem: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { mcpRoutes } from './mcp.js'

const PROJECT_FIXTURE = {
  id: projectId,
  name: 'Musterküche EG',
  description: 'Küche im Erdgeschoss',
  project_status: 'planning',
  priority: 'medium',
  progress_pct: 30,
  deadline: null,
  tenant_id: tenantId,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
}

const ROOM_FIXTURE = {
  id: roomId,
  project_id: projectId,
  name: 'Küche',
  ceiling_height_mm: 2600,
  boundary: {
    vertices: [
      { id: 'v1', x_mm: 0, y_mm: 0 },
      { id: 'v2', x_mm: 4000, y_mm: 0 },
      { id: 'v3', x_mm: 4000, y_mm: 3000 },
      { id: 'v4', x_mm: 0, y_mm: 3000 },
    ],
    wall_segments: [
      { id: 'w1', start_vertex_id: 'v1', end_vertex_id: 'v2' },
      { id: 'w2', start_vertex_id: 'v2', end_vertex_id: 'v3' },
    ],
  },
  openings: [{ id: 'o1', wall_id: 'w1', type: 'door', offset_mm: 900, width_mm: 900 }],
  placements: [
    {
      id: placementId,
      catalog_article_id: articleId,
      wall_id: 'w1',
      offset_mm: 1200,
      width_mm: 600,
      depth_mm: 560,
      height_mm: 720,
    },
  ],
  created_at: new Date('2026-01-02T00:00:00.000Z'),
  updated_at: new Date('2026-01-02T00:00:00.000Z'),
}

const ARTICLE_FIXTURE = {
  id: articleId,
  name: 'Unterschrank 60',
  sku: 'US-60',
  base_dims_json: { width_mm: 600, depth_mm: 560, height_mm: 720 },
}

const QUOTE_FIXTURE = {
  id: quoteId,
  project_id: projectId,
  version: 2,
  quote_number: 'ANG-2026-0002',
  status: 'draft',
  items: [
    {
      id: 'qi-1',
      position: 1,
      description: 'Unterschrank 60',
      qty: 1,
      unit: 'Stk',
      unit_price_net: 100,
      line_net: 100,
      tax_rate: 0.19,
      line_gross: 119,
    },
  ],
}

async function createApp() {
  const app = Fastify()
  await app.register(mcpRoutes, { prefix: '/api/v1' })
  return app
}

describe('mcpRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.user.findUnique.mockResolvedValue({ id: userId, branch_id: null })
    prismaMock.user.findFirst.mockResolvedValue({ id: userId, branch_id: null })

    prismaMock.project.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === projectId) return PROJECT_FIXTURE
      return null
    })
    prismaMock.project.findMany.mockResolvedValue([PROJECT_FIXTURE])
    prismaMock.project.count.mockResolvedValue(1)
    prismaMock.project.create.mockResolvedValue({
      id: '77777777-7777-7777-7777-777777777777',
      name: 'Neu',
      project_status: 'lead',
      tenant_id: tenantId,
      created_at: new Date('2026-02-01T00:00:00.000Z'),
    })
    prismaMock.project.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: { project_status: string } }) => {
      if (where.id !== projectId) throw new Error('not found')
      return { id: projectId, name: PROJECT_FIXTURE.name, project_status: data.project_status }
    })

    prismaMock.room.findMany.mockResolvedValue([ROOM_FIXTURE])
    prismaMock.room.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === roomId) return ROOM_FIXTURE
      return null
    })
    prismaMock.room.update.mockResolvedValue({ ...ROOM_FIXTURE })

    prismaMock.catalogArticle.findMany.mockResolvedValue([ARTICLE_FIXTURE])
    prismaMock.catalogArticle.findMany.mockResolvedValue([])
    prismaMock.catalogArticle.count.mockResolvedValue(0)
    prismaMock.catalogArticle.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === articleId) return ARTICLE_FIXTURE
      return null
    })

    prismaMock.quote.findFirst.mockImplementation(async ({ where, select }: { where: { project_id: string }; select?: { version: boolean } }) => {
      if (where.project_id !== projectId) return null
      if (select?.version) return { version: 2 }
      return QUOTE_FIXTURE
    })
    prismaMock.quote.create.mockResolvedValue({
      id: '88888888-8888-8888-8888-888888888888',
      version: 3,
      items: [{ id: 'qi-1' }, { id: 'qi-2' }],
    })

    prismaMock.contact.findMany.mockResolvedValue([
      {
        id: 'c1',
        first_name: 'Max',
        last_name: 'Mustermann',
        email: 'max@example.com',
        phone: '+4912345',
        company: 'Muster GmbH',
        created_at: new Date('2026-02-10T00:00:00.000Z'),
      },
    ])

    prismaMock.projectLineItem.findMany.mockResolvedValue([
      {
        id: 'pli-1',
        source_type: 'manual',
        description: 'Unterschrank 60',
        qty: 1,
        unit: 'Stk',
        unit_price_net: 100,
        tax_rate: 0.19,
        line_net: 100,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])
  })

  // ── Server-Info ───────────────────────────────────────────────────────────

  it('GET /mcp → 200 server info', async () => {
    const app = await createApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/mcp' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.name).toBe('open-kitchen-planner')
    expect(body.version).toBe('2.0.0')
    expect(body.capabilities.tools).toBe(true)
    expect(Array.isArray(body.capabilities.read_tools)).toBe(true)
    expect(Array.isArray(body.capabilities.write_tools)).toBe(true)
    await app.close()
  })

  // ── JSON-RPC validation ───────────────────────────────────────────────────

  it('POST /mcp missing jsonrpc field → 400', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: { method: 'initialize' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe(-32600)
    await app.close()
  })

  it('POST /mcp unknown method → 400 method not found', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: { jsonrpc: '2.0', id: 1, method: 'nonexistent' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe(-32601)
    await app.close()
  })

  // ── initialize ────────────────────────────────────────────────────────────

  it('POST initialize → 200 with capabilities', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.result.serverInfo.name).toBe('open-kitchen-planner')
    expect(body.result.serverInfo.version).toBe('2.0.0')
    expect(body.result.capabilities.tools).toBeDefined()
    await app.close()
  })

  // ── tools/list ────────────────────────────────────────────────────────────

  it('POST tools/list → 200 with tools array', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body.result.tools)).toBe(true)
    expect(body.result.tools).toHaveLength(15)
    const names = (body.result.tools as Array<{ name: string }>).map((t) => t.name)
    expect(names).toContain('list_projects')
    expect(names).toContain('get_project')
    expect(names).toContain('suggest_kitchen_layout')
    expect(names).toContain('get_catalog_articles')
    expect(names).toContain('get_bom')
    expect(names).toContain('get_rooms')
    expect(names).toContain('get_room_detail')
    expect(names).toContain('get_placements')
    expect(names).toContain('get_quote')
    expect(names).toContain('search_contacts')
    expect(names).toContain('create_project')
    expect(names).toContain('update_project_status')
    expect(names).toContain('add_placement')
    expect(names).toContain('remove_placement')
    expect(names).toContain('create_quote_from_bom')
    await app.close()
  })

  // ── tools/call – list_projects ────────────────────────────────────────────

  it('tools/call list_projects → 200 with projects', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'list_projects', arguments: {} },
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    const text = body.result.content[0].text
    const data = JSON.parse(text)
    expect(data.total).toBe(1)
    expect(data.projects[0].id).toBe(projectId)
    await app.close()
  })

  // ── tools/call – get_project ──────────────────────────────────────────────

  it('tools/call get_project existing → 200 with project data', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'get_project', arguments: { project_id: projectId } },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.id).toBe(projectId)
    expect(data.name).toBe('Musterküche EG')
    await app.close()
  })

  it('tools/call get_project unknown id → isError true', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_project', arguments: { project_id: '00000000-0000-0000-0000-000000000000' } },
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().result.isError).toBe(true)
    await app.close()
  })

  // ── tools/call – suggest_kitchen_layout ──────────────────────────────────

  it('tools/call suggest_kitchen_layout valid room → suggestions', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'suggest_kitchen_layout',
          arguments: {
            ceiling_height_mm: 2600,
            wall_segments: [
              { id: 'w1', x0_mm: 0, y0_mm: 0, x1_mm: 4200, y1_mm: 0 },
              { id: 'w2', x0_mm: 4200, y0_mm: 0, x1_mm: 4200, y1_mm: 3600 },
              { id: 'w3', x0_mm: 4200, y0_mm: 3600, x1_mm: 0, y1_mm: 3600 },
              { id: 'w4', x0_mm: 0, y0_mm: 3600, x1_mm: 0, y1_mm: 0 },
            ],
          },
        },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(Array.isArray(data.suggestions)).toBe(true)
    expect(data.suggestions.length).toBeGreaterThan(0)
    const types = data.suggestions.map((s: { layout_type: string }) => s.layout_type)
    expect(types).toContain('einzeiler')
    await app.close()
  })

  it('tools/call suggest_kitchen_layout empty wall_segments → isError true', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'suggest_kitchen_layout',
          arguments: { ceiling_height_mm: 2600, wall_segments: [] },
        },
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().result.isError).toBe(true)
    await app.close()
  })

  // ── tools/call – get_catalog_articles ────────────────────────────────────

  it('tools/call get_catalog_articles → 200 with articles array', async () => {
    prismaMock.catalogArticle.findMany.mockResolvedValueOnce([])
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: { name: 'get_catalog_articles', arguments: {} },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.total).toBe(0)
    expect(Array.isArray(data.articles)).toBe(true)
    await app.close()
  })

  // ── tools/call – get_bom ─────────────────────────────────────────────────

  it('tools/call get_bom known project → 200 with items', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'get_bom', arguments: { project_id: projectId } },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.project_id).toBe(projectId)
    expect(Array.isArray(data.items)).toBe(true)
    await app.close()
  })

  it('tools/call get_bom unknown project → isError true', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: { name: 'get_bom', arguments: { project_id: '00000000-0000-0000-0000-000000000000' } },
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().result.isError).toBe(true)
    await app.close()
  })

  // ── tools/call – get_rooms ───────────────────────────────────────────────

  it('tools/call get_rooms known project → rooms array', async () => {
    prismaMock.room.findMany.mockResolvedValueOnce([ROOM_FIXTURE])
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: { name: 'get_rooms', arguments: { project_id: projectId } },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(Array.isArray(data.rooms)).toBe(true)
    expect(data.rooms[0].id).toBe(roomId)
    expect(data.count).toBe(1)
    await app.close()
  })

  it('tools/call get_rooms unknown project → empty array', async () => {
    prismaMock.room.findMany.mockResolvedValueOnce([])
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 13,
        method: 'tools/call',
        params: { name: 'get_rooms', arguments: { project_id: '00000000-0000-0000-0000-000000000000' } },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.rooms).toEqual([])
    expect(data.count).toBe(0)
    await app.close()
  })

  // ── tools/call – get_room_detail / get_placements ───────────────────────

  it('tools/call get_room_detail known room → walls/openings/placements included', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 14,
        method: 'tools/call',
        params: { name: 'get_room_detail', arguments: { room_id: roomId } },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(Array.isArray(data.walls)).toBe(true)
    expect(Array.isArray(data.openings)).toBe(true)
    expect(Array.isArray(data.placements)).toBe(true)
    expect(data.openings.length).toBeGreaterThan(0)
    await app.close()
  })

  it('tools/call get_room_detail unknown room → isError true', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 15,
        method: 'tools/call',
        params: { name: 'get_room_detail', arguments: { room_id: '00000000-0000-0000-0000-000000000000' } },
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().result.isError).toBe(true)
    await app.close()
  })

  it('tools/call get_placements known room → placements array', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 16,
        method: 'tools/call',
        params: { name: 'get_placements', arguments: { room_id: roomId } },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.count).toBe(1)
    expect(data.placements[0].id).toBe(placementId)
    await app.close()
  })

  // ── tools/call – get_quote / search_contacts ─────────────────────────────

  it('tools/call get_quote → latest quote with items', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 17,
        method: 'tools/call',
        params: { name: 'get_quote', arguments: { project_id: projectId } },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.id).toBe(quoteId)
    expect(Array.isArray(data.items)).toBe(true)
    expect(data.items.length).toBeGreaterThan(0)
    await app.close()
  })

  it('tools/call search_contacts with query → filtered contacts', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 18,
        method: 'tools/call',
        params: { name: 'search_contacts', arguments: { query: 'max', tenant_id: tenantId, limit: 5 } },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(Array.isArray(data.contacts)).toBe(true)
    expect(data.count).toBe(1)
    expect(data.contacts[0].email).toBe('max@example.com')
    await app.close()
  })

  // ── tools/call – write tools ─────────────────────────────────────────────

  it('tools/call create_project → returns project_id', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 19,
        method: 'tools/call',
        params: {
          name: 'create_project',
          arguments: { name: 'Neues Projekt', tenant_id: tenantId, description: 'Test' },
        },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.project_id).toBeDefined()
    expect(data.status).toBe('lead')
    await app.close()
  })

  it('tools/call update_project_status invalid status → isError true', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 20,
        method: 'tools/call',
        params: {
          name: 'update_project_status',
          arguments: { project_id: projectId, status: 'invalid-status' },
        },
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().result.isError).toBe(true)
    await app.close()
  })

  it('tools/call add_placement → returns placement_id', async () => {
    prismaMock.room.findUnique.mockResolvedValueOnce({ id: roomId, placements: [] })
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 21,
        method: 'tools/call',
        params: {
          name: 'add_placement',
          arguments: { room_id: roomId, article_id: articleId, wall_id: 'w1', offset_mm: 1500 },
        },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(typeof data.placement_id).toBe('string')
    await app.close()
  })

  it('tools/call remove_placement → removed key returned', async () => {
    prismaMock.room.findMany.mockResolvedValueOnce([
      {
        id: roomId,
        placements: [{ id: placementId, wall_id: 'w1', offset_mm: 10 }],
      },
    ])

    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 22,
        method: 'tools/call',
        params: {
          name: 'remove_placement',
          arguments: { placement_id: placementId },
        },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.removed).toBe(placementId)
    await app.close()
  })

  it('tools/call create_quote_from_bom → returns quote_id and lines', async () => {
    prismaMock.quote.findFirst.mockResolvedValueOnce({ version: 2 })
    prismaMock.quote.create.mockResolvedValueOnce({
      id: quoteId,
      version: 3,
      items: [{ id: 'q1' }, { id: 'q2' }],
    })

    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 23,
        method: 'tools/call',
        params: {
          name: 'create_quote_from_bom',
          arguments: { project_id: projectId, valid_days: 30, free_text: 'Vielen Dank' },
        },
      },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.json().result.content[0].text)
    expect(data.quote_id).toBe(quoteId)
    expect(data.lines).toBe(2)
    await app.close()
  })

  // ── tools/call – unknown tool ─────────────────────────────────────────────

  it('tools/call unknown tool name → 400 method not found', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/mcp',
      payload: {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: { name: 'does_not_exist', arguments: {} },
      },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe(-32601)
    await app.close()
  })
})

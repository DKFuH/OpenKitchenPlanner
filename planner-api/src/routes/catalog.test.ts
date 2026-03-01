import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const itemId = '11111111-1111-1111-1111-111111111111'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    catalogItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { catalogRoutes } from './catalog.js'

function createCatalogItem(overrides: Record<string, unknown> = {}) {
  return {
    id: itemId,
    sku: 'US-600',
    name: 'Unterschrank 600',
    type: 'base_cabinet',
    width_mm: 600,
    height_mm: 720,
    depth_mm: 560,
    list_price_net: 1000,
    dealer_price_net: 700,
    default_markup_pct: 25,
    tax_group_id: 'tax-standard',
    pricing_group_id: 'pricing-kitchen',
    created_at: new Date('2026-03-01T10:00:00.000Z'),
    updated_at: new Date('2026-03-01T10:00:00.000Z'),
    ...overrides,
  }
}

describe('catalogRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists catalog items with query filters', async () => {
    prismaMock.catalogItem.findMany.mockResolvedValue([createCatalogItem()])

    const app = Fastify()
    await app.register(catalogRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/catalog/items?type=base_cabinet&q=unterschrank&limit=5&offset=10',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
    expect(prismaMock.catalogItem.findMany).toHaveBeenCalledWith({
      where: {
        type: 'base_cabinet',
        OR: [
          { name: { contains: 'unterschrank', mode: 'insensitive' } },
          { sku: { contains: 'unterschrank', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 5,
      skip: 10,
      select: {
        id: true,
        sku: true,
        name: true,
        type: true,
        width_mm: true,
        height_mm: true,
        depth_mm: true,
        list_price_net: true,
        dealer_price_net: true,
        default_markup_pct: true,
        tax_group_id: true,
        pricing_group_id: true,
      },
    })

    await app.close()
  })

  it('returns a single catalog item by id', async () => {
    prismaMock.catalogItem.findUnique.mockResolvedValue(createCatalogItem())

    const app = Fastify()
    await app.register(catalogRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/catalog/items/${itemId}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      id: itemId,
      sku: 'US-600',
      name: 'Unterschrank 600',
    })

    await app.close()
  })

  it('returns 404 for unknown catalog items', async () => {
    prismaMock.catalogItem.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(catalogRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/catalog/items/${itemId}`,
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({
      error: 'NOT_FOUND',
      message: 'Catalog item not found',
    })

    await app.close()
  })

  it('suggests catalog mappings for skp cabinet and appliance components', async () => {
    prismaMock.catalogItem.findMany.mockResolvedValue([
      createCatalogItem(),
      createCatalogItem({
        id: '22222222-2222-2222-2222-222222222222',
        sku: 'GS-60',
        name: 'Geschirrspueler 600',
        type: 'appliance',
        width_mm: 600,
        height_mm: 820,
        depth_mm: 560,
      }),
      createCatalogItem({
        id: '33333333-3333-3333-3333-333333333333',
        sku: 'HS-600',
        name: 'Hochschrank 600',
        type: 'tall_cabinet',
        width_mm: 600,
        height_mm: 2100,
        depth_mm: 600,
      }),
    ])

    const app = Fastify()
    await app.register(catalogRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog/skp-mapping',
      payload: {
        candidate_limit: 2,
        components: [
          {
            id: 'component-1',
            skp_component_name: 'US_60',
            dimensions: {
              width_mm: 600,
              height_mm: 720,
              depth_mm: 560,
            },
          },
          {
            id: 'component-2',
            skp_component_name: 'Geschirrspueler 60',
            dimensions: {
              width_mm: 600,
              height_mm: 820,
              depth_mm: 560,
            },
          },
        ],
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      mappings: [
        expect.objectContaining({
          component_id: 'component-1',
          target_type: 'cabinet',
          catalog_item_id: itemId,
          needs_review: false,
        }),
        expect.objectContaining({
          component_id: 'component-2',
          target_type: 'appliance',
          catalog_item_id: '22222222-2222-2222-2222-222222222222',
          needs_review: false,
        }),
      ],
    })
    expect(prismaMock.catalogItem.findMany).toHaveBeenCalledWith({
      where: { type: { in: ['base_cabinet', 'wall_cabinet', 'tall_cabinet', 'appliance'] } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        sku: true,
        name: true,
        type: true,
        width_mm: true,
        height_mm: true,
        depth_mm: true,
        list_price_net: true,
        dealer_price_net: true,
        default_markup_pct: true,
        tax_group_id: true,
        pricing_group_id: true,
      },
    })

    await app.close()
  })

  it('marks reference objects for manual review and preserves explicit ignored mappings', async () => {
    prismaMock.catalogItem.findMany.mockResolvedValue([])

    const app = Fastify()
    await app.register(catalogRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog/skp-mapping',
      payload: {
        components: [
          {
            id: 'component-3',
            skp_component_name: 'Dekoration',
          },
          {
            id: 'component-4',
            skp_component_name: 'Freies Objekt',
            mapping: {
              target_type: 'ignored',
              label: 'Ignorieren',
            },
          },
        ],
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      mappings: [
        expect.objectContaining({
          component_id: 'component-3',
          target_type: 'reference_object',
          catalog_item_id: null,
          needs_review: true,
        }),
        expect.objectContaining({
          component_id: 'component-4',
          target_type: 'ignored',
          catalog_item_id: null,
          needs_review: false,
          label: 'Ignorieren',
        }),
      ],
    })
    expect(prismaMock.catalogItem.findMany).not.toHaveBeenCalled()

    await app.close()
  })

  it('rejects malformed skp mapping payloads', async () => {
    const app = Fastify()
    await app.register(catalogRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog/skp-mapping',
      payload: {
        components: [],
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      error: 'BAD_REQUEST',
    })

    await app.close()
  })
})

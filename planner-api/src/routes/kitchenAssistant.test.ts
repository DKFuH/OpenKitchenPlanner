import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const roomId = 'room-1'
const articleId = 'article-1'
const macroId = 'macro-1'
const suggestionId = 'suggestion-1'

const ROOM_WITH_WALLS = {
  id: roomId,
  project_id: 'project-1',
  name: 'Küche',
  ceiling_height_mm: 2600,
  placements: [],
  boundary: {
    wall_segments: [
      { id: 'w1', x0_mm: 0, y0_mm: 0, x1_mm: 4200, y1_mm: 0 },
      { id: 'w2', x0_mm: 4200, y0_mm: 0, x1_mm: 4200, y1_mm: 3600 },
      { id: 'w3', x0_mm: 4200, y0_mm: 3600, x1_mm: 0, y1_mm: 3600 },
      { id: 'w4', x0_mm: 0, y0_mm: 3600, x1_mm: 0, y1_mm: 0 },
    ],
  },
}

const ROOM_NO_WALLS = {
  ...ROOM_WITH_WALLS,
  boundary: { wall_segments: [] },
}

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    catalogArticle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    catalogMacro: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    room: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    kitchenLayoutSuggestion: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { kitchenAssistantRoutes } from './kitchenAssistant.js'

async function createApp() {
  const app = Fastify()
  await app.register(kitchenAssistantRoutes, { prefix: '/api/v1' })
  return app
}

describe('kitchenAssistantRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.catalogArticle.findMany.mockImplementation(async (args: any) => {
      // Hierarchy calls use distinct – detect by distinct field
      if (Array.isArray(args.distinct)) {
        if (args.distinct.includes('collection')) return [{ collection: 'Luca' }]
        if (args.distinct.includes('family')) return [{ family: 'Classic' }]
        if (args.distinct.includes('style_tag')) return [{ style_tag: 'Modern' }]
      }

      if (args.where?.is_favorite === true) {
        return [{ id: articleId, sku: 'US-60', name: 'Unterschrank 60', is_favorite: true }]
      }

      return [{ id: articleId, sku: 'US-60', name: 'Unterschrank 60' }]
    })

    prismaMock.catalogArticle.count.mockResolvedValue(1)
    prismaMock.catalogArticle.findUnique.mockResolvedValue({ id: articleId, is_favorite: false })
    prismaMock.catalogArticle.update.mockResolvedValue({ id: articleId, is_favorite: true })

    prismaMock.catalogMacro.create.mockResolvedValue({ id: macroId, name: 'Starter' })
    prismaMock.catalogMacro.findMany.mockResolvedValue([{ id: macroId, name: 'Starter' }])
    prismaMock.catalogMacro.findUnique.mockResolvedValue({ id: macroId, name: 'Starter' })
    prismaMock.catalogMacro.delete.mockResolvedValue({ id: macroId })

    prismaMock.room.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === roomId) return ROOM_WITH_WALLS
      if (where.id === 'room-no-walls') return ROOM_NO_WALLS
      return null
    })
    prismaMock.room.update.mockResolvedValue({ id: roomId })

    prismaMock.kitchenLayoutSuggestion.create.mockResolvedValue({
      id: suggestionId,
      room_id: roomId,
      score: 0.8,
      applied: false,
      positions: [{ wall_id: 'w1', offset_mm: 0, article_id: 'placeholder-unterschrank-60', width_mm: 600, depth_mm: 600, height_mm: 720 }],
    })
    prismaMock.kitchenLayoutSuggestion.findMany.mockResolvedValue([{ id: suggestionId, score: 0.8 }])
    prismaMock.kitchenLayoutSuggestion.findUnique.mockResolvedValue({
      id: suggestionId,
      room_id: roomId,
      applied: false,
      positions: [{ wall_id: 'w1', offset_mm: 0, article_id: 'placeholder-unterschrank-60', width_mm: 600, depth_mm: 600, height_mm: 720 }],
    })
    prismaMock.kitchenLayoutSuggestion.update.mockResolvedValue({ id: suggestionId, applied: true })
  })

  it('GET /catalog/hierarchy returns hierarchy arrays', async () => {
    const app = await createApp()
    const response = await app.inject({ method: 'GET', url: '/api/v1/catalog/hierarchy' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ collections: ['Luca'], families: ['Classic'], style_tags: ['Modern'] })
    await app.close()
  })

  it('GET /catalog/articles?search=Unterschrank returns paged payload', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'GET', url: '/api/v1/catalog/articles?search=Unterschrank' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ total: 1, articles: [{ id: articleId }] })
    await app.close()
  })

  it('GET /catalog/articles?only_favorites=true returns favorites only', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'GET', url: '/api/v1/catalog/articles?only_favorites=true' })

    expect(response.statusCode).toBe(200)
    expect(response.json().articles.every((entry: { is_favorite: boolean }) => entry.is_favorite)).toBe(true)
    await app.close()
  })

  it('GET /catalog/articles?collection=Luca&limit=10 respects limit', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'GET', url: '/api/v1/catalog/articles?collection=Luca&limit=10' })

    expect(response.statusCode).toBe(200)
    expect(response.json().articles.length).toBeLessThanOrEqual(10)
    await app.close()
  })

  it('PATCH /catalog/articles/:id/favorite updates favorite', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/catalog/articles/${articleId}/favorite`,
      payload: { is_favorite: true },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: articleId, is_favorite: true })
    await app.close()
  })

  it('PATCH /catalog/articles/unknown/favorite returns 404', async () => {
    const app = await createApp()
    prismaMock.catalogArticle.findUnique.mockResolvedValueOnce(null)

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/catalog/articles/unknown/favorite',
      payload: { is_favorite: true },
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it('POST /catalog-macros with valid payload returns 201', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog-macros',
      payload: {
        name: 'Zeile 1',
        positions: [{ wall_id: 'w1', offset_mm: 0, article_id: 'a-1', width_mm: 600, depth_mm: 600, height_mm: 720 }],
        created_by: 'tester',
      },
    })

    expect(response.statusCode).toBe(201)
    await app.close()
  })

  it('POST /catalog-macros with empty positions returns 400', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog-macros',
      payload: { name: 'Invalid', positions: [], created_by: 'tester' },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('GET /catalog-macros returns array', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'GET', url: '/api/v1/catalog-macros' })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json())).toBe(true)
    await app.close()
  })

  it('DELETE /catalog-macros/:id returns 204', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'DELETE', url: `/api/v1/catalog-macros/${macroId}` })

    expect(response.statusCode).toBe(204)
    await app.close()
  })

  it('POST /rooms/:id/suggest-layout with wall segments returns suggestions', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'POST', url: `/api/v1/rooms/${roomId}/suggest-layout` })

    expect(response.statusCode).toBe(201)
    expect(response.json().suggestions.length).toBeGreaterThanOrEqual(1)
    await app.close()
  })

  it('POST /rooms/:id/suggest-layout without wall segments returns 400', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'POST', url: '/api/v1/rooms/room-no-walls/suggest-layout' })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('POST /kitchen-layout-suggestions/:id/apply returns applied=true', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'POST', url: `/api/v1/kitchen-layout-suggestions/${suggestionId}/apply` })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ applied: true })
    await app.close()
  })

  it('POST /kitchen-layout-suggestions/:id/apply twice returns 400', async () => {
    const app = await createApp()

    prismaMock.kitchenLayoutSuggestion.findUnique
      .mockResolvedValueOnce({
        id: suggestionId,
        room_id: roomId,
        applied: false,
        positions: [{ wall_id: 'w1', offset_mm: 0, article_id: 'a1', width_mm: 600, depth_mm: 600, height_mm: 720 }],
      })
      .mockResolvedValueOnce({
        id: suggestionId,
        room_id: roomId,
        applied: true,
        positions: [{ wall_id: 'w1', offset_mm: 0, article_id: 'a1', width_mm: 600, depth_mm: 600, height_mm: 720 }],
      })

    const first = await app.inject({ method: 'POST', url: `/api/v1/kitchen-layout-suggestions/${suggestionId}/apply` })
    const second = await app.inject({ method: 'POST', url: `/api/v1/kitchen-layout-suggestions/${suggestionId}/apply` })

    expect(first.statusCode).toBe(200)
    expect(second.statusCode).toBe(400)
    await app.close()
  })
})

import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tenantId = 'tenant-a'
const folderId = '11111111-1111-4111-8111-111111111111'
const savedFilterId = '22222222-2222-4222-8222-222222222222'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    assetLibraryItem: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    libraryFolder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    librarySavedFilter: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({ prisma: prismaMock }))

import { assetLibraryRoutes } from './assetLibrary.js'

function assetFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'asset-1',
    tenant_id: tenantId,
    name: 'Test Asset',
    category: 'custom',
    favorite: false,
    folder_id: null,
    collection: null,
    source_format: 'obj',
    file_url: 'asset://tenant/tenant-a/test',
    preview_url: null,
    bbox_json: { width_mm: 600, height_mm: 720, depth_mm: 560 },
    default_scale_json: { factor_to_mm: 1000, axis_scale: { x: 1, y: 1, z: 1 }, source_unit: 'm' },
    tags_json: ['korpus'],
    created_at: '2026-03-04T09:00:00.000Z',
    updated_at: '2026-03-04T09:00:00.000Z',
    ...overrides,
  }
}

function folderFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: folderId,
    tenant_id: tenantId,
    kind: 'asset',
    name: 'Favoriten',
    parent_id: null,
    created_at: '2026-03-04T09:00:00.000Z',
    updated_at: '2026-03-04T09:00:00.000Z',
    ...overrides,
  }
}

function savedFilterFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: savedFilterId,
    tenant_id: tenantId,
    kind: 'asset',
    name: 'Nur Favoriten',
    saved_filter_json: {
      favorite_only: true,
      sort: 'favorites',
    },
    created_at: '2026-03-04T09:00:00.000Z',
    updated_at: '2026-03-04T09:00:00.000Z',
    ...overrides,
  }
}

async function createApp() {
  const app = Fastify()
  app.decorateRequest('tenantId', null)
  app.decorateRequest('branchId', null)
  app.addHook('preHandler', async (request) => {
    request.tenantId = tenantId
  })
  await app.register(assetLibraryRoutes, { prefix: '/api/v1' })
  return app
}

describe('assetLibraryRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.assetLibraryItem.findMany.mockResolvedValue([assetFixture()])
    prismaMock.assetLibraryItem.findUnique.mockResolvedValue(assetFixture())
    prismaMock.assetLibraryItem.count.mockResolvedValue(0)
    prismaMock.assetLibraryItem.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => assetFixture(data))
    prismaMock.assetLibraryItem.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => assetFixture(data))
    prismaMock.assetLibraryItem.delete.mockResolvedValue(assetFixture())
    prismaMock.libraryFolder.findMany.mockResolvedValue([folderFixture()])
    prismaMock.libraryFolder.findUnique.mockResolvedValue(folderFixture())
    prismaMock.libraryFolder.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => folderFixture(data))
    prismaMock.libraryFolder.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => folderFixture(data))
    prismaMock.libraryFolder.delete.mockResolvedValue(folderFixture())
    prismaMock.libraryFolder.count.mockResolvedValue(0)
    prismaMock.librarySavedFilter.findMany.mockResolvedValue([savedFilterFixture()])
    prismaMock.librarySavedFilter.findUnique.mockResolvedValue(savedFilterFixture())
    prismaMock.librarySavedFilter.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => savedFilterFixture(data))
    prismaMock.librarySavedFilter.delete.mockResolvedValue(savedFilterFixture())
  })

  it('GET /tenant/assets lists tenant assets', async () => {
    const app = await createApp()

    const res = await app.inject({ method: 'GET', url: '/api/v1/tenant/assets' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
    expect(prismaMock.assetLibraryItem.findMany).toHaveBeenCalled()
    await app.close()
  })

  it('GET /tenant/assets applies S89 filter fields and sort', async () => {
    const app = await createApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tenant/assets?favorite_only=true&folder_id=${folderId}&collection=Core&sort=favorites`,
    })

    expect(res.statusCode).toBe(200)
    expect(prismaMock.assetLibraryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenant_id: tenantId,
          favorite: true,
          folder_id: folderId,
          collection: 'Core',
        }),
        orderBy: [{ favorite: 'desc' }, { updated_at: 'desc' }],
      }),
    )
    await app.close()
  })

  it('POST /tenant/assets/import imports OBJ and stores metadata', async () => {
    const app = await createApp()

    const obj = ['v 0 0 0', 'v 0.6 0 0', 'v 0 0.72 0', 'v 0 0 0.56'].join('\n')
    const payload = {
      file_name: 'unterschrank.obj',
      file_base64: Buffer.from(obj, 'utf-8').toString('base64'),
      category: 'base',
      tags: ['Korpus', 'MDF'],
    }

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tenant/assets/import',
      payload,
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({
      source_format: 'obj',
      category: 'base',
      bbox_json: { width_mm: 600, height_mm: 720, depth_mm: 560 },
    })
    await app.close()
  })

  it('POST /tenant/assets/import returns 400 for unsupported format', async () => {
    const app = await createApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tenant/assets/import',
      payload: {
        file_name: 'asset.glb',
        file_base64: Buffer.from('binary', 'utf-8').toString('base64'),
        category: 'custom',
        tags: [],
      },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('PATCH /tenant/assets/:id enforces tenant ownership', async () => {
    prismaMock.assetLibraryItem.findUnique.mockResolvedValue(assetFixture({ tenant_id: 'other-tenant' }))

    const app = await createApp()
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tenant/assets/asset-1',
      payload: { name: 'Neu' },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('PATCH /tenant/assets/:id updates favorite and folder fields', async () => {
    const app = await createApp()

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tenant/assets/asset-1',
      payload: {
        favorite: true,
        folder_id: folderId,
        collection: 'Küchenwand',
      },
    })

    expect(res.statusCode).toBe(200)
    expect(prismaMock.assetLibraryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          favorite: true,
          folder_id: folderId,
          collection: 'Küchenwand',
        }),
      }),
    )
    await app.close()
  })

  it('GET /tenant/assets/folders lists folders by kind', async () => {
    const app = await createApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/tenant/assets/folders' })

    expect(res.statusCode).toBe(200)
    expect(prismaMock.libraryFolder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenant_id: tenantId, kind: 'asset' }),
      }),
    )
    await app.close()
  })

  it('POST /tenant/assets/folders creates a tenant folder', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tenant/assets/folders',
      payload: { name: 'Neu' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ name: 'Neu', kind: 'asset' })
    await app.close()
  })

  it('DELETE /tenant/assets/folders/:id rejects non-empty folders', async () => {
    prismaMock.assetLibraryItem.count.mockResolvedValueOnce(1)

    const app = await createApp()
    const res = await app.inject({ method: 'DELETE', url: `/api/v1/tenant/assets/folders/${folderId}` })

    expect(res.statusCode).toBe(400)
    expect(prismaMock.libraryFolder.delete).not.toHaveBeenCalled()
    await app.close()
  })

  it('GET /tenant/assets/saved-filters lists saved filters', async () => {
    const app = await createApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/tenant/assets/saved-filters' })

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json())).toBe(true)
    await app.close()
  })

  it('POST /tenant/assets/saved-filters stores filter json', async () => {
    const app = await createApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tenant/assets/saved-filters',
      payload: {
        name: 'Decor Favoriten',
        saved_filter_json: { category: 'decor', favorite_only: true },
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ name: 'Decor Favoriten', kind: 'asset' })
    await app.close()
  })

  it('DELETE /tenant/assets/:id deletes existing tenant asset', async () => {
    const app = await createApp()

    const res = await app.inject({ method: 'DELETE', url: '/api/v1/tenant/assets/asset-1' })

    expect(res.statusCode).toBe(204)
    expect(prismaMock.assetLibraryItem.delete).toHaveBeenCalledWith({ where: { id: 'asset-1' } })
    await app.close()
  })
})

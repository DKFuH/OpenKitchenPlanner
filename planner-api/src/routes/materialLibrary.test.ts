import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TENANT_ID = 'tenant-a'
const MATERIAL_ID = '33333333-3333-4333-8333-333333333333'
const FOLDER_ID = '44444444-4444-4444-8444-444444444444'
const SAVED_FILTER_ID = '55555555-5555-4555-8555-555555555555'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    materialLibraryItem: {
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
    project: {
      findUnique: vi.fn(),
    },
    room: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { materialLibraryRoutes } from './materialLibrary.js'

function materialFixture(overrides?: Record<string, unknown>) {
  return {
    id: MATERIAL_ID,
    tenant_id: TENANT_ID,
    name: 'Eiche Natur',
    category: 'front',
    texture_url: 'https://cdn.example/materials/oak.jpg',
    preview_url: null,
    scale_x_mm: 800,
    scale_y_mm: 800,
    rotation_deg: 0,
    roughness: 0.45,
    metallic: 0.02,
    favorite: false,
    folder_id: null,
    collection: null,
    config_json: {},
    created_at: '2026-03-04T12:00:00.000Z',
    updated_at: '2026-03-04T12:00:00.000Z',
    ...overrides,
  }
}

function folderFixture(overrides?: Record<string, unknown>) {
  return {
    id: FOLDER_ID,
    tenant_id: TENANT_ID,
    kind: 'material',
    name: 'Standard',
    parent_id: null,
    created_at: '2026-03-04T12:00:00.000Z',
    updated_at: '2026-03-04T12:00:00.000Z',
    ...overrides,
  }
}

function savedFilterFixture(overrides?: Record<string, unknown>) {
  return {
    id: SAVED_FILTER_ID,
    tenant_id: TENANT_ID,
    kind: 'material',
    name: 'Front Favoriten',
    saved_filter_json: {
      category: 'front',
      favorite_only: true,
    },
    created_at: '2026-03-04T12:00:00.000Z',
    updated_at: '2026-03-04T12:00:00.000Z',
    ...overrides,
  }
}

function roomFixture(overrides?: Record<string, unknown>) {
  return {
    id: 'room-a',
    project_id: 'project-a',
    coloring: {
      surfaces: [
        { surface: 'floor', color_hex: '#334155' },
      ],
    },
    placements: [
      {
        id: 'placement-a',
        catalog_item_id: 'catalog-a',
        wall_id: 'wall-a',
        offset_mm: 100,
        width_mm: 600,
        depth_mm: 560,
        height_mm: 720,
      },
    ],
    ...overrides,
  }
}

async function createApp() {
  const app = Fastify()
  app.decorateRequest('tenantId', null)
  app.decorateRequest('branchId', null)
  app.addHook('preHandler', async (request) => {
    request.tenantId = TENANT_ID
  })
  await app.register(materialLibraryRoutes, { prefix: '/api/v1' })
  return app
}

describe('materialLibraryRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.materialLibraryItem.findMany.mockResolvedValue([materialFixture()])
    prismaMock.materialLibraryItem.findUnique.mockResolvedValue(materialFixture())
    prismaMock.materialLibraryItem.count.mockResolvedValue(0)
    prismaMock.materialLibraryItem.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      materialFixture(data),
    )
    prismaMock.materialLibraryItem.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      materialFixture(data),
    )
    prismaMock.materialLibraryItem.delete.mockResolvedValue(materialFixture())
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
    prismaMock.project.findUnique.mockResolvedValue({ id: 'project-a', tenant_id: TENANT_ID })
    prismaMock.room.findUnique.mockResolvedValue(roomFixture())
    prismaMock.room.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'room-a',
      coloring: data.coloring,
      placements: data.placements,
    }))
  })

  it('GET /tenant/materials lists materials for tenant', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'GET', url: '/api/v1/tenant/materials' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
    expect(prismaMock.materialLibraryItem.findMany).toHaveBeenCalled()
    await app.close()
  })

  it('GET /tenant/materials applies S89 query filters and sorting', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/tenant/materials?favorite_only=true&folder_id=${FOLDER_ID}&collection=Core&sort=name`,
    })

    expect(response.statusCode).toBe(200)
    expect(prismaMock.materialLibraryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenant_id: TENANT_ID,
          favorite: true,
          folder_id: FOLDER_ID,
          collection: 'Core',
        }),
        orderBy: [{ name: 'asc' }, { updated_at: 'desc' }],
      }),
    )
    await app.close()
  })

  it('POST /tenant/materials creates a material item', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/tenant/materials',
      payload: {
        name: 'Beton Hell',
        category: 'floor',
        texture_url: 'https://cdn.example/materials/concrete.jpg',
        roughness: 0.9,
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({
      name: 'Beton Hell',
      category: 'floor',
    })
    await app.close()
  })

  it('PATCH /tenant/materials/:id enforces tenant ownership', async () => {
    prismaMock.materialLibraryItem.findUnique.mockResolvedValue(materialFixture({ tenant_id: 'tenant-b' }))

    const app = await createApp()
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/tenant/materials/${MATERIAL_ID}`,
      payload: {
        name: 'Nicht erlaubt',
      },
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it('PATCH /tenant/materials/:id updates favorite and folder metadata', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/tenant/materials/${MATERIAL_ID}`,
      payload: {
        favorite: true,
        folder_id: FOLDER_ID,
        collection: 'Musterwand',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(prismaMock.materialLibraryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          favorite: true,
          folder_id: FOLDER_ID,
          collection: 'Musterwand',
        }),
      }),
    )
    await app.close()
  })

  it('DELETE /tenant/materials/:id deletes existing tenant item', async () => {
    const app = await createApp()

    const response = await app.inject({ method: 'DELETE', url: `/api/v1/tenant/materials/${MATERIAL_ID}` })

    expect(response.statusCode).toBe(204)
    expect(prismaMock.materialLibraryItem.delete).toHaveBeenCalledWith({ where: { id: MATERIAL_ID } })
    await app.close()
  })

  it('GET /tenant/materials/folders lists material folders', async () => {
    const app = await createApp()
    const response = await app.inject({ method: 'GET', url: '/api/v1/tenant/materials/folders' })

    expect(response.statusCode).toBe(200)
    expect(prismaMock.libraryFolder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenant_id: TENANT_ID, kind: 'material' }),
      }),
    )
    await app.close()
  })

  it('DELETE /tenant/materials/folders/:id rejects non-empty folder', async () => {
    prismaMock.materialLibraryItem.count.mockResolvedValueOnce(2)

    const app = await createApp()
    const response = await app.inject({ method: 'DELETE', url: `/api/v1/tenant/materials/folders/${FOLDER_ID}` })

    expect(response.statusCode).toBe(400)
    expect(prismaMock.libraryFolder.delete).not.toHaveBeenCalled()
    await app.close()
  })

  it('POST /tenant/materials/saved-filters stores saved filter definition', async () => {
    const app = await createApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/tenant/materials/saved-filters',
      payload: {
        name: 'Fronts + Favoriten',
        saved_filter_json: {
          category: 'front',
          favorite_only: true,
          sort: 'favorites',
        },
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ name: 'Fronts + Favoriten', kind: 'material' })
    await app.close()
  })

  it('POST /projects/:id/material-assignments updates surface and placement assignments', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/11111111-1111-1111-1111-111111111111/material-assignments',
      payload: {
        room_id: '22222222-2222-2222-2222-222222222222',
        surface_assignments: [
          {
            surface: 'floor',
            material_item_id: MATERIAL_ID,
            uv_scale: { x: 1.2, y: 1.1 },
          },
        ],
        placement_assignments: [
          {
            placement_id: 'placement-a',
            target_kind: 'placement',
            material_item_id: MATERIAL_ID,
            rotation_deg: 25,
          },
        ],
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = response.json()
    expect(payload.room_id).toBe('room-a')
    expect(payload.resolved.surfaces).toHaveLength(1)
    expect(payload.resolved.placements).toHaveLength(1)
    expect(prismaMock.room.update).toHaveBeenCalledTimes(1)
    await app.close()
  })

  it('POST /projects/:id/material-assignments rejects unknown material ids', async () => {
    prismaMock.materialLibraryItem.findMany.mockResolvedValue([])

    const app = await createApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/11111111-1111-1111-1111-111111111111/material-assignments',
      payload: {
        room_id: '22222222-2222-2222-2222-222222222222',
        surface_assignments: [{ surface: 'floor', material_item_id: '44444444-4444-4444-8444-444444444444' }],
      },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('POST /projects/:id/material-assignments rejects rooms outside project scope', async () => {
    prismaMock.room.findUnique.mockResolvedValue(roomFixture({ project_id: 'project-b' }))

    const app = await createApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/11111111-1111-1111-1111-111111111111/material-assignments',
      payload: {
        room_id: '22222222-2222-2222-2222-222222222222',
        placement_assignments: [{ placement_id: 'placement-a', material_item_id: MATERIAL_ID }],
      },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })
})

import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tenantId = '00000000-0000-0000-0000-000000000001'
const projectId = '11111111-1111-1111-1111-111111111111'
const groupId = '22222222-2222-2222-2222-222222222222'
const roomId = '33333333-3333-3333-3333-333333333333'
const placementId = 'pl-1'
const openingId = 'op-1'
const dimensionId = '44444444-4444-4444-4444-444444444444'
const centerlineId = '55555555-5555-5555-5555-555555555555'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findUnique: vi.fn(),
    },
    drawingGroup: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    room: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dimension: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    centerline: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({ prisma: prismaMock }))

import { tenantMiddleware } from '../tenantMiddleware.js'
import { drawingGroupsRoutes } from './drawingGroups.js'

function buildGroup() {
  return {
    id: groupId,
    tenant_id: tenantId,
    project_id: projectId,
    name: 'Testgruppe',
    kind: 'drawing_group',
    members_json: [
      { entity_type: 'placement', entity_id: placementId, room_id: roomId },
      { entity_type: 'opening', entity_id: openingId, room_id: roomId },
      { entity_type: 'dimension', entity_id: dimensionId },
      { entity_type: 'centerline', entity_id: centerlineId },
    ],
    config_json: {},
    created_at: new Date('2026-03-05T00:00:00.000Z'),
    updated_at: new Date('2026-03-05T00:00:00.000Z'),
  }
}

async function createApp() {
  const app = Fastify()
  await app.register(tenantMiddleware)
  await app.register(drawingGroupsRoutes, { prefix: '/api/v1' })
  return app
}

describe('drawingGroupsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: tenantId })

    prismaMock.drawingGroup.findMany.mockResolvedValue([])
    prismaMock.drawingGroup.findUnique.mockResolvedValue(buildGroup())
    prismaMock.drawingGroup.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...buildGroup(),
      ...data,
    }))
    prismaMock.drawingGroup.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...buildGroup(),
      ...data,
    }))
    prismaMock.drawingGroup.delete.mockResolvedValue({ id: groupId })

    prismaMock.room.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id !== roomId) {
        return null
      }

      return {
        id: roomId,
        project_id: projectId,
        boundary: {
          vertices: [
            { id: 'v0', x_mm: 0, y_mm: 0 },
            { id: 'v1', x_mm: 5000, y_mm: 0 },
          ],
          wall_segments: [
            { id: 'wall-1', start_vertex_id: 'v0', end_vertex_id: 'v1' },
          ],
        },
        placements: [
          {
            id: placementId,
            wall_id: 'wall-1',
            offset_mm: 200,
            width_mm: 600,
            depth_mm: 560,
            height_mm: 720,
            locked: false,
          },
        ],
        openings: [
          {
            id: openingId,
            wall_id: 'wall-1',
            offset_mm: 300,
            width_mm: 900,
            height_mm: 2100,
            locked: false,
          },
        ],
      }
    })

    prismaMock.room.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
      id: where.id,
      ...data,
    }))

    prismaMock.dimension.findUnique.mockResolvedValue({
      id: dimensionId,
      room_id: roomId,
      locked: false,
      points: [
        { x_mm: 0, y_mm: 0 },
        { x_mm: 1000, y_mm: 0 },
      ],
    })
    prismaMock.dimension.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
      id: where.id,
      ...data,
    }))

    prismaMock.centerline.findUnique.mockResolvedValue({
      id: centerlineId,
      room_id: roomId,
      x0_mm: 100,
      y0_mm: 200,
      x1_mm: 300,
      y1_mm: 200,
    })
    prismaMock.centerline.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
      id: where.id,
      ...data,
    }))
  })

  it('lists drawing groups for a project', async () => {
    prismaMock.drawingGroup.findMany.mockResolvedValue([buildGroup()])

    const app = await createApp()
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/drawing-groups`,
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
    expect(prismaMock.drawingGroup.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenant_id: tenantId,
        project_id: projectId,
      }),
    }))

    await app.close()
  })

  it('creates a new drawing group', async () => {
    const app = await createApp()
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/drawing-groups`,
      headers: { 'x-tenant-id': tenantId },
      payload: {
        name: 'Auswahlset Küche',
        kind: 'selection_set',
        members_json: [
          { entity_type: 'placement', entity_id: placementId, room_id: roomId },
        ],
      },
    })

    expect(response.statusCode).toBe(201)
    expect(prismaMock.drawingGroup.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        tenant_id: tenantId,
        project_id: projectId,
        kind: 'selection_set',
      }),
    }))

    await app.close()
  })

  it('applies translate transform to members', async () => {
    const app = await createApp()
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/drawing-groups/${groupId}/apply-transform`,
      headers: { 'x-tenant-id': tenantId },
      payload: {
        translate: { x_mm: 120, y_mm: 0 },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      updated: {
        placements: 1,
        openings: 1,
        dimensions: 1,
        centerlines: 1,
      },
      blocked: false,
    })

    expect(prismaMock.dimension.update).toHaveBeenCalledWith({
      where: { id: dimensionId },
      data: {
        points: [
          { x_mm: 120, y_mm: 0 },
          { x_mm: 1120, y_mm: 0 },
        ],
      },
    })

    expect(prismaMock.centerline.update).toHaveBeenCalledWith({
      where: { id: centerlineId },
      data: {
        x0_mm: 220,
        y0_mm: 200,
        x1_mm: 420,
        y1_mm: 200,
      },
    })

    expect(prismaMock.room.update).toHaveBeenCalledTimes(1)
    const roomUpdatePayload = prismaMock.room.update.mock.calls[0][0].data
    expect(roomUpdatePayload.placements[0]).toMatchObject({ id: placementId, offset_mm: 320 })
    expect(roomUpdatePayload.openings[0]).toMatchObject({ id: openingId, offset_mm: 420 })

    await app.close()
  })

  it('syncs lock and visibility flags to members on patch', async () => {
    const app = await createApp()
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/drawing-groups/${groupId}`,
      headers: { 'x-tenant-id': tenantId },
      payload: {
        config_json: {
          locked: true,
          visible: false,
          lock_scope: 'safe_edit',
        },
        sync_members: true,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      member_sync: {
        updated: {
          placements: 1,
          openings: 1,
          dimensions: 1,
        },
      },
    })

    expect(prismaMock.dimension.update).toHaveBeenCalledWith({
      where: { id: dimensionId },
      data: {
        visible: false,
        locked: true,
        lock_scope: 'safe_edit',
      },
    })

    expect(prismaMock.room.update).toHaveBeenCalledTimes(1)
    const roomUpdatePayload = prismaMock.room.update.mock.calls[0][0].data
    expect(roomUpdatePayload.placements[0]).toMatchObject({
      id: placementId,
      visible: false,
      is_hidden: true,
      locked: true,
      lock_scope: 'safe_edit',
    })
    expect(roomUpdatePayload.openings[0]).toMatchObject({
      id: openingId,
      visible: false,
      is_hidden: true,
      locked: true,
      lock_scope: 'safe_edit',
    })

    await app.close()
  })

  it('returns 403 when tenant scope is missing', async () => {
    const app = await createApp()
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/drawing-groups`,
    })

    expect(response.statusCode).toBe(403)
    await app.close()
  })
})

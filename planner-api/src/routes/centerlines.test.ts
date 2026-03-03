import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const roomId = '11111111-1111-1111-1111-111111111111'
const centerlineId = '22222222-2222-2222-2222-222222222222'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    room: {
      findUnique: vi.fn(),
    },
    centerline: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { centerlineRoutes } from './centerlines.js'

const roomFixture = {
  id: roomId,
  boundary: {
    wall_segments: [
      { id: 'wall-1', x0_mm: 0, y0_mm: 0, x1_mm: 3000, y1_mm: 0 },
    ],
  },
  placements: [
    { id: 'pl-1', wall_id: 'wall-1', offset_mm: 300, width_mm: 600 },
  ],
}

function createCenterlineFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: centerlineId,
    room_id: roomId,
    label: null,
    x0_mm: 100,
    y0_mm: -100,
    x1_mm: 100,
    y1_mm: 100,
    style: { dash: [6, 3] },
    ref_type: null,
    ref_id: null,
    created_at: '2026-03-03T10:00:00.000Z',
    ...overrides,
  }
}

async function createApp() {
  const app = Fastify()
  await app.register(centerlineRoutes, { prefix: '/api/v1' })
  return app
}

describe('centerlineRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.room.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === roomId) return roomFixture
      return null
    })

    prismaMock.centerline.create.mockResolvedValue(createCenterlineFixture())
    prismaMock.centerline.findMany.mockResolvedValue([createCenterlineFixture()])
    prismaMock.centerline.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === centerlineId) return createCenterlineFixture()
      return null
    })
    prismaMock.centerline.delete.mockResolvedValue({ id: centerlineId })
  })

  it('POST /rooms/:id/centerlines returns 201', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/rooms/${roomId}/centerlines`,
      payload: {
        x0_mm: 10,
        y0_mm: 20,
        x1_mm: 30,
        y1_mm: 40,
        label: 'CL-1',
      },
    })

    expect(response.statusCode).toBe(201)
    await app.close()
  })

  it('GET /rooms/:id/centerlines returns array', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/rooms/${roomId}/centerlines`,
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json())).toBe(true)
    await app.close()
  })

  it('DELETE /centerlines/:id returns 204', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/centerlines/${centerlineId}`,
    })

    expect(response.statusCode).toBe(204)
    await app.close()
  })

  it('POST /rooms/:id/centerlines/from-placement returns 201', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/rooms/${roomId}/centerlines/from-placement`,
      payload: { placement_id: 'pl-1' },
    })

    expect(response.statusCode).toBe(201)
    expect(prismaMock.centerline.create).toHaveBeenCalled()
    await app.close()
  })
})

import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    room: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { ceilingConstraintRoutes } from './ceilingConstraints.js'

const roomId = '11111111-1111-1111-1111-111111111111'

function createConstraint(overrides: Record<string, unknown> = {}) {
  return {
    id: 'constraint-1',
    room_id: roomId,
    wall_id: 'wall-1',
    wall_start: { x_mm: 0, y_mm: 0 },
    wall_end: { x_mm: 4000, y_mm: 0 },
    kniestock_height_mm: 900,
    slope_angle_deg: 45,
    depth_into_room_mm: 2000,
    ...overrides,
  }
}

function createRoom(overrides: Record<string, unknown> = {}) {
  return {
    id: roomId,
    ceiling_height_mm: 2500,
    ceiling_constraints: [],
    ...overrides,
  }
}

describe('ceilingConstraintRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a ceiling constraint for a room', async () => {
    prismaMock.room.findUnique.mockResolvedValue(createRoom())
    prismaMock.room.update.mockResolvedValue({})

    const app = Fastify()
    await app.register(ceilingConstraintRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ceiling-constraints',
      payload: createConstraint(),
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual(expect.objectContaining({ wall_id: 'wall-1', room_id: roomId }))
    expect(prismaMock.room.update).toHaveBeenCalledTimes(1)

    await app.close()
  })

  it('updates an existing ceiling constraint', async () => {
    prismaMock.room.findUnique.mockResolvedValue(
      createRoom({
        ceiling_constraints: [createConstraint()],
      }),
    )
    prismaMock.room.update.mockResolvedValue({})

    const app = Fastify()
    await app.register(ceilingConstraintRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/ceiling-constraints/constraint-1',
      payload: {
        room_id: roomId,
        slope_angle_deg: 35,
        depth_into_room_mm: 1800,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: 'constraint-1',
        slope_angle_deg: 35,
        depth_into_room_mm: 1800,
      }),
    )

    await app.close()
  })

  it('returns available height for a room point', async () => {
    prismaMock.room.findUnique.mockResolvedValue(
      createRoom({
        ceiling_constraints: [createConstraint()],
      }),
    )

    const app = Fastify()
    await app.register(ceilingConstraintRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/rooms/${roomId}/available-height?x=1000&y=500`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      room_id: roomId,
      point: { x_mm: 1000, y_mm: 500 },
      available_height_mm: 1400,
    })

    await app.close()
  })
})

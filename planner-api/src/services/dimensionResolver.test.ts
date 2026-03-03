import { describe, expect, it, vi } from 'vitest'
import { refreshRoomDimensions, resolveRefPoint } from './dimensionResolver.js'

const roomId = '11111111-1111-1111-1111-111111111111'

function createDbMock() {
  return {
    room: {
      findMany: vi.fn(),
    },
    dimension: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  }
}

describe('dimensionResolver', () => {
  it('resolveRefPoint placement/start resolves offset on wall', async () => {
    const db = createDbMock()
    db.room.findMany.mockResolvedValue([
      {
        id: roomId,
        boundary: {
          wall_segments: [{ id: 'wall-1', x0_mm: 0, y0_mm: 0, x1_mm: 3000, y1_mm: 0 }],
        },
        placements: [{ id: 'pl-1', wall_id: 'wall-1', offset_mm: 1200, width_mm: 600 }],
        openings: [],
      },
    ])

    const point = await resolveRefPoint(db as any, 'placement', 'pl-1', 'start', roomId)
    expect(point).toEqual({ x_mm: 1200, y_mm: 0 })
  })

  it('resolveRefPoint wall/end returns wall endpoint', async () => {
    const db = createDbMock()
    db.room.findMany.mockResolvedValue([
      {
        id: roomId,
        boundary: {
          wall_segments: [{ id: 'wall-1', x0_mm: 10, y0_mm: 20, x1_mm: 3100, y1_mm: 40 }],
        },
        placements: [],
        openings: [],
      },
    ])

    const point = await resolveRefPoint(db as any, 'wall', 'wall-1', 'end', roomId)
    expect(point).toEqual({ x_mm: 3100, y_mm: 40 })
  })

  it('refreshRoomDimensions updates points when placement moved', async () => {
    const db = createDbMock()
    db.dimension.findMany.mockResolvedValue([
      {
        id: 'dim-1',
        room_id: roomId,
        auto_update: true,
        ref_a_type: 'placement',
        ref_a_id: 'pl-1',
        ref_b_type: 'wall',
        ref_b_id: 'wall-1',
        points: [{ x_mm: 10, y_mm: 0 }, { x_mm: 0, y_mm: 0 }],
      },
    ])
    db.room.findMany.mockResolvedValue([
      {
        id: roomId,
        boundary: {
          wall_segments: [{ id: 'wall-1', x0_mm: 0, y0_mm: 0, x1_mm: 3000, y1_mm: 0 }],
        },
        placements: [{ id: 'pl-1', wall_id: 'wall-1', offset_mm: 1200, width_mm: 600 }],
        openings: [],
      },
    ])

    const updated = await refreshRoomDimensions(db as any, roomId)

    expect(updated).toBe(1)
    expect(db.dimension.update).toHaveBeenCalledTimes(1)
  })

  it('refreshRoomDimensions returns 0 if points unchanged', async () => {
    const db = createDbMock()
    db.dimension.findMany.mockResolvedValue([
      {
        id: 'dim-1',
        room_id: roomId,
        auto_update: true,
        ref_a_type: 'placement',
        ref_a_id: 'pl-1',
        ref_b_type: 'wall',
        ref_b_id: 'wall-1',
        points: [{ x_mm: 1200, y_mm: 0 }, { x_mm: 3000, y_mm: 0 }],
      },
    ])
    db.room.findMany.mockResolvedValue([
      {
        id: roomId,
        boundary: {
          wall_segments: [{ id: 'wall-1', x0_mm: 0, y0_mm: 0, x1_mm: 3000, y1_mm: 0 }],
        },
        placements: [{ id: 'pl-1', wall_id: 'wall-1', offset_mm: 1200, width_mm: 600 }],
        openings: [],
      },
    ])

    const updated = await refreshRoomDimensions(db as any, roomId)

    expect(updated).toBe(0)
    expect(db.dimension.update).not.toHaveBeenCalled()
  })
})

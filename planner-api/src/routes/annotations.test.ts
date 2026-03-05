import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const roomId = '11111111-1111-1111-1111-111111111111'
const projectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const levelId = '22222222-2222-2222-2222-222222222222'
const sectionLineId = '33333333-3333-3333-3333-333333333333'
const wallIdA = '44444444-4444-4444-4444-444444444444'
const wallIdB = '55555555-5555-5555-5555-555555555555'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findUnique: vi.fn(),
    },
    room: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dimension: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { annotationRoutes } from './annotations.js'

async function createApp() {
  const app = Fastify()
  await app.register(annotationRoutes, { prefix: '/api/v1' })
  return app
}

describe('annotationRoutes section-lines', () => {
  let sectionLines: Array<Record<string, unknown>> = []
  let roomFixture: Record<string, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    sectionLines = [
      {
        id: sectionLineId,
        room_id: roomId,
        start: { x_mm: 0, y_mm: 0 },
        end: { x_mm: 1000, y_mm: 0 },
        label: 'S-A',
        level_scope: 'single_level',
        level_id: levelId,
        direction: 'both',
        view_config: {
          scale: 1,
          offset_x_mm: 0,
          offset_y_mm: 0,
          show_measurements: true,
          show_openings: true,
          show_placements: true,
        },
      },
    ]

    roomFixture = {
      id: roomId,
      project_id: projectId,
      ceiling_height_mm: 2500,
      section_lines: sectionLines,
      measure_lines: [],
      comments: [],
      boundary: {
        wall_segments: [
          { id: wallIdA, length_mm: 2400 },
          { id: wallIdB, length_mm: 1800 },
        ],
      },
      openings: [
        {
          id: '66666666-6666-6666-6666-666666666666',
          wall_id: wallIdA,
          offset_mm: 300,
          width_mm: 900,
          height_mm: 1200,
          sill_height_mm: 900,
        },
      ],
      placements: [
        {
          id: '77777777-7777-7777-7777-777777777777',
          wall_id: wallIdB,
          offset_mm: 200,
          width_mm: 600,
          height_mm: 720,
        },
      ],
    }

    prismaMock.room.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id !== roomId) return null
      return {
        ...roomFixture,
        section_lines: sectionLines,
      }
    })

    prismaMock.room.update.mockImplementation(async ({ data }: { data: { section_lines?: Array<Record<string, unknown>> } }) => {
      sectionLines = data.section_lines ?? sectionLines
      return {
        ...roomFixture,
        section_lines: sectionLines,
      }
    })

    prismaMock.project.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id !== projectId) return null
      return {
        id: projectId,
        rooms: [
          {
            id: roomId,
            name: 'Kueche',
            ceiling_height_mm: 2500,
            boundary: roomFixture.boundary,
          },
        ],
      }
    })

    prismaMock.dimension.findMany.mockResolvedValue([
      {
        id: '88888888-8888-8888-8888-888888888888',
        type: 'linear',
        label: '1200 mm',
        points: [
          { x_mm: 100, y_mm: 0 },
          { x_mm: 1300, y_mm: 0 },
        ],
      },
    ])
  })

  it('creates section line with extended metadata', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/rooms/${roomId}/section-lines`,
      payload: {
        id: '44444444-4444-4444-4444-444444444444',
        start: { x_mm: 0, y_mm: 500 },
        end: { x_mm: 2000, y_mm: 500 },
        label: 'S-B',
        level_scope: 'single_level',
        level_id: levelId,
        depth_mm: 1800,
        direction: 'left',
        sheet_visibility: 'sheet_only',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({
      id: '44444444-4444-4444-4444-444444444444',
      level_scope: 'single_level',
      level_id: levelId,
      depth_mm: 1800,
      direction: 'left',
      sheet_visibility: 'sheet_only',
      room_id: roomId,
    })

    await app.close()
  })

  it('rejects single_level payload without level_id', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/rooms/${roomId}/section-lines`,
      payload: {
        start: { x_mm: 0, y_mm: 100 },
        end: { x_mm: 2000, y_mm: 100 },
        level_scope: 'single_level',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: 'BAD_REQUEST' })

    await app.close()
  })

  it('updates existing section line and allows resetting level fields', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/rooms/${roomId}/section-lines/${sectionLineId}`,
      payload: {
        label: 'S-A-Updated',
        level_scope: 'room_level',
        level_id: null,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      id: sectionLineId,
      label: 'S-A-Updated',
      level_scope: 'room_level',
    })
    expect(response.json().level_id).toBeUndefined()

    await app.close()
  })

  it('deletes existing section line', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/rooms/${roomId}/section-lines/${sectionLineId}`,
    })

    expect(response.statusCode).toBe(204)
    expect(sectionLines).toHaveLength(0)

    await app.close()
  })

  it('creates section line via /sections alias with view_config', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/rooms/${roomId}/sections`,
      payload: {
        id: '99999999-9999-9999-9999-999999999999',
        start: { x_mm: 100, y_mm: 100 },
        end: { x_mm: 1000, y_mm: 100 },
        direction: 'both',
        level_scope: 'room_level',
        sheet_visibility: 'all',
        view_config: {
          scale: 1.2,
          offset_x_mm: 40,
          offset_y_mm: -15,
        },
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({
      id: '99999999-9999-9999-9999-999999999999',
      view_config: expect.objectContaining({
        scale: 1.2,
        offset_x_mm: 40,
        offset_y_mm: -15,
      }),
    })

    await app.close()
  })

  it('patches section line via /sections alias and merges view_config', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/rooms/${roomId}/sections/${sectionLineId}`,
      payload: {
        view_config: {
          scale: 1.5,
          show_openings: false,
        },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      id: sectionLineId,
      view_config: expect.objectContaining({
        scale: 1.5,
        show_openings: false,
        show_measurements: true,
      }),
    })

    await app.close()
  })

  it('returns project elevations list', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/elevations`,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.project_id).toBe(projectId)
    expect(body.total).toBe(2)
    expect(body.elevations[0]).toMatchObject({
      room_id: roomId,
      wall_id: wallIdA,
      wall_index: 0,
      wall_length_mm: 2400,
    })

    await app.close()
  })

  it('returns 404 for missing project elevations', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/elevations',
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it('returns projected section view payload', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/rooms/${roomId}/sections/${sectionLineId}/view`,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.bounds).toMatchObject({ length_mm: 4200, height_mm: 2500 })
    expect(body.openings).toHaveLength(1)
    expect(body.placements).toHaveLength(1)
    expect(body.dimensions).toHaveLength(1)
    expect(body.snap_points.length).toBeGreaterThan(2)

    await app.close()
  })

  it('returns 404 for unknown section in view endpoint', async () => {
    const app = await createApp()

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/rooms/${roomId}/sections/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/view`,
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })
})

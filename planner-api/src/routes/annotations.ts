import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendNotFound, sendBadRequest } from '../errors.js'

const MAX_TEXT_LENGTH = 2000

type RoomJson = Record<string, unknown>

const PointSchema = z.object({ x_mm: z.number(), y_mm: z.number() })

const SectionViewConfigSchema = z.object({
  scale: z.number().positive().max(10).default(1),
  offset_x_mm: z.number().default(0),
  offset_y_mm: z.number().default(0),
  show_measurements: z.boolean().default(true),
  show_openings: z.boolean().default(true),
  show_placements: z.boolean().default(true),
})

const MeasureLineSchema = z.object({
  id: z.string().uuid().default(() => randomUUID()),
  points: z.array(PointSchema).min(2),
  label: z.string().optional(),
  is_chain: z.boolean().default(false),
})

const SectionLineSchema = z.object({
  id: z.string().uuid().default(() => randomUUID()),
  start: PointSchema,
  end: PointSchema,
  label: z.string().optional(),
  depth_mm: z.number().positive().optional(),
  direction: z.enum(['left', 'right', 'both']).default('both'),
  level_scope: z.enum(['room_level', 'single_level', 'range', 'all_levels']).default('room_level'),
  level_id: z.string().uuid().optional(),
  from_level_id: z.string().uuid().optional(),
  to_level_id: z.string().uuid().optional(),
  sheet_visibility: z.enum(['all', 'sheet_only', 'hidden']).default('all'),
  show_marker: z.boolean().default(true),
  marker_style: z.enum(['arrow', 'triangle', 'none']).default('arrow'),
  view_config: SectionViewConfigSchema.optional(),
}).superRefine((value, context) => {
  if (value.level_scope === 'single_level' && !value.level_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'level_id is required when level_scope is single_level',
      path: ['level_id'],
    })
  }

  if (value.level_scope === 'range') {
    if (!value.from_level_id || !value.to_level_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from_level_id and to_level_id are required when level_scope is range',
        path: ['from_level_id'],
      })
      return
    }

    if (value.from_level_id === value.to_level_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from_level_id and to_level_id must be different when level_scope is range',
        path: ['to_level_id'],
      })
    }
  }
})

const SectionLinePatchSchema = z.object({
  start: PointSchema.optional(),
  end: PointSchema.optional(),
  label: z.string().optional(),
  depth_mm: z.number().positive().optional(),
  direction: z.enum(['left', 'right', 'both']).optional(),
  level_scope: z.enum(['room_level', 'single_level', 'range', 'all_levels']).optional(),
  level_id: z.string().uuid().nullable().optional(),
  from_level_id: z.string().uuid().nullable().optional(),
  to_level_id: z.string().uuid().nullable().optional(),
  sheet_visibility: z.enum(['all', 'sheet_only', 'hidden']).optional(),
  show_marker: z.boolean().optional(),
  marker_style: z.enum(['arrow', 'triangle', 'none']).optional(),
  view_config: SectionViewConfigSchema.partial().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be provided',
})

const CommentSchema = z.object({
  id: z.string().uuid().default(() => randomUUID()),
  position: PointSchema,
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  image_url: z.string().url().regex(/^https:\/\//).optional(),
  font_size: z.number().positive().optional(),
  background_color: z.string().optional(),
  show_in_plan: z.boolean().default(true),
  show_in_perspective: z.boolean().default(false),
  arrow_target: PointSchema.optional(),
})

type SectionViewConfig = z.infer<typeof SectionViewConfigSchema>

type NormalizedSectionLine = z.infer<typeof SectionLineSchema> & {
  room_id: string
}

type ProjectedElement = {
  id: string
  wall_id: string
  x0_mm: number
  x1_mm: number
  y0_mm: number
  y1_mm: number
  width_mm: number
  height_mm: number
}

type WallChainSegment = {
  id: string
  length_mm: number
  chain_start_mm: number
}

const DEFAULT_SECTION_VIEW_CONFIG: SectionViewConfig = {
  scale: 1,
  offset_x_mm: 0,
  offset_y_mm: 0,
  show_measurements: true,
  show_openings: true,
  show_placements: true,
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeSectionViewConfig(value: unknown): SectionViewConfig {
  const parsed = SectionViewConfigSchema.partial().safeParse(value)
  if (!parsed.success) {
    return { ...DEFAULT_SECTION_VIEW_CONFIG }
  }

  return {
    ...DEFAULT_SECTION_VIEW_CONFIG,
    ...parsed.data,
  }
}

function normalizeSectionLine(value: unknown, roomId: string): NormalizedSectionLine | null {
  const parsed = SectionLineSchema.safeParse(value)
  if (!parsed.success) {
    return null
  }

  return {
    ...parsed.data,
    room_id: roomId,
    view_config: normalizeSectionViewConfig(parsed.data.view_config),
  }
}

function normalizeSectionLines(value: unknown, roomId: string): NormalizedSectionLine[] {
  if (!Array.isArray(value)) {
    return []
  }

  const parsed: NormalizedSectionLine[] = []
  for (const entry of value) {
    const line = normalizeSectionLine(entry, roomId)
    if (line) {
      parsed.push(line)
    }
  }
  return parsed
}

function parseWallChain(boundary: unknown): { walls: WallChainSegment[]; totalLengthMm: number } {
  const boundaryRecord = asRecord(boundary)
  const wallSegments = Array.isArray(boundaryRecord?.wall_segments) ? boundaryRecord.wall_segments : []

  let chainStart = 0
  const walls: WallChainSegment[] = []
  for (const entry of wallSegments) {
    const wall = asRecord(entry)
    if (!wall || typeof wall.id !== 'string' || wall.id.trim().length === 0) {
      continue
    }

    const length = Math.max(1, Math.round(toFiniteNumber(wall.length_mm, 0)))
    walls.push({
      id: wall.id,
      length_mm: length,
      chain_start_mm: chainStart,
    })
    chainStart += length
  }

  return { walls, totalLengthMm: chainStart }
}

function projectOpening(entry: unknown, wallMap: Map<string, WallChainSegment>): ProjectedElement | null {
  const opening = asRecord(entry)
  if (!opening || typeof opening.id !== 'string' || typeof opening.wall_id !== 'string') {
    return null
  }

  const wall = wallMap.get(opening.wall_id)
  if (!wall) {
    return null
  }

  const offset = Math.max(0, toFiniteNumber(opening.offset_mm, 0))
  const width = Math.max(1, toFiniteNumber(opening.width_mm, 900))
  const height = Math.max(1, toFiniteNumber(opening.height_mm, 2100))
  const sillHeight = Math.max(0, toFiniteNumber(opening.sill_height_mm, 0))

  const x0 = wall.chain_start_mm + Math.min(offset, wall.length_mm)
  const x1 = Math.min(wall.chain_start_mm + wall.length_mm, x0 + width)

  return {
    id: opening.id,
    wall_id: opening.wall_id,
    x0_mm: x0,
    x1_mm: x1,
    y0_mm: sillHeight,
    y1_mm: sillHeight + height,
    width_mm: Math.max(1, x1 - x0),
    height_mm: height,
  }
}

function projectPlacement(entry: unknown, wallMap: Map<string, WallChainSegment>): ProjectedElement | null {
  const placement = asRecord(entry)
  if (!placement || typeof placement.id !== 'string' || typeof placement.wall_id !== 'string') {
    return null
  }

  const wall = wallMap.get(placement.wall_id)
  if (!wall) {
    return null
  }

  const offset = Math.max(0, toFiniteNumber(placement.offset_mm, 0))
  const width = Math.max(1, toFiniteNumber(placement.width_mm, 600))
  const height = Math.max(1, toFiniteNumber(placement.height_mm, 720))

  const x0 = wall.chain_start_mm + Math.min(offset, wall.length_mm)
  const x1 = Math.min(wall.chain_start_mm + wall.length_mm, x0 + width)

  return {
    id: placement.id,
    wall_id: placement.wall_id,
    x0_mm: x0,
    x1_mm: x1,
    y0_mm: 0,
    y1_mm: height,
    width_mm: Math.max(1, x1 - x0),
    height_mm: height,
  }
}

export async function annotationRoutes(app: FastifyInstance) {
  // GET /rooms/:id/measure-lines
  app.get<{ Params: { id: string } }>('/rooms/:id/measure-lines', async (request, reply) => {
    const room = await prisma.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')
    return reply.send(((room as unknown as RoomJson).measure_lines as unknown[]) ?? [])
  })

  // POST /rooms/:id/measure-lines
  app.post<{ Params: { id: string } }>('/rooms/:id/measure-lines', async (request, reply) => {
    const parsed = MeasureLineSchema.safeParse(request.body)
    if (!parsed.success) return sendBadRequest(reply, parsed.error.errors[0].message)
    const room = await prisma.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')
    const existing = ((room as unknown as RoomJson).measure_lines as unknown[]) ?? []
    const newItem = { ...parsed.data, room_id: request.params.id }
    await prisma.room.update({ where: { id: request.params.id }, data: { measure_lines: [...existing, newItem] } as any })
    return reply.status(201).send(newItem)
  })

  // DELETE /rooms/:id/measure-lines/:lineId
  app.delete<{ Params: { id: string; lineId: string } }>(
    '/rooms/:id/measure-lines/:lineId',
    async (request, reply) => {
      const room = await prisma.room.findUnique({ where: { id: request.params.id } })
      if (!room) return sendNotFound(reply, 'Room not found')
      const existing = ((room as unknown as RoomJson).measure_lines as Array<{ id: string }>) ?? []
      await prisma.room.update({ where: { id: request.params.id }, data: { measure_lines: existing.filter(l => l.id !== request.params.lineId) } as any })
      return reply.status(204).send()
    },
  )

  // GET /rooms/:id/comments
  app.get<{ Params: { id: string } }>('/rooms/:id/comments', async (request, reply) => {
    const room = await prisma.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')
    return reply.send(((room as unknown as RoomJson).comments as unknown[]) ?? [])
  })

  // POST /rooms/:id/comments
  app.post<{ Params: { id: string } }>('/rooms/:id/comments', async (request, reply) => {
    const parsed = CommentSchema.safeParse(request.body)
    if (!parsed.success) return sendBadRequest(reply, parsed.error.errors[0].message)
    const room = await prisma.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')
    const existing = ((room as unknown as RoomJson).comments as unknown[]) ?? []
    const newComment = { ...parsed.data, room_id: request.params.id }
    await prisma.room.update({ where: { id: request.params.id }, data: { comments: [...existing, newComment] } as any })
    return reply.status(201).send(newComment)
  })

  // DELETE /rooms/:id/comments/:commentId
  app.delete<{ Params: { id: string; commentId: string } }>(
    '/rooms/:id/comments/:commentId',
    async (request, reply) => {
      const room = await prisma.room.findUnique({ where: { id: request.params.id } })
      if (!room) return sendNotFound(reply, 'Room not found')
      const existing = ((room as unknown as RoomJson).comments as Array<{ id: string }>) ?? []
      await prisma.room.update({ where: { id: request.params.id }, data: { comments: existing.filter(c => c.id !== request.params.commentId) } as any })
      return reply.status(204).send()
    },
  )

  async function listSectionsForRoom(roomId: string): Promise<NormalizedSectionLine[] | null> {
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return null
    }

    return normalizeSectionLines((room as unknown as RoomJson).section_lines, roomId)
  }

  async function createSectionForRoom(roomId: string, payload: unknown): Promise<{ created: NormalizedSectionLine | null; error: string | null; status: number }> {
    const parsed = SectionLineSchema.safeParse(payload)
    if (!parsed.success) {
      return { created: null, error: parsed.error.errors[0].message, status: 400 }
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return { created: null, error: 'Room not found', status: 404 }
    }

    const existing = normalizeSectionLines((room as unknown as RoomJson).section_lines, roomId)
    const newLine: NormalizedSectionLine = {
      ...parsed.data,
      room_id: roomId,
      view_config: normalizeSectionViewConfig(parsed.data.view_config),
    }

    await prisma.room.update({ where: { id: roomId }, data: { section_lines: [...existing, newLine] } as any })
    return { created: newLine, error: null, status: 201 }
  }

  async function updateSectionForRoom(roomId: string, sectionId: string, patchPayload: unknown): Promise<{ updated: NormalizedSectionLine | null; error: string | null; status: number }> {
    const parsed = SectionLinePatchSchema.safeParse(patchPayload)
    if (!parsed.success) {
      return { updated: null, error: parsed.error.errors[0].message, status: 400 }
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return { updated: null, error: 'Room not found', status: 404 }
    }

    const existing = normalizeSectionLines((room as unknown as RoomJson).section_lines, roomId)
    const index = existing.findIndex((line) => line.id === sectionId)
    if (index < 0) {
      return { updated: null, error: 'Section line not found', status: 404 }
    }

    const previous = existing[index]
    const mergedViewConfig = parsed.data.view_config
      ? {
          ...normalizeSectionViewConfig(previous.view_config),
          ...parsed.data.view_config,
        }
      : previous.view_config

    const normalizedPatch: Record<string, unknown> = {
      ...parsed.data,
      ...(parsed.data.level_id === null ? { level_id: undefined } : {}),
      ...(parsed.data.from_level_id === null ? { from_level_id: undefined } : {}),
      ...(parsed.data.to_level_id === null ? { to_level_id: undefined } : {}),
      ...(mergedViewConfig ? { view_config: normalizeSectionViewConfig(mergedViewConfig) } : {}),
    }

    const candidate = {
      ...previous,
      ...normalizedPatch,
      room_id: roomId,
    }

    const normalized = normalizeSectionLine(candidate, roomId)
    if (!normalized) {
      const validation = SectionLineSchema.safeParse(candidate)
      return { updated: null, error: validation.success ? 'Invalid section payload' : validation.error.errors[0].message, status: 400 }
    }

    const next = [...existing]
    next[index] = normalized
    await prisma.room.update({ where: { id: roomId }, data: { section_lines: next } as any })

    return { updated: normalized, error: null, status: 200 }
  }

  app.get<{ Params: { id: string } }>('/projects/:id/elevations', async (request, reply) => {
    const project = await prisma.project.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        rooms: {
          select: {
            id: true,
            name: true,
            ceiling_height_mm: true,
            boundary: true,
          },
        },
      },
    })

    if (!project) {
      return sendNotFound(reply, 'Project not found')
    }

    const elevations = project.rooms.flatMap((room) => {
      const chain = parseWallChain(room.boundary)
      return chain.walls.map((wall, index) => ({
        room_id: room.id,
        room_name: room.name,
        wall_id: wall.id,
        wall_index: index,
        wall_length_mm: wall.length_mm,
        room_height_mm: room.ceiling_height_mm,
        preview_url: `/api/v1/rooms/${room.id}/elevation/${index}`,
      }))
    })

    return reply.send({
      project_id: project.id,
      total: elevations.length,
      elevations,
    })
  })

  // GET /rooms/:id/section-lines
  app.get<{ Params: { id: string } }>('/rooms/:id/section-lines', async (request, reply) => {
    const lines = await listSectionsForRoom(request.params.id)
    if (!lines) return sendNotFound(reply, 'Room not found')
    return reply.send(lines)
  })

  // POST /rooms/:id/section-lines
  app.post<{ Params: { id: string } }>('/rooms/:id/section-lines', async (request, reply) => {
    const result = await createSectionForRoom(request.params.id, request.body)
    if (result.error) {
      if (result.status === 404) return sendNotFound(reply, result.error)
      return sendBadRequest(reply, result.error)
    }
    return reply.status(201).send(result.created)
  })

  // PATCH /rooms/:id/section-lines/:lineId
  app.patch<{ Params: { id: string; lineId: string } }>(
    '/rooms/:id/section-lines/:lineId',
    async (request, reply) => {
      const result = await updateSectionForRoom(request.params.id, request.params.lineId, request.body)
      if (result.error) {
        if (result.status === 404) return sendNotFound(reply, result.error)
        return sendBadRequest(reply, result.error)
      }
      return reply.send(result.updated)
    },
  )

  // GET /rooms/:id/sections (alias)
  app.get<{ Params: { id: string } }>('/rooms/:id/sections', async (request, reply) => {
    const lines = await listSectionsForRoom(request.params.id)
    if (!lines) return sendNotFound(reply, 'Room not found')
    return reply.send(lines)
  })

  // POST /rooms/:id/sections (alias)
  app.post<{ Params: { id: string } }>('/rooms/:id/sections', async (request, reply) => {
    const result = await createSectionForRoom(request.params.id, request.body)
    if (result.error) {
      if (result.status === 404) return sendNotFound(reply, result.error)
      return sendBadRequest(reply, result.error)
    }
    return reply.status(201).send(result.created)
  })

  // PATCH /rooms/:id/sections/:sectionId (alias)
  app.patch<{ Params: { id: string; sectionId: string } }>('/rooms/:id/sections/:sectionId', async (request, reply) => {
    const result = await updateSectionForRoom(request.params.id, request.params.sectionId, request.body)
    if (result.error) {
      if (result.status === 404) return sendNotFound(reply, result.error)
      return sendBadRequest(reply, result.error)
    }
    return reply.send(result.updated)
  })

  app.get<{ Params: { id: string; sectionId: string } }>('/rooms/:id/sections/:sectionId/view', async (request, reply) => {
    const room = await prisma.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')

    const sections = normalizeSectionLines((room as unknown as RoomJson).section_lines, request.params.id)
    const section = sections.find((entry) => entry.id === request.params.sectionId)
    if (!section) return sendNotFound(reply, 'Section line not found')

    const chain = parseWallChain((room as unknown as RoomJson).boundary)
    const wallMap = new Map<string, WallChainSegment>(chain.walls.map((wall) => [wall.id, wall]))
    const roomJson = room as unknown as RoomJson
    const openingsRaw = Array.isArray(roomJson.openings) ? roomJson.openings : []
    const placementsRaw = Array.isArray(roomJson.placements) ? roomJson.placements : []

    const openings = openingsRaw
      .map((entry) => projectOpening(entry, wallMap))
      .filter((entry): entry is ProjectedElement => Boolean(entry))

    const placements = placementsRaw
      .map((entry) => projectPlacement(entry, wallMap))
      .filter((entry): entry is ProjectedElement => Boolean(entry))

    const dimensions = await prisma.dimension.findMany({
      where: { room_id: request.params.id },
      select: {
        id: true,
        type: true,
        label: true,
        points: true,
      },
      orderBy: { created_at: 'asc' },
    })

    const projectedDimensions = dimensions.map((dimension) => {
      const points = Array.isArray(dimension.points) ? dimension.points : []
      const projected_points = points
        .map((entry) => {
          const point = asRecord(entry)
          if (!point) return null
          const x_mm = toFiniteNumber(point.x_mm, Number.NaN)
          const y_mm = toFiniteNumber(point.y_mm, Number.NaN)
          if (!Number.isFinite(x_mm) || !Number.isFinite(y_mm)) {
            return null
          }
          return { x_mm, y_mm }
        })
        .filter((entry): entry is { x_mm: number; y_mm: number } => Boolean(entry))

      return {
        id: dimension.id,
        type: dimension.type,
        label: dimension.label,
        projected_points,
      }
    })

    const snap_points = [
      ...openings.flatMap((entry) => [
        { x_mm: entry.x0_mm, y_mm: entry.y0_mm, source: 'opening' },
        { x_mm: entry.x1_mm, y_mm: entry.y1_mm, source: 'opening' },
      ]),
      ...placements.flatMap((entry) => [
        { x_mm: entry.x0_mm, y_mm: entry.y0_mm, source: 'placement' },
        { x_mm: entry.x1_mm, y_mm: entry.y1_mm, source: 'placement' },
      ]),
      ...projectedDimensions.flatMap((dimension) =>
        dimension.projected_points.map((point) => ({ ...point, source: 'dimension' })),
      ),
    ]

    return reply.send({
      room_id: request.params.id,
      section_id: section.id,
      section,
      bounds: {
        length_mm: chain.totalLengthMm,
        height_mm: room.ceiling_height_mm,
      },
      view_config: normalizeSectionViewConfig(section.view_config),
      openings,
      placements,
      dimensions: projectedDimensions,
      snap_points,
    })
  })

  // DELETE /rooms/:id/section-lines/:lineId
  app.delete<{ Params: { id: string; lineId: string } }>(
    '/rooms/:id/section-lines/:lineId',
    async (request, reply) => {
      const room = await prisma.room.findUnique({ where: { id: request.params.id } })
      if (!room) return sendNotFound(reply, 'Room not found')

      const existing = ((room as unknown as RoomJson).section_lines as Array<{ id: string }>) ?? []
      const found = existing.some((line) => line.id === request.params.lineId)
      if (!found) return sendNotFound(reply, 'Section line not found')

      const next = existing.filter((line) => line.id !== request.params.lineId)
      await prisma.room.update({ where: { id: request.params.id }, data: { section_lines: next } as any })
      return reply.status(204).send()
    },
  )
}

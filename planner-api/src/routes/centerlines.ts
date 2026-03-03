import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'

type RoomBoundary = {
  vertices?: Array<{ id: string; x_mm: number; y_mm: number }>
  wall_segments?: Array<{
    id: string
    x0_mm?: number
    y0_mm?: number
    x1_mm?: number
    y1_mm?: number
    start_vertex_id?: string
    end_vertex_id?: string
  }>
} | null

type RoomPlacement = { id: string; wall_id: string; offset_mm: number; width_mm: number }

const CreateCenterlineSchema = z.object({
  label: z.string().max(120).nullable().optional(),
  x0_mm: z.number(),
  y0_mm: z.number(),
  x1_mm: z.number(),
  y1_mm: z.number(),
  style: z.record(z.string(), z.unknown()).optional(),
  ref_type: z.enum(['placement', 'opening']).nullable().optional(),
  ref_id: z.string().min(1).nullable().optional(),
})

const FromPlacementSchema = z.object({
  placement_id: z.string().min(1),
  length_mm: z.number().positive().max(5000).optional(),
})

function wallEndpoints(boundary: RoomBoundary, wallId: string): { x0_mm: number; y0_mm: number; x1_mm: number; y1_mm: number } | null {
  const wall = boundary?.wall_segments?.find((entry) => entry.id === wallId)
  if (!wall) return null

  if (
    typeof wall.x0_mm === 'number' &&
    typeof wall.y0_mm === 'number' &&
    typeof wall.x1_mm === 'number' &&
    typeof wall.y1_mm === 'number'
  ) {
    return {
      x0_mm: wall.x0_mm,
      y0_mm: wall.y0_mm,
      x1_mm: wall.x1_mm,
      y1_mm: wall.y1_mm,
    }
  }

  const start = boundary?.vertices?.find((vertex) => vertex.id === wall.start_vertex_id)
  const end = boundary?.vertices?.find((vertex) => vertex.id === wall.end_vertex_id)
  if (!start || !end) return null

  return {
    x0_mm: start.x_mm,
    y0_mm: start.y_mm,
    x1_mm: end.x_mm,
    y1_mm: end.y_mm,
  }
}

export async function centerlineRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>('/rooms/:id/centerlines', async (request, reply) => {
    const parsed = CreateCenterlineSchema.safeParse(request.body)
    if (!parsed.success) return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid')

    const room = await prisma.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')

    const centerline = await prisma.centerline.create({
      data: {
        room_id: request.params.id,
        label: parsed.data.label ?? null,
        x0_mm: parsed.data.x0_mm,
        y0_mm: parsed.data.y0_mm,
        x1_mm: parsed.data.x1_mm,
        y1_mm: parsed.data.y1_mm,
        style: (parsed.data.style ?? {}) as unknown as Prisma.InputJsonValue,
        ref_type: parsed.data.ref_type ?? null,
        ref_id: parsed.data.ref_id ?? null,
      },
    })

    return reply.status(201).send(centerline)
  })

  app.get<{ Params: { id: string } }>('/rooms/:id/centerlines', async (request, reply) => {
    const room = await prisma.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')

    const centerlines = await prisma.centerline.findMany({
      where: { room_id: request.params.id },
      orderBy: { created_at: 'asc' },
    })

    return reply.send(centerlines)
  })

  app.delete<{ Params: { id: string } }>('/centerlines/:id', async (request, reply) => {
    const existing = await prisma.centerline.findUnique({ where: { id: request.params.id } })
    if (!existing) return sendNotFound(reply, 'Centerline not found')

    await prisma.centerline.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>('/rooms/:id/centerlines/from-placement', async (request, reply) => {
    const parsed = FromPlacementSchema.safeParse(request.body)
    if (!parsed.success) return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid')

    const room = await prisma.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')

    const placements = ((room.placements as RoomPlacement[] | null) ?? [])
    const placement = placements.find((entry) => entry.id === parsed.data.placement_id)
    if (!placement) return sendNotFound(reply, 'Placement not found')

    const boundary = room.boundary as RoomBoundary
    const wall = wallEndpoints(boundary, placement.wall_id)
    if (!wall) return sendNotFound(reply, 'Wall not found')

    const dx = wall.x1_mm - wall.x0_mm
    const dy = wall.y1_mm - wall.y0_mm
    const len = Math.hypot(dx, dy)
    if (len < 1e-6) return sendBadRequest(reply, 'Wall too short')

    const ux = dx / len
    const uy = dy / len
    const nx = -uy
    const ny = ux

    const centerOffset = placement.offset_mm + placement.width_mm / 2
    const cx = wall.x0_mm + ux * centerOffset
    const cy = wall.y0_mm + uy * centerOffset

    const totalLength = parsed.data.length_mm ?? 300
    const half = totalLength / 2

    const centerline = await prisma.centerline.create({
      data: {
        room_id: request.params.id,
        label: null,
        x0_mm: cx - nx * half,
        y0_mm: cy - ny * half,
        x1_mm: cx + nx * half,
        y1_mm: cy + ny * half,
        style: { dash: [6, 3] },
        ref_type: 'placement',
        ref_id: placement.id,
      },
    })

    return reply.status(201).send(centerline)
  })
}

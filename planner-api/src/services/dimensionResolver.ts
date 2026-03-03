import type { PrismaClient } from '@prisma/client'

export interface ResolvedPoint {
  x_mm: number
  y_mm: number
}

type BoundaryVertex = { id: string; x_mm: number; y_mm: number }
type BoundaryWall = {
  id: string
  start_vertex_id?: string
  end_vertex_id?: string
  x0_mm?: number
  y0_mm?: number
  x1_mm?: number
  y1_mm?: number
}
type RoomBoundary = {
  vertices?: BoundaryVertex[]
  wall_segments?: BoundaryWall[]
}
type RoomPlacement = { id: string; wall_id: string; offset_mm: number; width_mm?: number }
type RoomOpening = { id: string; wall_id: string; offset_mm: number; width_mm: number }
type RoomEntity = {
  id: string
  boundary: unknown
  placements: unknown
  openings: unknown
}

type RefSide = 'start' | 'end'

function getWallEndpoints(boundary: RoomBoundary, wallId: string): { x0_mm: number; y0_mm: number; x1_mm: number; y1_mm: number } | null {
  const wall = boundary.wall_segments?.find((entry) => entry.id === wallId)
  if (!wall) return null

  if (
    typeof wall.x0_mm === 'number' &&
    typeof wall.y0_mm === 'number' &&
    typeof wall.x1_mm === 'number' &&
    typeof wall.y1_mm === 'number'
  ) {
    return { x0_mm: wall.x0_mm, y0_mm: wall.y0_mm, x1_mm: wall.x1_mm, y1_mm: wall.y1_mm }
  }

  const start = boundary.vertices?.find((v) => v.id === wall.start_vertex_id)
  const end = boundary.vertices?.find((v) => v.id === wall.end_vertex_id)
  if (!start || !end) return null

  return { x0_mm: start.x_mm, y0_mm: start.y_mm, x1_mm: end.x_mm, y1_mm: end.y_mm }
}

function pointOnWallByOffset(wall: { x0_mm: number; y0_mm: number; x1_mm: number; y1_mm: number }, offsetMm: number): ResolvedPoint {
  const dx = wall.x1_mm - wall.x0_mm
  const dy = wall.y1_mm - wall.y0_mm
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return { x_mm: wall.x0_mm, y_mm: wall.y0_mm }

  const ux = dx / len
  const uy = dy / len
  return {
    x_mm: wall.x0_mm + ux * offsetMm,
    y_mm: wall.y0_mm + uy * offsetMm,
  }
}

function findRefRoom(rooms: RoomEntity[], refType: string, refId: string): RoomEntity | null {
  for (const room of rooms) {
    if (refType === 'wall') {
      const boundary = (room.boundary as RoomBoundary | null) ?? null
      if (boundary?.wall_segments?.some((wall) => wall.id === refId)) return room
      continue
    }

    if (refType === 'placement') {
      const placements = ((room.placements as RoomPlacement[] | null) ?? [])
      if (placements.some((placement) => placement.id === refId)) return room
      continue
    }

    if (refType === 'opening') {
      const openings = ((room.openings as RoomOpening[] | null) ?? [])
      if (openings.some((opening) => opening.id === refId)) return room
    }
  }

  return null
}

/**
 * Löst eine Dimension-Referenz zu einem konkreten Punkt auf.
 */
export async function resolveRefPoint(
  db: PrismaClient,
  refType: string,
  refId: string,
  side: RefSide,
  roomId?: string,
): Promise<ResolvedPoint | null> {
  const rooms = roomId
    ? await db.room.findMany({
      where: { id: roomId },
      select: { id: true, boundary: true, placements: true, openings: true },
    }) as RoomEntity[]
    : await db.room.findMany({
      select: { id: true, boundary: true, placements: true, openings: true },
    }) as RoomEntity[]

  if (rooms.length === 0) return null
  const room = findRefRoom(rooms, refType, refId)
  if (!room) return null

  const boundary = (room.boundary as RoomBoundary | null) ?? null
  if (!boundary) return null

  switch (refType) {
    case 'wall': {
      const wall = getWallEndpoints(boundary, refId)
      if (!wall) return null
      return side === 'start'
        ? { x_mm: wall.x0_mm, y_mm: wall.y0_mm }
        : { x_mm: wall.x1_mm, y_mm: wall.y1_mm }
    }

    case 'placement': {
      const placements = ((room.placements as RoomPlacement[] | null) ?? [])
      const placement = placements.find((entry) => entry.id === refId)
      if (!placement) return null

      const wall = getWallEndpoints(boundary, placement.wall_id)
      if (!wall) return null

      const offset = side === 'end'
        ? placement.offset_mm + (placement.width_mm ?? 0)
        : placement.offset_mm

      return pointOnWallByOffset(wall, offset)
    }

    case 'opening': {
      const openings = ((room.openings as RoomOpening[] | null) ?? [])
      const opening = openings.find((entry) => entry.id === refId)
      if (!opening) return null

      const wall = getWallEndpoints(boundary, opening.wall_id)
      if (!wall) return null

      const offset = side === 'end'
        ? opening.offset_mm + opening.width_mm
        : opening.offset_mm

      return pointOnWallByOffset(wall, offset)
    }

    default:
      return null
  }
}

/**
 * Aktualisiert alle auto_update-Dimensionen eines Raums nach Geometrie-Änderung.
 */
export async function refreshRoomDimensions(db: PrismaClient, roomId: string): Promise<number> {
  const dims = await db.dimension.findMany({
    where: { room_id: roomId, auto_update: true },
  })

  let updated = 0

  for (const dim of dims) {
    const points = (dim.points as ResolvedPoint[] | null) ?? null
    if (!points || points.length < 2) continue

    const nextPoints = [...points]

    if (dim.ref_a_type && dim.ref_a_id) {
      const start = await resolveRefPoint(db, dim.ref_a_type, dim.ref_a_id, 'start', roomId)
      if (start) nextPoints[0] = start
    }

    if (dim.ref_b_type && dim.ref_b_id) {
      const end = await resolveRefPoint(db, dim.ref_b_type, dim.ref_b_id, 'end', roomId)
      if (end) nextPoints[1] = end
    }

    if (JSON.stringify(points) !== JSON.stringify(nextPoints)) {
      await db.dimension.update({ where: { id: dim.id }, data: { points: nextPoints } })
      updated += 1
    }
  }

  return updated
}

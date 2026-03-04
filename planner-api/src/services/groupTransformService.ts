type Point = { x_mm: number; y_mm: number }

export type DrawingGroupMemberType = 'placement' | 'opening' | 'dimension' | 'centerline'

export type DrawingGroupMember = {
  entity_type: DrawingGroupMemberType
  entity_id: string
  room_id?: string
}

export type DrawingGroupConfig = {
  visible?: boolean
  locked?: boolean
  lock_scope?: string | null
}

export type DrawingGroupRecord = {
  id: string
  project_id: string
  members_json: unknown
  config_json: unknown
}

export type GroupTransformInput = {
  translate?: Point
  rotation_deg?: number
  pivot?: Point
}

export type GroupOperationResult = {
  updated: {
    placements: number
    openings: number
    dimensions: number
    centerlines: number
  }
  skipped: number
  skipped_reasons: string[]
  blocked: boolean
}

type PrismaLike = {
  room: {
    findUnique: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
  }
  dimension: {
    findUnique: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
  }
  centerline: {
    findUnique: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
  }
}

type RoomState = {
  id: string
  project_id: string
  boundary: unknown
  placements: Array<Record<string, unknown>>
  openings: Array<Record<string, unknown>>
  placementsChanged: boolean
  openingsChanged: boolean
}

type RoomBoundary = {
  vertices?: Array<{ id?: string; x_mm?: number; y_mm?: number }>
  wall_segments?: Array<{
    id?: string
    x0_mm?: number
    y0_mm?: number
    x1_mm?: number
    y1_mm?: number
    start?: { x_mm?: number; y_mm?: number }
    end?: { x_mm?: number; y_mm?: number }
    start_vertex_id?: string
    end_vertex_id?: string
  }>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toMemberArray(raw: unknown): DrawingGroupMember[] {
  if (!Array.isArray(raw)) return []

  const members: DrawingGroupMember[] = []
  for (const entry of raw) {
    const candidate = asRecord(entry)
    if (!candidate) continue
    if (candidate.entity_type !== 'placement' && candidate.entity_type !== 'opening' && candidate.entity_type !== 'dimension' && candidate.entity_type !== 'centerline') {
      continue
    }
    if (typeof candidate.entity_id !== 'string' || candidate.entity_id.trim().length === 0) {
      continue
    }

    members.push({
      entity_type: candidate.entity_type,
      entity_id: candidate.entity_id,
      ...(typeof candidate.room_id === 'string' && candidate.room_id.trim().length > 0
        ? { room_id: candidate.room_id }
        : {}),
    })
  }
  return members
}

function toConfig(raw: unknown): DrawingGroupConfig {
  const candidate = asRecord(raw)
  if (!candidate) return {}

  return {
    ...(typeof candidate.visible === 'boolean' ? { visible: candidate.visible } : {}),
    ...(typeof candidate.locked === 'boolean' ? { locked: candidate.locked } : {}),
    ...(typeof candidate.lock_scope === 'string' || candidate.lock_scope === null
      ? { lock_scope: candidate.lock_scope as string | null }
      : {}),
  }
}

function parsePointArray(value: unknown): Point[] {
  if (!Array.isArray(value)) return []

  const points: Point[] = []
  for (const entry of value) {
    const point = asRecord(entry)
    if (!point) continue

    const x = asFiniteNumber(point.x_mm)
    const y = asFiniteNumber(point.y_mm)
    if (x == null || y == null) continue

    points.push({ x_mm: x, y_mm: y })
  }

  return points
}

function transformPoint(point: Point, input: { translate: Point; rotationDeg: number; pivot: Point }): Point {
  const rad = (input.rotationDeg * Math.PI) / 180
  const sin = Math.sin(rad)
  const cos = Math.cos(rad)

  const relX = point.x_mm - input.pivot.x_mm
  const relY = point.y_mm - input.pivot.y_mm
  const rotX = relX * cos - relY * sin
  const rotY = relX * sin + relY * cos

  return {
    x_mm: Number((rotX + input.pivot.x_mm + input.translate.x_mm).toFixed(3)),
    y_mm: Number((rotY + input.pivot.y_mm + input.translate.y_mm).toFixed(3)),
  }
}

function wallDirection(boundaryValue: unknown, wallId: string): { ux: number; uy: number } | null {
  const boundary = boundaryValue as RoomBoundary | null
  const wall = boundary?.wall_segments?.find((entry) => entry.id === wallId)
  if (!wall) return null

  let start: Point | null = null
  let end: Point | null = null

  if (
    typeof wall.x0_mm === 'number' &&
    typeof wall.y0_mm === 'number' &&
    typeof wall.x1_mm === 'number' &&
    typeof wall.y1_mm === 'number'
  ) {
    start = { x_mm: wall.x0_mm, y_mm: wall.y0_mm }
    end = { x_mm: wall.x1_mm, y_mm: wall.y1_mm }
  } else if (
    typeof wall.start?.x_mm === 'number' &&
    typeof wall.start?.y_mm === 'number' &&
    typeof wall.end?.x_mm === 'number' &&
    typeof wall.end?.y_mm === 'number'
  ) {
    start = { x_mm: wall.start.x_mm, y_mm: wall.start.y_mm }
    end = { x_mm: wall.end.x_mm, y_mm: wall.end.y_mm }
  } else if (wall.start_vertex_id && wall.end_vertex_id) {
    const vertices = boundary?.vertices ?? []
    const startVertex = vertices.find((entry) => entry.id === wall.start_vertex_id)
    const endVertex = vertices.find((entry) => entry.id === wall.end_vertex_id)

    if (
      startVertex &&
      endVertex &&
      typeof startVertex.x_mm === 'number' &&
      typeof startVertex.y_mm === 'number' &&
      typeof endVertex.x_mm === 'number' &&
      typeof endVertex.y_mm === 'number'
    ) {
      start = { x_mm: startVertex.x_mm, y_mm: startVertex.y_mm }
      end = { x_mm: endVertex.x_mm, y_mm: endVertex.y_mm }
    }
  }

  if (!start || !end) {
    return null
  }

  const dx = end.x_mm - start.x_mm
  const dy = end.y_mm - start.y_mm
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return null

  return { ux: dx / len, uy: dy / len }
}

function createResult(): GroupOperationResult {
  return {
    updated: {
      placements: 0,
      openings: 0,
      dimensions: 0,
      centerlines: 0,
    },
    skipped: 0,
    skipped_reasons: [],
    blocked: false,
  }
}

function lockScopeFor(lockState: boolean, incomingScope: string | null | undefined) {
  if (!lockState) {
    return null
  }
  return incomingScope ?? 'manual'
}

async function loadRoomState(
  prisma: PrismaLike,
  cache: Map<string, RoomState | null>,
  roomId: string,
): Promise<RoomState | null> {
  if (cache.has(roomId)) {
    return cache.get(roomId) ?? null
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      project_id: true,
      boundary: true,
      placements: true,
      openings: true,
    },
  }) as {
    id: string
    project_id: string
    boundary: unknown
    placements: unknown
    openings: unknown
  } | null

  if (!room) {
    cache.set(roomId, null)
    return null
  }

  const state: RoomState = {
    id: room.id,
    project_id: room.project_id,
    boundary: room.boundary,
    placements: Array.isArray(room.placements)
      ? room.placements.filter((entry): entry is Record<string, unknown> => Boolean(asRecord(entry)))
      : [],
    openings: Array.isArray(room.openings)
      ? room.openings.filter((entry): entry is Record<string, unknown> => Boolean(asRecord(entry)))
      : [],
    placementsChanged: false,
    openingsChanged: false,
  }

  cache.set(roomId, state)
  return state
}

export async function applyDrawingGroupTransform(params: {
  prisma: PrismaLike
  group: DrawingGroupRecord
  transform: GroupTransformInput
}): Promise<GroupOperationResult> {
  const result = createResult()
  const members = toMemberArray(params.group.members_json)
  const config = toConfig(params.group.config_json)

  if (config.locked === true) {
    result.blocked = true
    result.skipped = members.length
    result.skipped_reasons.push('Group is locked and cannot be transformed')
    return result
  }

  const translate = params.transform.translate ?? { x_mm: 0, y_mm: 0 }
  const rotationDeg = params.transform.rotation_deg ?? 0
  const pivot = params.transform.pivot ?? { x_mm: 0, y_mm: 0 }

  if (Math.abs(translate.x_mm) < 1e-6 && Math.abs(translate.y_mm) < 1e-6 && Math.abs(rotationDeg) < 1e-6) {
    return result
  }

  const roomCache = new Map<string, RoomState | null>()

  const skip = (reason: string) => {
    result.skipped += 1
    if (result.skipped_reasons.length < 24) {
      result.skipped_reasons.push(reason)
    }
  }

  for (const member of members) {
    if (member.entity_type === 'dimension') {
      const dimension = await params.prisma.dimension.findUnique({
        where: { id: member.entity_id },
        select: { id: true, room_id: true, points: true, locked: true },
      }) as { id: string; room_id: string; points: unknown; locked: boolean } | null

      if (!dimension) {
        skip(`Dimension ${member.entity_id} not found`)
        continue
      }

      if (dimension.locked) {
        skip(`Dimension ${member.entity_id} is locked`)
        continue
      }

      const room = await loadRoomState(params.prisma, roomCache, dimension.room_id)
      if (!room || room.project_id !== params.group.project_id) {
        skip(`Dimension ${member.entity_id} is outside project scope`)
        continue
      }

      const points = parsePointArray(dimension.points)
      if (points.length === 0) {
        skip(`Dimension ${member.entity_id} has invalid points`)
        continue
      }

      const nextPoints = points.map((point) => transformPoint(point, { translate, rotationDeg, pivot }))
      await params.prisma.dimension.update({
        where: { id: dimension.id },
        data: { points: nextPoints as object[] },
      })
      result.updated.dimensions += 1
      continue
    }

    if (member.entity_type === 'centerline') {
      const centerline = await params.prisma.centerline.findUnique({
        where: { id: member.entity_id },
        select: { id: true, room_id: true, x0_mm: true, y0_mm: true, x1_mm: true, y1_mm: true },
      }) as {
        id: string
        room_id: string
        x0_mm: number
        y0_mm: number
        x1_mm: number
        y1_mm: number
      } | null

      if (!centerline) {
        skip(`Centerline ${member.entity_id} not found`)
        continue
      }

      const room = await loadRoomState(params.prisma, roomCache, centerline.room_id)
      if (!room || room.project_id !== params.group.project_id) {
        skip(`Centerline ${member.entity_id} is outside project scope`)
        continue
      }

      const p0 = transformPoint({ x_mm: centerline.x0_mm, y_mm: centerline.y0_mm }, { translate, rotationDeg, pivot })
      const p1 = transformPoint({ x_mm: centerline.x1_mm, y_mm: centerline.y1_mm }, { translate, rotationDeg, pivot })

      await params.prisma.centerline.update({
        where: { id: centerline.id },
        data: {
          x0_mm: p0.x_mm,
          y0_mm: p0.y_mm,
          x1_mm: p1.x_mm,
          y1_mm: p1.y_mm,
        },
      })
      result.updated.centerlines += 1
      continue
    }

    if (!member.room_id) {
      skip(`${member.entity_type} ${member.entity_id} has no room_id`)
      continue
    }

    const room = await loadRoomState(params.prisma, roomCache, member.room_id)
    if (!room) {
      skip(`Room ${member.room_id} not found`)
      continue
    }

    if (room.project_id !== params.group.project_id) {
      skip(`Room ${member.room_id} is outside project scope`)
      continue
    }

    const applyOffset = (entry: Record<string, unknown>) => {
      const wallId = typeof entry.wall_id === 'string' ? entry.wall_id : null
      if (!wallId) return null

      const direction = wallDirection(room.boundary, wallId)
      if (!direction) return null

      const offset = asFiniteNumber(entry.offset_mm)
      if (offset == null) return null

      if (Math.abs(rotationDeg) > 1e-6) {
        return null
      }

      const deltaOffset = translate.x_mm * direction.ux + translate.y_mm * direction.uy
      return Number(Math.max(0, offset + deltaOffset).toFixed(3))
    }

    if (member.entity_type === 'placement') {
      const index = room.placements.findIndex((entry) => entry.id === member.entity_id)
      if (index < 0) {
        skip(`Placement ${member.entity_id} not found in room ${room.id}`)
        continue
      }

      const current = room.placements[index]
      if (current.locked === true) {
        skip(`Placement ${member.entity_id} is locked`)
        continue
      }

      const nextOffset = applyOffset(current)
      if (nextOffset == null) {
        skip(`Placement ${member.entity_id} cannot be transformed on current wall geometry`)
        continue
      }

      room.placements[index] = {
        ...current,
        offset_mm: nextOffset,
      }
      room.placementsChanged = true
      result.updated.placements += 1
      continue
    }

    if (member.entity_type === 'opening') {
      const index = room.openings.findIndex((entry) => entry.id === member.entity_id)
      if (index < 0) {
        skip(`Opening ${member.entity_id} not found in room ${room.id}`)
        continue
      }

      const current = room.openings[index]
      if (current.locked === true) {
        skip(`Opening ${member.entity_id} is locked`)
        continue
      }

      const nextOffset = applyOffset(current)
      if (nextOffset == null) {
        skip(`Opening ${member.entity_id} cannot be transformed on current wall geometry`)
        continue
      }

      room.openings[index] = {
        ...current,
        offset_mm: nextOffset,
      }
      room.openingsChanged = true
      result.updated.openings += 1
      continue
    }
  }

  for (const room of roomCache.values()) {
    if (!room) continue
    if (!room.placementsChanged && !room.openingsChanged) continue

    const data: Record<string, unknown> = {}
    if (room.placementsChanged) {
      data.placements = room.placements as object[]
    }
    if (room.openingsChanged) {
      data.openings = room.openings as object[]
    }

    await params.prisma.room.update({
      where: { id: room.id },
      data,
    })
  }

  return result
}

export async function applyDrawingGroupConfigSync(params: {
  prisma: PrismaLike
  group: DrawingGroupRecord
  config: DrawingGroupConfig
}): Promise<GroupOperationResult> {
  const result = createResult()
  const members = toMemberArray(params.group.members_json)

  const hasVisibilityPatch = typeof params.config.visible === 'boolean'
  const hasLockPatch = typeof params.config.locked === 'boolean'
  if (!hasVisibilityPatch && !hasLockPatch) {
    return result
  }

  const roomCache = new Map<string, RoomState | null>()

  const skip = (reason: string) => {
    result.skipped += 1
    if (result.skipped_reasons.length < 24) {
      result.skipped_reasons.push(reason)
    }
  }

  for (const member of members) {
    if (member.entity_type === 'dimension') {
      const dimension = await params.prisma.dimension.findUnique({
        where: { id: member.entity_id },
        select: { id: true, room_id: true },
      }) as { id: string; room_id: string } | null

      if (!dimension) {
        skip(`Dimension ${member.entity_id} not found`)
        continue
      }

      const room = await loadRoomState(params.prisma, roomCache, dimension.room_id)
      if (!room || room.project_id !== params.group.project_id) {
        skip(`Dimension ${member.entity_id} is outside project scope`)
        continue
      }

      const patch: Record<string, unknown> = {}
      if (hasVisibilityPatch) {
        patch.visible = params.config.visible as boolean
      }
      if (hasLockPatch) {
        const locked = params.config.locked as boolean
        patch.locked = locked
        patch.lock_scope = lockScopeFor(locked, params.config.lock_scope)
      }

      await params.prisma.dimension.update({
        where: { id: dimension.id },
        data: patch,
      })

      result.updated.dimensions += 1
      continue
    }

    if (member.entity_type === 'centerline') {
      skip(`Centerline ${member.entity_id} does not support lock/visibility flags`)
      continue
    }

    if (!member.room_id) {
      skip(`${member.entity_type} ${member.entity_id} has no room_id`)
      continue
    }

    const room = await loadRoomState(params.prisma, roomCache, member.room_id)
    if (!room) {
      skip(`Room ${member.room_id} not found`)
      continue
    }

    if (room.project_id !== params.group.project_id) {
      skip(`Room ${member.room_id} is outside project scope`)
      continue
    }

    if (member.entity_type === 'placement') {
      const index = room.placements.findIndex((entry) => entry.id === member.entity_id)
      if (index < 0) {
        skip(`Placement ${member.entity_id} not found in room ${room.id}`)
        continue
      }

      const current = room.placements[index]
      room.placements[index] = {
        ...current,
        ...(hasVisibilityPatch
          ? { visible: params.config.visible as boolean, is_hidden: !(params.config.visible as boolean) }
          : {}),
        ...(hasLockPatch
          ? {
              locked: params.config.locked as boolean,
              lock_scope: lockScopeFor(params.config.locked as boolean, params.config.lock_scope),
            }
          : {}),
      }
      room.placementsChanged = true
      result.updated.placements += 1
      continue
    }

    if (member.entity_type === 'opening') {
      const index = room.openings.findIndex((entry) => entry.id === member.entity_id)
      if (index < 0) {
        skip(`Opening ${member.entity_id} not found in room ${room.id}`)
        continue
      }

      const current = room.openings[index]
      room.openings[index] = {
        ...current,
        ...(hasVisibilityPatch
          ? { visible: params.config.visible as boolean, is_hidden: !(params.config.visible as boolean) }
          : {}),
        ...(hasLockPatch
          ? {
              locked: params.config.locked as boolean,
              lock_scope: lockScopeFor(params.config.locked as boolean, params.config.lock_scope),
            }
          : {}),
      }
      room.openingsChanged = true
      result.updated.openings += 1
      continue
    }
  }

  for (const room of roomCache.values()) {
    if (!room) continue
    if (!room.placementsChanged && !room.openingsChanged) continue

    const data: Record<string, unknown> = {}
    if (room.placementsChanged) {
      data.placements = room.placements as object[]
    }
    if (room.openingsChanged) {
      data.openings = room.openings as object[]
    }

    await params.prisma.room.update({
      where: { id: room.id },
      data,
    })
  }

  return result
}

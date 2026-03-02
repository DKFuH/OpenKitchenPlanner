export interface WallSegment {
  id: string
  x0_mm: number
  y0_mm: number
  x1_mm: number
  y1_mm: number
  has_opening?: boolean
}

export interface RoomGeometry {
  wall_segments: WallSegment[]
  ceiling_height_mm: number
}

export interface MacroPosition {
  wall_id: string | null
  offset_mm: number
  article_id: string
  width_mm: number
  depth_mm: number
  height_mm: number
}

export interface LayoutSuggestion {
  layout_type: 'einzeiler' | 'zweizeiler' | 'l_form' | 'u_form' | 'insel'
  positions: MacroPosition[]
  score: number
  reason: string
}

const MIN_WALL_MM = 1200
const MODULE_WIDTH = 600
const MODULE_DEPTH = 600
const MODULE_HEIGHT = 720

function wallLength(wall: WallSegment): number {
  return Math.hypot(wall.x1_mm - wall.x0_mm, wall.y1_mm - wall.y0_mm)
}

function wallAngleDeg(wall: WallSegment): number {
  return Math.atan2(wall.y1_mm - wall.y0_mm, wall.x1_mm - wall.x0_mm) * (180 / Math.PI)
}

function arePerpendicularWalls(a: WallSegment, b: WallSegment): boolean {
  const diff = Math.abs(wallAngleDeg(a) - wallAngleDeg(b))
  return Math.abs((diff % 180) - 90) < 15
}

function areParallelWalls(a: WallSegment, b: WallSegment): boolean {
  const diff = Math.abs(wallAngleDeg(a) - wallAngleDeg(b))
  return diff < 15 || Math.abs(diff - 180) < 15
}

function buildPositions(wall: WallSegment, count: number): MacroPosition[] {
  const positions: MacroPosition[] = []
  for (let index = 0; index < count; index += 1) {
    positions.push({
      wall_id: wall.id,
      offset_mm: index * MODULE_WIDTH,
      article_id: 'placeholder-unterschrank-60',
      width_mm: MODULE_WIDTH,
      depth_mm: MODULE_DEPTH,
      height_mm: MODULE_HEIGHT,
    })
  }
  return positions
}

export function suggestLayouts(room: RoomGeometry): LayoutSuggestion[] {
  const usableWalls = room.wall_segments.filter((wall) => !wall.has_opening && wallLength(wall) >= MIN_WALL_MM)

  if (usableWalls.length === 0) {
    return []
  }

  const suggestions: LayoutSuggestion[] = []
  const longest = [...usableWalls].sort((a, b) => wallLength(b) - wallLength(a))[0]

  const einzeilerCount = Math.floor(wallLength(longest) / MODULE_WIDTH)
  if (einzeilerCount >= 2) {
    suggestions.push({
      layout_type: 'einzeiler',
      positions: buildPositions(longest, einzeilerCount),
      score: Math.min(1, (einzeilerCount * MODULE_WIDTH) / wallLength(longest)),
      reason: `Längste Wand (${Math.round(wallLength(longest))} mm) – ${einzeilerCount} Module`,
    })
  }

  const perpendicularWalls = usableWalls.filter((wall) => wall.id !== longest.id && arePerpendicularWalls(wall, longest))
  if (perpendicularWalls.length > 0) {
    const sideWall = perpendicularWalls.sort((a, b) => wallLength(b) - wallLength(a))[0]
    const countA = Math.floor(wallLength(longest) / MODULE_WIDTH)
    const countB = Math.floor(wallLength(sideWall) / MODULE_WIDTH)

    if (countA >= 2 && countB >= 1) {
      suggestions.push({
        layout_type: 'l_form',
        positions: [...buildPositions(longest, countA), ...buildPositions(sideWall, countB)],
        score: Math.min(1, ((countA + countB) * MODULE_WIDTH) / (wallLength(longest) + wallLength(sideWall))),
        reason: `L-Form: ${Math.round(wallLength(longest))} mm + ${Math.round(wallLength(sideWall))} mm`,
      })
    }
  }

  const parallelWalls = usableWalls.filter((wall) => wall.id !== longest.id && areParallelWalls(wall, longest))
  if (parallelWalls.length >= 1 && perpendicularWalls.length >= 1) {
    const oppositeWall = parallelWalls[0]
    const connectingWall = perpendicularWalls[0]
    const countA = Math.floor(wallLength(longest) / MODULE_WIDTH)
    const countB = Math.floor(wallLength(connectingWall) / MODULE_WIDTH)
    const countC = Math.floor(wallLength(oppositeWall) / MODULE_WIDTH)

    if (countA >= 2 && countC >= 2) {
      suggestions.push({
        layout_type: 'u_form',
        positions: [
          ...buildPositions(longest, countA),
          ...buildPositions(connectingWall, countB),
          ...buildPositions(oppositeWall, countC),
        ],
        score: 0.9,
        reason: `U-Form: ${countA + countB + countC} Module an 3 Wänden`,
      })
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 3)
}

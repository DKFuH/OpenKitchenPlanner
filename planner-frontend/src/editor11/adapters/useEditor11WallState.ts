import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react'
import type { Vertex } from '@shared/types'
import type { ProjectElevationEntry } from '../../api/rooms.js'
import type { Opening } from '../../api/openings.js'
import type { Placement } from '../../api/placements.js'
import { buildDimensionAssistSegments } from '../../editor/roomTopology.js'

interface WallSegmentState {
  id: string
  visible?: boolean
  is_hidden?: boolean
  locked?: boolean
}

interface UseEditor11WallStateArgs {
  projectElevations: ProjectElevationEntry[]
  selectedRoomId: string | null
  selectedEdgeIndex: number | null
  selectedWallSegment: WallSegmentState | null
  wallIds: string[]
  vertices: Vertex[]
  setSelectedElevationWallIndex: Dispatch<SetStateAction<number>>
  edgeLengthMm: number | null
  openings: Opening[]
  placements: Placement[]
}

function resolveWallVisible(segment: WallSegmentState | null): boolean {
  if (!segment) return true
  if (typeof segment.visible === 'boolean') return segment.visible
  if (typeof segment.is_hidden === 'boolean') return !segment.is_hidden
  return true
}

export function useEditor11WallState({
  projectElevations,
  selectedRoomId,
  selectedEdgeIndex,
  selectedWallSegment,
  wallIds,
  vertices,
  setSelectedElevationWallIndex,
  edgeLengthMm,
  openings,
  placements,
}: UseEditor11WallStateArgs) {
  const elevationsForSelectedRoom = useMemo(
    () => projectElevations.filter((entry) => entry.room_id === selectedRoomId),
    [projectElevations, selectedRoomId],
  )

  const selectedWallId = selectedEdgeIndex !== null
    ? (selectedWallSegment?.id ?? wallIds[selectedEdgeIndex] ?? null)
    : null

  useEffect(() => {
    if (elevationsForSelectedRoom.length === 0) {
      setSelectedElevationWallIndex(0)
      return
    }

    setSelectedElevationWallIndex((previous) => {
      if (elevationsForSelectedRoom.some((entry) => entry.wall_index === previous)) {
        return previous
      }
      return elevationsForSelectedRoom[0].wall_index
    })
  }, [elevationsForSelectedRoom, setSelectedElevationWallIndex])

  useEffect(() => {
    if (!selectedWallId || !selectedRoomId || elevationsForSelectedRoom.length === 0) {
      return
    }

    const matchingElevation = elevationsForSelectedRoom.find((entry) => entry.wall_id === selectedWallId)
    if (!matchingElevation) {
      return
    }

    setSelectedElevationWallIndex((previous) => (
      previous === matchingElevation.wall_index ? previous : matchingElevation.wall_index
    ))
  }, [elevationsForSelectedRoom, selectedRoomId, selectedWallId, setSelectedElevationWallIndex])

  const selectedWallGeom = useMemo(() => {
    const i = selectedEdgeIndex
    if (i === null) return null
    const v0 = vertices[i]
    const v1 = vertices[(i + 1) % vertices.length]
    if (!v0 || !v1) return null
    const wallId = selectedWallId ?? wallIds[i]
    if (!wallId) return null
    return { id: wallId, start: { x_mm: v0.x_mm, y_mm: v0.y_mm }, end: { x_mm: v1.x_mm, y_mm: v1.y_mm } }
  }, [selectedEdgeIndex, selectedWallId, vertices, wallIds])

  const dimensionAssistSegments = useMemo(() => {
    if (!selectedWallId || edgeLengthMm == null) {
      return []
    }
    return buildDimensionAssistSegments(selectedWallId, edgeLengthMm, openings, placements)
  }, [edgeLengthMm, openings, placements, selectedWallId])

  return {
    elevationsForSelectedRoom,
    selectedWallId,
    selectedWallGeom,
    dimensionAssistSegments,
    selectedWallVisible: selectedWallSegment ? resolveWallVisible(selectedWallSegment) : null,
    selectedWallLocked: selectedWallSegment ? Boolean(selectedWallSegment.locked) : null,
  }
}

import { useEffect, useMemo, useRef } from 'react'
import type { ProjectDetail } from '../../api/projects.js'
import type { RoomPayload } from '../../api/rooms.js'
import type { Opening } from '../../api/openings.js'
import type { Placement } from '../../api/placements.js'
import type { VerticalConnection } from '../../api/verticalConnections.js'

function extractVerticalConnectionRoomId(entry: VerticalConnection): string | null {
  const footprint = entry.footprint_json
  const roomId = footprint?.room_id
  if (typeof roomId === 'string' && roomId.trim().length > 0) {
    return roomId.trim()
  }
  return null
}

interface UseEditor11RoomContextArgs {
  project: ProjectDetail | null
  activeLevelId: string | null
  selectedRoomId: string | null
  openings: Opening[]
  selectedOpeningId: string | null
  placements: Placement[]
  selectedPlacementId: string | null
  verticalConnections: VerticalConnection[]
}

export function useEditor11RoomContext({
  project,
  activeLevelId,
  selectedRoomId,
  openings,
  selectedOpeningId,
  placements,
  selectedPlacementId,
  verticalConnections,
}: UseEditor11RoomContextArgs) {
  const selectedRoomRef = useRef<RoomPayload | null>(null)
  const openingsRef = useRef<Opening[]>(openings)
  const placementsRef = useRef<Placement[]>(placements)

  openingsRef.current = openings
  placementsRef.current = placements

  const roomsOnActiveLevel = useMemo(() => {
    if (!project) {
      return []
    }

    if (!activeLevelId) {
      return project.rooms
    }

    return project.rooms.filter((room) => room.level_id === activeLevelId)
  }, [activeLevelId, project])

  const selectedRoom = useMemo(
    () => roomsOnActiveLevel.find((room) => room.id === selectedRoomId) ?? null,
    [roomsOnActiveLevel, selectedRoomId],
  )

  useEffect(() => {
    selectedRoomRef.current = selectedRoom as RoomPayload | null
  }, [selectedRoom])

  const verticalConnectionsForSelectedRoom = useMemo(() => {
    if (!selectedRoomId) {
      return []
    }

    return verticalConnections.filter((entry) => extractVerticalConnectionRoomId(entry) === selectedRoomId)
  }, [selectedRoomId, verticalConnections])

  const selectedOpening = useMemo(
    () => openings.find((opening) => opening.id === selectedOpeningId) ?? null,
    [openings, selectedOpeningId],
  )

  const selectedPlacement = useMemo(
    () => placements.find((placement) => placement.id === selectedPlacementId) ?? null,
    [placements, selectedPlacementId],
  )

  return {
    selectedRoomRef,
    openingsRef,
    placementsRef,
    roomsOnActiveLevel,
    selectedRoom,
    verticalConnectionsForSelectedRoom,
    selectedOpening,
    selectedPlacement,
  }
}

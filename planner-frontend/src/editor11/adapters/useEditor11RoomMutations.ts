import { useCallback } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { roomsApi, type RoomPayload } from '../../api/rooms.js'
import type { ProjectDetail } from '../../api/projects.js'

interface UseEditor11RoomMutationsArgs {
  project: ProjectDetail | null
  activeLevelId: string | null
  levels: Array<{ id: string }>
  resetToSelection: () => void
  selectedRoomRef: MutableRefObject<RoomPayload | null>
  setProject: Dispatch<SetStateAction<ProjectDetail | null>>
  setSelectedRoomId: Dispatch<SetStateAction<string | null>>
}

export function useEditor11RoomMutations({
  project,
  activeLevelId,
  levels,
  resetToSelection,
  selectedRoomRef,
  setProject,
  setSelectedRoomId,
}: UseEditor11RoomMutationsArgs) {
  const handleAddRoom = useCallback(async (name: string) => {
    if (!project) {
      return
    }

    const targetLevelId = activeLevelId ?? levels[0]?.id ?? undefined
    const newRoom = await roomsApi.create({
      project_id: project.id,
      ...(targetLevelId ? { level_id: targetLevelId } : {}),
      name,
      boundary: { vertices: [], wall_segments: [] },
    })

    setProject((previous) => (previous
      ? { ...previous, rooms: [...previous.rooms, newRoom as unknown as ProjectDetail['rooms'][0]] }
      : previous))
    setSelectedRoomId(newRoom.id)
    resetToSelection()
  }, [activeLevelId, levels, project, resetToSelection, setProject, setSelectedRoomId])

  const handleRoomUpdated = useCallback((updated: RoomPayload) => {
    selectedRoomRef.current = updated
    setProject((previous) => {
      if (!previous) {
        return previous
      }

      return {
        ...previous,
        rooms: previous.rooms.map((room) => (room.id === updated.id ? updated as unknown as typeof room : room)),
      }
    })
  }, [selectedRoomRef, setProject])

  return {
    handleAddRoom,
    handleRoomUpdated,
  }
}

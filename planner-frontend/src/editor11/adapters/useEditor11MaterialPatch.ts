import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ProjectDetail } from '../../api/projects.js'
import type { Placement } from '../../api/placements.js'

interface UseEditor11MaterialPatchArgs {
  selectedRoomId: string | null
  setProject: Dispatch<SetStateAction<ProjectDetail | null>>
  setPlacements: Dispatch<SetStateAction<Placement[]>>
}

export function useEditor11MaterialPatch({
  selectedRoomId,
  setProject,
  setPlacements,
}: UseEditor11MaterialPatchArgs) {
  return useCallback((roomId: string, patch: { coloring: unknown; placements: Placement[] }) => {
    setProject((previous) => {
      if (!previous) {
        return previous
      }

      return {
        ...previous,
        rooms: previous.rooms.map((room) => (
          room.id === roomId
            ? {
                ...room,
                coloring: patch.coloring,
                placements: patch.placements,
              }
            : room
        )),
      }
    })

    if (selectedRoomId === roomId) {
      setPlacements(patch.placements)
    }
  }, [selectedRoomId, setPlacements, setProject])
}

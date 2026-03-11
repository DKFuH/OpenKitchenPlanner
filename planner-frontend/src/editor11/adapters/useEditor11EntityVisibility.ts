import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ProjectDetail } from '../../api/projects.js'
import { visibilityApi, type AutoDollhousePatch, type AutoDollhouseSettings } from '../../api/visibility.js'

interface WallSegmentFlags {
  id: string
  visible?: boolean
  is_hidden?: boolean
  locked?: boolean
  lock_scope?: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null
}

function updateBoundaryWallSegment(boundary: unknown, wallId: string, patch: Partial<WallSegmentFlags>): unknown {
  const candidate = asRecord(boundary)
  if (!candidate) {
    return boundary
  }

  const wallSegments = Array.isArray(candidate.wall_segments) ? candidate.wall_segments : null
  if (!wallSegments) {
    return boundary
  }

  let changed = false
  const nextSegments = wallSegments.map((segment) => {
    const record = asRecord(segment)
    if (!record || record.id !== wallId) {
      return segment
    }
    changed = true
    return { ...record, ...patch }
  })

  if (!changed) {
    return boundary
  }

  return { ...candidate, wall_segments: nextSegments }
}

interface UseEditor11EntityVisibilityArgs {
  projectId: string | null
  selectedRoomId: string | null
  selectedPlacementId: string | null
  selectedWallId: string | null
  setProject: Dispatch<SetStateAction<ProjectDetail | null>>
  setPlacements: Dispatch<SetStateAction<import('../../api/placements.js').Placement[]>>
  setAutoDollhouseSettings: Dispatch<SetStateAction<AutoDollhouseSettings | null>>
  setAutoDollhouseSaving: Dispatch<SetStateAction<boolean>>
}

export function useEditor11EntityVisibility({
  projectId,
  selectedRoomId,
  selectedPlacementId,
  selectedWallId,
  setProject,
  setPlacements,
  setAutoDollhouseSettings,
  setAutoDollhouseSaving,
}: UseEditor11EntityVisibilityArgs) {
  const patchSelectedRoomWallSegment = useCallback((roomId: string, wallId: string, patch: Partial<WallSegmentFlags>) => {
    setProject((previous) => {
      if (!previous) {
        return previous
      }

      return {
        ...previous,
        rooms: previous.rooms.map((room) => {
          if (room.id !== roomId) {
            return room
          }

          const nextBoundary = updateBoundaryWallSegment(room.boundary, wallId, patch)
          if (nextBoundary === room.boundary) {
            return room
          }

          return {
            ...room,
            boundary: nextBoundary,
          }
        }),
      }
    })
  }, [setProject])

  const handleSetSelectedPlacementLocked = useCallback((next: boolean) => {
    if (!projectId || !selectedRoomId || !selectedPlacementId) {
      return
    }

    void visibilityApi.applyLocks(projectId, {
      placements: [{
        room_id: selectedRoomId,
        placement_id: selectedPlacementId,
        locked: next,
        lock_scope: next ? 'manual' : undefined,
      }],
    })
      .then(() => {
        setPlacements((previous) => previous.map((placement) => (
          placement.id === selectedPlacementId
            ? {
                ...placement,
                locked: next,
                lock_scope: next ? 'manual' : null,
              }
            : placement
        )))
      })
      .catch((lockError: Error) => {
        console.error('S88: Placement-Lock konnte nicht gesetzt werden:', lockError)
      })
  }, [projectId, selectedPlacementId, selectedRoomId, setPlacements])

  const handleSetSelectedWallVisible = useCallback((next: boolean) => {
    if (!projectId || !selectedRoomId || !selectedWallId) {
      return
    }

    void visibilityApi.applyVisibility(projectId, {
      walls: [{
        room_id: selectedRoomId,
        wall_id: selectedWallId,
        visible: next,
      }],
    })
      .then(() => {
        patchSelectedRoomWallSegment(selectedRoomId, selectedWallId, {
          visible: next,
          is_hidden: !next,
        })
      })
      .catch((visibilityError: Error) => {
        console.error('S88: Wand-Sichtbarkeit konnte nicht angewendet werden:', visibilityError)
      })
  }, [patchSelectedRoomWallSegment, projectId, selectedRoomId, selectedWallId])

  const handleSetSelectedWallLocked = useCallback((next: boolean) => {
    if (!projectId || !selectedRoomId || !selectedWallId) {
      return
    }

    void visibilityApi.applyLocks(projectId, {
      walls: [{
        room_id: selectedRoomId,
        wall_id: selectedWallId,
        locked: next,
        lock_scope: next ? 'manual' : undefined,
      }],
    })
      .then(() => {
        patchSelectedRoomWallSegment(selectedRoomId, selectedWallId, {
          locked: next,
          lock_scope: next ? 'manual' : null,
        })
      })
      .catch((lockError: Error) => {
        console.error('S88: Wand-Lock konnte nicht gesetzt werden:', lockError)
      })
  }, [patchSelectedRoomWallSegment, projectId, selectedRoomId, selectedWallId])

  const handleSaveAutoDollhouse = useCallback((patch: AutoDollhousePatch) => {
    if (!projectId) {
      return
    }

    setAutoDollhouseSaving(true)
    void visibilityApi.updateAutoDollhouse(projectId, patch)
      .then((settings) => {
        setAutoDollhouseSettings(settings)
      })
      .catch((settingsError: Error) => {
        console.error('S105: Auto-Dollhouse Einstellungen konnten nicht gespeichert werden:', settingsError)
      })
      .finally(() => {
        setAutoDollhouseSaving(false)
      })
  }, [projectId, setAutoDollhouseSaving, setAutoDollhouseSettings])

  return {
    handleSetSelectedPlacementLocked,
    handleSetSelectedWallVisible,
    handleSetSelectedWallLocked,
    handleSaveAutoDollhouse,
  }
}

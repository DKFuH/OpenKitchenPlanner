import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { levelsApi, type BuildingLevel } from '../../api/levels.js'
import { visibilityApi } from '../../api/visibility.js'
import type { Dimension } from '../../api/dimensions.js'
import type { Placement } from '../../api/placements.js'

interface UseEditor11VisibilityMutationsArgs {
  projectId: string | null
  activeLevelId: string | null
  levels: BuildingLevel[]
  dimensions: Dimension[]
  placements: Placement[]
  selectedRoomId: string | null
  setLevels: Dispatch<SetStateAction<BuildingLevel[]>>
  setActiveLevelId: Dispatch<SetStateAction<string | null>>
  setDimensions: Dispatch<SetStateAction<Dimension[]>>
  setPlacements: Dispatch<SetStateAction<Placement[]>>
}

export function useEditor11VisibilityMutations({
  projectId,
  activeLevelId,
  levels,
  dimensions,
  placements,
  selectedRoomId,
  setLevels,
  setActiveLevelId,
  setDimensions,
  setPlacements,
}: UseEditor11VisibilityMutationsArgs) {
  const handleCreateLevel = useCallback(async (payload: { name: string; elevation_mm: number }) => {
    if (!projectId) {
      return
    }

    const created = await levelsApi.create(projectId, payload)
    setLevels((previous) => [...previous, created].sort((left, right) => left.order_index - right.order_index))
    setActiveLevelId(created.id)
  }, [projectId, setActiveLevelId, setLevels])

  const handleToggleLevelVisibility = useCallback((level: BuildingLevel) => {
    levelsApi.update(level.id, { visible: !level.visible })
      .then((updated) => {
        setLevels((previous) => {
          const next = previous.map((entry) => (entry.id === updated.id ? updated : entry))
          return next.sort((left, right) => left.order_index - right.order_index)
        })

        if (!updated.visible && activeLevelId === updated.id) {
          setActiveLevelId((previousLevelId) => {
            if (previousLevelId !== updated.id) {
              return previousLevelId
            }
            const fallback = levels.find((entry) => entry.id !== updated.id && entry.visible)
            return fallback?.id ?? null
          })
        }
      })
      .catch((toggleError: Error) => {
        console.error('Ebene-Sichtbarkeit konnte nicht gespeichert werden:', toggleError)
      })
  }, [activeLevelId, levels, setActiveLevelId, setLevels])

  const handleSetActiveLevelVisibility = useCallback((next: boolean) => {
    if (!projectId || !activeLevelId) {
      return
    }

    void visibilityApi.applyVisibility(projectId, {
      levels: [{ level_id: activeLevelId, visible: next }],
    })
      .then(() => {
        setLevels((previous) => {
          const updated = previous
            .map((entry) => (entry.id === activeLevelId ? { ...entry, visible: next } : entry))
            .sort((left, right) => left.order_index - right.order_index)

          if (!next) {
            const fallback = updated.find((entry) => entry.id !== activeLevelId && entry.visible)
            setActiveLevelId((current) => (current === activeLevelId ? (fallback?.id ?? null) : current))
          }

          return updated
        })
      })
      .catch((visibilityError: Error) => {
        console.error('S88: Ebene-Sichtbarkeit konnte nicht angewendet werden:', visibilityError)
      })
  }, [activeLevelId, projectId, setActiveLevelId, setLevels])

  const handleSetDimensionsVisible = useCallback((next: boolean) => {
    if (!projectId || dimensions.length === 0) {
      return
    }

    void visibilityApi.applyVisibility(projectId, {
      dimensions: dimensions.map((dimension) => ({
        dimension_id: dimension.id,
        visible: next,
      })),
    })
      .then(() => {
        setDimensions((previous) => previous.map((dimension) => ({ ...dimension, visible: next })))
      })
      .catch((visibilityError: Error) => {
        console.error('S88: Dimensions-Sichtbarkeit konnte nicht angewendet werden:', visibilityError)
      })
  }, [dimensions, projectId, setDimensions])

  const handleSetPlacementsVisible = useCallback((next: boolean) => {
    if (!projectId || !selectedRoomId || placements.length === 0) {
      return
    }

    void visibilityApi.applyVisibility(projectId, {
      placements: placements.map((placement) => ({
        room_id: selectedRoomId,
        placement_id: placement.id,
        visible: next,
      })),
    })
      .then(() => {
        setPlacements((previous) => previous.map((placement) => ({ ...placement, visible: next })))
      })
      .catch((visibilityError: Error) => {
        console.error('S88: Placement-Sichtbarkeit konnte nicht angewendet werden:', visibilityError)
      })
  }, [placements, projectId, selectedRoomId, setPlacements])

  const handleSetActiveLevelLocked = useCallback((next: boolean) => {
    if (!projectId || !activeLevelId) {
      return
    }

    void visibilityApi.applyLocks(projectId, {
      levels: [{
        level_id: activeLevelId,
        locked: next,
        lock_scope: next ? 'manual' : undefined,
      }],
    })
      .then(() => {
        setLevels((previous) => previous.map((entry) => (
          entry.id === activeLevelId
            ? { ...entry, locked: next, lock_scope: next ? 'manual' : null }
            : entry
        )))
      })
      .catch((lockError: Error) => {
        console.error('S88: Level-Lock konnte nicht gesetzt werden:', lockError)
      })
  }, [activeLevelId, projectId, setLevels])

  const handleSetDimensionsLocked = useCallback((next: boolean) => {
    if (!projectId || dimensions.length === 0) {
      return
    }

    void visibilityApi.applyLocks(projectId, {
      dimensions: dimensions.map((dimension) => ({
        dimension_id: dimension.id,
        locked: next,
        lock_scope: next ? 'manual' : undefined,
      })),
    })
      .then(() => {
        setDimensions((previous) => previous.map((dimension) => ({
          ...dimension,
          locked: next,
          lock_scope: next ? 'manual' : null,
        })))
      })
      .catch((lockError: Error) => {
        console.error('S88: Dimensions-Lock konnte nicht gesetzt werden:', lockError)
      })
  }, [dimensions, projectId, setDimensions])

  return {
    handleCreateLevel,
    handleToggleLevelVisibility,
    handleSetActiveLevelVisibility,
    handleSetDimensionsVisible,
    handleSetPlacementsVisible,
    handleSetActiveLevelLocked,
    handleSetDimensionsLocked,
  }
}

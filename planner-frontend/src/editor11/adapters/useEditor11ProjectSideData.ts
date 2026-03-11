import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { areasApi } from '../../api/areas.js'
import { drawingGroupsApi, type DrawingGroup } from '../../api/drawingGroups.js'

interface UseEditor11ProjectSideDataArgs {
  projectId: string | null
  selectedAlternativeId: string | null
  setSelectedAlternativeId: Dispatch<SetStateAction<string | null>>
  setBulkDeliveredMessage: Dispatch<SetStateAction<string | null>>
  setBulkDeliveredError: Dispatch<SetStateAction<boolean>>
  setDrawingGroups: Dispatch<SetStateAction<DrawingGroup[]>>
  setSelectedDrawingGroupId: Dispatch<SetStateAction<string | null>>
}

export function useEditor11ProjectSideData({
  projectId,
  selectedAlternativeId,
  setSelectedAlternativeId,
  setBulkDeliveredMessage,
  setBulkDeliveredError,
  setDrawingGroups,
  setSelectedDrawingGroupId,
}: UseEditor11ProjectSideDataArgs) {
  useEffect(() => {
    if (!projectId) {
      setSelectedAlternativeId(null)
      return
    }

    areasApi.list(projectId)
      .then((areas) => {
        const allAlternatives = areas.flatMap((area) => area.alternatives)
        const preferred = allAlternatives.find((alternative) => alternative.is_active) ?? allAlternatives[0] ?? null
        setSelectedAlternativeId(preferred?.id ?? null)
      })
      .catch(() => {
        setSelectedAlternativeId(null)
      })
  }, [projectId, setSelectedAlternativeId])

  useEffect(() => {
    setBulkDeliveredMessage(null)
    setBulkDeliveredError(false)
  }, [selectedAlternativeId, setBulkDeliveredError, setBulkDeliveredMessage])

  useEffect(() => {
    if (!projectId) {
      setDrawingGroups([])
      setSelectedDrawingGroupId(null)
      return
    }

    let active = true
    drawingGroupsApi.list(projectId)
      .then((groups) => {
        if (!active) {
          return
        }
        setDrawingGroups(groups)
        setSelectedDrawingGroupId((previous) => (
          previous && groups.some((group) => group.id === previous) ? previous : null
        ))
      })
      .catch(() => {
        if (!active) {
          return
        }
        setDrawingGroups([])
        setSelectedDrawingGroupId(null)
      })

    return () => {
      active = false
    }
  }, [projectId, setDrawingGroups, setSelectedDrawingGroupId])
}

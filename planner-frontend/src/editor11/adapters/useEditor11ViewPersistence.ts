import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ProjectElevationEntry, RoomBoundaryPayload } from '../../api/rooms.js'
import { roomsApi } from '../../api/rooms.js'
import type { PlannerViewMode } from '../../pages/plannerViewSettings.js'
import { loadPlannerViewSettings, savePlannerViewSettings } from '../../pages/plannerViewSettings.js'
import type { NavigationSettings } from '../../components/editor/navigationSettings.js'
import { resolveNavigationSettings } from '../../components/editor/navigationSettings.js'
import type { Vertex } from '@shared/types'

interface UseEditor11ViewPersistenceArgs {
  projectId: string | null
  selectedRoom: { boundary: unknown } | null
  viewMode: PlannerViewMode
  splitRatio: number
  split3PrimaryRatio: number
  split3SecondaryRatio: number
  showVirtualVisitor: boolean
  cameraHeightMm: number
  navigationSettings: NavigationSettings
  setProjectElevations: Dispatch<SetStateAction<ProjectElevationEntry[]>>
  updateCameraState: (patch: Partial<{ x_mm: number; y_mm: number; camera_height_mm: number }>) => void
  setViewMode: Dispatch<SetStateAction<PlannerViewMode>>
  setSplitRatio: Dispatch<SetStateAction<number>>
  setSplit3PrimaryRatio: Dispatch<SetStateAction<number>>
  setSplit3SecondaryRatio: Dispatch<SetStateAction<number>>
  setShowVirtualVisitor: Dispatch<SetStateAction<boolean>>
  setCameraHeightMm: Dispatch<SetStateAction<number>>
  setNavigationSettings: Dispatch<SetStateAction<NavigationSettings>>
}

export function useEditor11ViewPersistence({
  projectId,
  selectedRoom,
  viewMode,
  splitRatio,
  split3PrimaryRatio,
  split3SecondaryRatio,
  showVirtualVisitor,
  cameraHeightMm,
  navigationSettings,
  setProjectElevations,
  updateCameraState,
  setViewMode,
  setSplitRatio,
  setSplit3PrimaryRatio,
  setSplit3SecondaryRatio,
  setShowVirtualVisitor,
  setCameraHeightMm,
  setNavigationSettings,
}: UseEditor11ViewPersistenceArgs) {
  useEffect(() => {
    if (!projectId) {
      setProjectElevations([])
      return
    }

    let active = true
    roomsApi.listElevations(projectId)
      .then((payload) => {
        if (active) {
          setProjectElevations(payload.elevations)
        }
      })
      .catch(() => {
        if (active) {
          setProjectElevations([])
        }
      })

    return () => {
      active = false
    }
  }, [projectId, setProjectElevations])

  useEffect(() => {
    if (!selectedRoom) {
      return
    }

    const boundary = selectedRoom.boundary as RoomBoundaryPayload | undefined
    const vertices = (boundary?.vertices ?? []) as Vertex[]
    if (vertices.length < 1) {
      return
    }

    const sum = vertices.reduce(
      (acc, vertex) => ({
        x_mm: acc.x_mm + vertex.x_mm,
        y_mm: acc.y_mm + vertex.y_mm,
      }),
      { x_mm: 0, y_mm: 0 },
    )

    updateCameraState({
      x_mm: Math.round(sum.x_mm / vertices.length),
      y_mm: Math.round(sum.y_mm / vertices.length),
      camera_height_mm: cameraHeightMm,
    })
  }, [cameraHeightMm, selectedRoom, updateCameraState])

  useEffect(() => {
    if (!projectId) {
      return
    }

    const saved = loadPlannerViewSettings(projectId)
    if (!saved) {
      setViewMode(window.innerWidth < 1180 ? '2d' : 'split3')
      return
    }

    setViewMode(saved.mode)
    setSplitRatio(saved.split_ratio)
    setSplit3PrimaryRatio(saved.split3_primary_ratio)
    setSplit3SecondaryRatio(saved.split3_secondary_ratio)
    setShowVirtualVisitor(saved.visitor_visible)
    setCameraHeightMm(saved.camera_height_mm)
    setNavigationSettings(resolveNavigationSettings(saved))
  }, [
    projectId,
    setCameraHeightMm,
    setNavigationSettings,
    setShowVirtualVisitor,
    setSplit3PrimaryRatio,
    setSplit3SecondaryRatio,
    setSplitRatio,
    setViewMode,
  ])

  useEffect(() => {
    updateCameraState({
      camera_height_mm: cameraHeightMm,
    })
  }, [cameraHeightMm, updateCameraState])

  useEffect(() => {
    if (!projectId) {
      return
    }

    savePlannerViewSettings(projectId, {
      mode: viewMode,
      split_ratio: splitRatio,
      split3_primary_ratio: split3PrimaryRatio,
      split3_secondary_ratio: split3SecondaryRatio,
      visitor_visible: showVirtualVisitor,
      camera_height_mm: cameraHeightMm,
      ...navigationSettings,
    })
  }, [
    cameraHeightMm,
    navigationSettings,
    projectId,
    showVirtualVisitor,
    split3PrimaryRatio,
    split3SecondaryRatio,
    splitRatio,
    viewMode,
  ])
}

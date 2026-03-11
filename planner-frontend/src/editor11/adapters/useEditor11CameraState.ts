import { useCallback, useState } from 'react'
import type { CameraPreset } from '../../api/cameraPresets.js'
import { clampPresetFov, presetToCameraState, type SyncedCameraState } from '../../components/editor/cameraPresetState.js'
import { clampNumber } from '../../pages/plannerViewSettings.js'

export function useEditor11CameraState() {
  const [showVirtualVisitor, setShowVirtualVisitor] = useState(false)
  const [cameraHeightMm, setCameraHeightMm] = useState(1650)
  const [cameraFovDeg, setCameraFovDeg] = useState(55)
  const [cameraState, setCameraState] = useState<SyncedCameraState>({
    x_mm: 0,
    y_mm: 0,
    yaw_rad: 0,
    pitch_rad: -0.12,
    camera_height_mm: 1650,
  })

  const handleRepositionVisitor = useCallback((point: { x_mm: number; y_mm: number }) => {
    setCameraState((prev) => ({
      ...prev,
      x_mm: point.x_mm,
      y_mm: point.y_mm,
    }))
  }, [])

  const handleCameraStateChange = useCallback((next: SyncedCameraState) => {
    setCameraState((prev) => {
      const stable =
        Math.abs(prev.x_mm - next.x_mm) < 1 &&
        Math.abs(prev.y_mm - next.y_mm) < 1 &&
        Math.abs(prev.camera_height_mm - next.camera_height_mm) < 1 &&
        Math.abs(prev.yaw_rad - next.yaw_rad) < 0.0005 &&
        Math.abs(prev.pitch_rad - next.pitch_rad) < 0.0005
      return stable ? prev : next
    })
    setCameraHeightMm(clampNumber(Math.round(next.camera_height_mm), 900, 2400))
  }, [])

  const applyCameraPresetLocally = useCallback((preset: CameraPreset) => {
    const nextState = presetToCameraState(preset)
    setCameraState(nextState)
    setCameraHeightMm(clampNumber(Math.round(nextState.camera_height_mm), 900, 2400))
    setCameraFovDeg(clampPresetFov(preset.fov))
    if (preset.mode === 'visitor') {
      setShowVirtualVisitor(true)
    }
  }, [])

  return {
    showVirtualVisitor,
    setShowVirtualVisitor,
    cameraHeightMm,
    setCameraHeightMm,
    cameraFovDeg,
    setCameraFovDeg,
    cameraState,
    setCameraState,
    handleRepositionVisitor,
    handleCameraStateChange,
    applyCameraPresetLocally,
  }
}

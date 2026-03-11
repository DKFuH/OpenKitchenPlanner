import { useCallback, useEffect, useRef, useState } from 'react'
import { cameraPresetsApi, type CameraPreset } from '../../api/cameraPresets.js'
import { cameraStateToPresetPayload, type SyncedCameraState } from '../../components/editor/cameraPresetState.js'

interface SaveCameraPresetPayload {
  name: string
  mode: 'orbit' | 'visitor'
  isDefault: boolean
}

interface UseEditor11CameraPresetsArgs {
  projectId: string | null
  cameraState: SyncedCameraState
  cameraFovDeg: number
  applyCameraPresetLocally: (preset: CameraPreset) => void
}

export function useEditor11CameraPresets({
  projectId,
  cameraState,
  cameraFovDeg,
  applyCameraPresetLocally,
}: UseEditor11CameraPresetsArgs) {
  const autoAppliedRef = useRef(false)
  const [cameraPresets, setCameraPresets] = useState<CameraPreset[]>([])
  const [activeCameraPresetId, setActiveCameraPresetId] = useState<string | null>(null)
  const [cameraPresetLoading, setCameraPresetLoading] = useState(false)
  const [cameraPresetSaving, setCameraPresetSaving] = useState(false)

  const handleSaveCurrentPreset = useCallback((payload: SaveCameraPresetPayload) => {
    if (!projectId) {
      return
    }

    setCameraPresetSaving(true)
    void cameraPresetsApi.create(projectId, cameraStateToPresetPayload({
      name: payload.name,
      state: cameraState,
      fovDeg: cameraFovDeg,
      mode: payload.mode,
      isDefault: payload.isDefault,
    }))
      .then((result) => {
        setCameraPresets(result.presets)
        setActiveCameraPresetId(result.active_preset_id)
        autoAppliedRef.current = true
      })
      .catch((presetError: Error) => {
        console.error('S106: Kamera-Preset konnte nicht gespeichert werden:', presetError)
      })
      .finally(() => {
        setCameraPresetSaving(false)
      })
  }, [cameraFovDeg, cameraState, projectId])

  const handleApplyPreset = useCallback((presetId: string) => {
    if (!projectId) {
      return
    }

    setCameraPresetSaving(true)
    void cameraPresetsApi.apply(projectId, presetId)
      .then((result) => {
        setActiveCameraPresetId(result.active_preset_id)
        applyCameraPresetLocally(result.preset)
        autoAppliedRef.current = true
      })
      .catch((presetError: Error) => {
        console.error('S106: Kamera-Preset konnte nicht angewendet werden:', presetError)
      })
      .finally(() => {
        setCameraPresetSaving(false)
      })
  }, [applyCameraPresetLocally, projectId])

  const handleDeletePreset = useCallback((presetId: string) => {
    if (!projectId) {
      return
    }

    setCameraPresetSaving(true)
    void cameraPresetsApi.remove(projectId, presetId)
      .then(() => {
        setCameraPresets((previous) => previous.filter((entry) => entry.id !== presetId))
        setActiveCameraPresetId((current) => (current === presetId ? null : current))
      })
      .catch((presetError: Error) => {
        console.error('S106: Kamera-Preset konnte nicht geloescht werden:', presetError)
      })
      .finally(() => {
        setCameraPresetSaving(false)
      })
  }, [projectId])

  const handleSetDefaultPreset = useCallback((presetId: string) => {
    if (!projectId) {
      return
    }

    setCameraPresetSaving(true)
    void cameraPresetsApi.update(projectId, presetId, { is_default: true })
      .then((result) => {
        setCameraPresets(result.presets)
      })
      .catch((presetError: Error) => {
        console.error('S106: Default-Kamera-Preset konnte nicht gesetzt werden:', presetError)
      })
      .finally(() => {
        setCameraPresetSaving(false)
      })
  }, [projectId])

  useEffect(() => {
    if (!projectId) {
      setCameraPresets([])
      setActiveCameraPresetId(null)
      autoAppliedRef.current = false
      return
    }

    autoAppliedRef.current = false
    let active = true
    setCameraPresetLoading(true)

    cameraPresetsApi.list(projectId)
      .then((result) => {
        if (!active) {
          return
        }

        setCameraPresets(result.presets)
        setActiveCameraPresetId(result.active_preset_id)

        if (autoAppliedRef.current) {
          return
        }

        const preferred = result.active_preset_id
          ? result.presets.find((entry) => entry.id === result.active_preset_id)
          : result.presets.find((entry) => entry.is_default)

        if (preferred) {
          applyCameraPresetLocally(preferred)
          setActiveCameraPresetId(preferred.id)
          autoAppliedRef.current = true
        }
      })
      .catch((presetError: Error) => {
        if (!active) {
          return
        }
        console.error('S106: Kamera-Presets konnten nicht geladen werden:', presetError)
        setCameraPresets([])
        setActiveCameraPresetId(null)
      })
      .finally(() => {
        if (!active) {
          return
        }
        setCameraPresetLoading(false)
      })

    return () => {
      active = false
    }
  }, [applyCameraPresetLocally, projectId])

  return {
    cameraPresets,
    activeCameraPresetId,
    cameraPresetLoading,
    cameraPresetSaving,
    handleSaveCurrentPreset,
    handleApplyPreset,
    handleDeletePreset,
    handleSetDefaultPreset,
    resetCameraPresetUiState: () => {
      setCameraPresets([])
      setActiveCameraPresetId(null)
      autoAppliedRef.current = false
    },
  }
}

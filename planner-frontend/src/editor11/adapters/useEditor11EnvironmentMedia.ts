import { useCallback } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { projectEnvironmentApi } from '../../api/projectEnvironment.js'
import { renderEnvironmentApi } from '../../api/renderEnvironment.js'
import { mediaCaptureApi } from '../../api/mediaCapture.js'
import type { ProjectEnvironment, SunPreview } from '../../plugins/daylight/index.js'
import {
  RENDER_ENVIRONMENT_PRESETS,
  normalizeRenderEnvironmentSettings,
  type RenderEnvironmentPreset,
  type RenderEnvironmentSettings,
} from '../../components/editor/renderEnvironmentState.js'
import {
  captureScreenshotFromRoot,
  normalizeScreenshotOptions,
  type ScreenshotOptions,
  type ScreenshotViewMode,
} from '../../components/editor/screenshotCapture.js'
import type { PlannerViewMode } from '../../pages/plannerViewSettings.js'

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

interface UseEditor11EnvironmentMediaArgs {
  projectId: string | null
  daylightEnabled: boolean
  compactLayout: boolean
  viewMode: PlannerViewMode
  renderEnvironmentSettings: RenderEnvironmentSettings
  screenshotOptions: ScreenshotOptions
  captureRootRef: MutableRefObject<HTMLDivElement | null>
  projectEnvironment: ProjectEnvironment | null
  setSunPreviewLoading: Dispatch<SetStateAction<boolean>>
  setSunPreview: Dispatch<SetStateAction<SunPreview | null>>
  setProjectEnvironment: Dispatch<SetStateAction<ProjectEnvironment | null>>
  setDaylightSaving: Dispatch<SetStateAction<boolean>>
  setRenderEnvironmentSettings: Dispatch<SetStateAction<RenderEnvironmentSettings>>
  setRenderEnvironmentPresets: Dispatch<SetStateAction<RenderEnvironmentPreset[]>>
  setRenderEnvironmentSaving: Dispatch<SetStateAction<boolean>>
  setScreenshotBusy: Dispatch<SetStateAction<boolean>>
  setScreenshotError: Dispatch<SetStateAction<boolean>>
  setScreenshotMessage: Dispatch<SetStateAction<string | null>>
  setExport360Busy: Dispatch<SetStateAction<boolean>>
}

export function useEditor11EnvironmentMedia({
  projectId,
  daylightEnabled,
  compactLayout,
  viewMode,
  renderEnvironmentSettings,
  screenshotOptions,
  captureRootRef,
  projectEnvironment,
  setSunPreviewLoading,
  setSunPreview,
  setProjectEnvironment,
  setDaylightSaving,
  setRenderEnvironmentSettings,
  setRenderEnvironmentPresets,
  setRenderEnvironmentSaving,
  setScreenshotBusy,
  setScreenshotError,
  setScreenshotMessage,
  setExport360Busy,
}: UseEditor11EnvironmentMediaArgs) {
  const refreshSunPreview = useCallback(async (nextProjectId: string, env: ProjectEnvironment | null) => {
    if (!env) {
      return
    }

    if (env.latitude == null || env.longitude == null) {
      setSunPreview(null)
      setSunPreviewLoading(false)
      return
    }

    setSunPreviewLoading(true)
    try {
      const preview = await projectEnvironmentApi.sunPreview(nextProjectId, {
        ...(env.default_datetime ? { datetime: env.default_datetime } : {}),
        ...(env.latitude != null ? { latitude: env.latitude } : {}),
        ...(env.longitude != null ? { longitude: env.longitude } : {}),
        north_angle_deg: env.north_angle_deg,
      })
      setSunPreview(preview)
    } catch {
      setSunPreview(null)
    } finally {
      setSunPreviewLoading(false)
    }
  }, [setSunPreview, setSunPreviewLoading])

  const handleDaylightPatch = useCallback((patch: Partial<ProjectEnvironment>) => {
    setProjectEnvironment((previous) => (previous ? { ...previous, ...patch } : previous))
  }, [setProjectEnvironment])

  const handleRenderEnvironmentChange = useCallback((next: RenderEnvironmentSettings) => {
    setRenderEnvironmentSettings(normalizeRenderEnvironmentSettings(next))
  }, [setRenderEnvironmentSettings])

  const handleSaveRenderEnvironment = useCallback(() => {
    if (!projectId) {
      return
    }

    setRenderEnvironmentSaving(true)
    void renderEnvironmentApi.update(projectId, renderEnvironmentSettings)
      .then((result) => {
        setRenderEnvironmentPresets(result.presets.length > 0 ? result.presets : RENDER_ENVIRONMENT_PRESETS)
        setRenderEnvironmentSettings(normalizeRenderEnvironmentSettings(result.active))
      })
      .catch((saveError: Error) => {
        console.error('S107: Render-Umgebung konnte nicht gespeichert werden:', saveError)
      })
      .finally(() => {
        setRenderEnvironmentSaving(false)
      })
  }, [projectId, renderEnvironmentSettings, setRenderEnvironmentPresets, setRenderEnvironmentSaving, setRenderEnvironmentSettings])

  const resolveScreenshotViewMode = useCallback((): ScreenshotViewMode => {
    const effective = compactLayout && (viewMode === 'split' || viewMode === 'split3') ? '2d' : viewMode
    if (effective === '3d') {
      return '3d'
    }
    if (effective === 'split' || effective === 'split3') {
      return 'split'
    }
    return '2d'
  }, [compactLayout, viewMode])

  const handleCaptureScreenshot = useCallback(async () => {
    if (!projectId) {
      return
    }

    const captureRoot = captureRootRef.current
    if (!captureRoot) {
      setScreenshotError(true)
      setScreenshotMessage('Screenshot fehlgeschlagen: kein aktiver Viewport gefunden')
      return
    }

    setScreenshotBusy(true)
    setScreenshotError(false)
    setScreenshotMessage(null)

    try {
      const mode = resolveScreenshotViewMode()
      const normalizedOptions = normalizeScreenshotOptions(screenshotOptions)
      const capture = captureScreenshotFromRoot(captureRoot, mode, normalizedOptions)
      const extension = normalizedOptions.format === 'jpeg' ? 'jpg' : 'png'

      const result = await mediaCaptureApi.uploadScreenshot(projectId, {
        ...capture,
        filename: `screenshot-${Date.now()}.${extension}`,
        view_mode: mode,
        transparent_background: normalizedOptions.transparent_background,
        uploaded_by: 'planner-frontend',
      })

      setScreenshotMessage(`Screenshot gespeichert: ${result.filename}`)
      if (result.preview_url) {
        window.open(result.preview_url, '_blank', 'noopener,noreferrer')
      }
    } catch (captureError) {
      setScreenshotError(true)
      setScreenshotMessage(`Screenshot fehlgeschlagen: ${String(captureError)}`)
    } finally {
      setScreenshotBusy(false)
    }
  }, [captureRootRef, projectId, resolveScreenshotViewMode, screenshotOptions, setScreenshotBusy, setScreenshotError, setScreenshotMessage])

  const handleStartExport360 = useCallback(async () => {
    if (!projectId) {
      return
    }

    setExport360Busy(true)
    setScreenshotError(false)
    setScreenshotMessage('360-Export wird gestartet...')

    try {
      const normalizedOptions = normalizeScreenshotOptions(screenshotOptions)
      const request = await mediaCaptureApi.createExport360(projectId, {
        format: normalizedOptions.format,
        quality: normalizedOptions.quality,
        width_px: normalizedOptions.width_px ?? 4096,
        height_px: normalizedOptions.height_px ?? 2048,
        environment: renderEnvironmentSettings,
      })

      for (let attempt = 0; attempt < 45; attempt += 1) {
        const status = await mediaCaptureApi.getExport360Status(projectId, request.job_id)
        setScreenshotMessage(`360-Status: ${status.status}`)

        if (status.status === 'done') {
          if (status.download_url) {
            window.open(status.download_url, '_blank', 'noopener,noreferrer')
            setScreenshotMessage('360-Export abgeschlossen und geoeffnet')
          } else {
            setScreenshotMessage('360-Export abgeschlossen (kein Download-Link)')
          }
          return
        }

        if (status.status === 'failed') {
          throw new Error(status.error_message ?? '360-Export fehlgeschlagen')
        }

        await delay(1000)
      }

      throw new Error('360-Export laeuft noch. Bitte spaeter erneut pruefen.')
    } catch (exportError) {
      setScreenshotError(true)
      setScreenshotMessage(`360-Export fehlgeschlagen: ${String(exportError)}`)
    } finally {
      setExport360Busy(false)
    }
  }, [projectId, renderEnvironmentSettings, screenshotOptions, setExport360Busy, setScreenshotError, setScreenshotMessage])

  const handleSaveDaylightEnvironment = useCallback(async () => {
    if (!projectId || !projectEnvironment) {
      return
    }

    setDaylightSaving(true)
    try {
      const updated = await projectEnvironmentApi.update(projectId, {
        north_angle_deg: projectEnvironment.north_angle_deg,
        latitude: projectEnvironment.latitude,
        longitude: projectEnvironment.longitude,
        timezone: projectEnvironment.timezone,
        default_datetime: projectEnvironment.default_datetime,
        daylight_enabled: projectEnvironment.daylight_enabled,
      })
      const normalized: ProjectEnvironment = {
        ...updated,
        config_json: updated.config_json ?? {},
      }
      setProjectEnvironment(normalized)
      await refreshSunPreview(projectId, normalized)
    } catch (saveError) {
      alert(`Tageslicht-Einstellungen konnten nicht gespeichert werden: ${String(saveError)}`)
    } finally {
      setDaylightSaving(false)
    }
  }, [projectEnvironment, projectId, refreshSunPreview, setDaylightSaving, setProjectEnvironment])

  const handleRefreshSunPreview = useCallback(async () => {
    if (!projectId || !daylightEnabled || !projectEnvironment) {
      return
    }

    await refreshSunPreview(projectId, projectEnvironment)
  }, [daylightEnabled, projectEnvironment, projectId, refreshSunPreview])

  return {
    refreshSunPreview,
    handleDaylightPatch,
    handleRenderEnvironmentChange,
    handleSaveRenderEnvironment,
    handleCaptureScreenshot,
    handleStartExport360,
    handleSaveDaylightEnvironment,
    handleRefreshSunPreview,
  }
}

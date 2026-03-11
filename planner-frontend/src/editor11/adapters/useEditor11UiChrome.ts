import { useCallback, useEffect } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { getTenantSettings, updateTenantSettings } from '../../api/tenantSettings.js'
import { resolveNavigationSettings, type NavigationSettings } from '../../components/editor/navigationSettings.js'

interface UseEditor11UiChromeArgs {
  hasProjectId: boolean
  hasSelectedRoom: boolean
  moreMenuOpen: boolean
  sectionMenuOpen: boolean
  toolboxMenuOpen: boolean
  navigationPanelOpen: boolean
  cameraPresetPanelOpen: boolean
  screenshotPanelOpen: boolean
  shortcutFeedback: string | null
  moreMenuRef: MutableRefObject<HTMLDivElement | null>
  sectionMenuRef: MutableRefObject<HTMLDivElement | null>
  toolboxMenuRef: MutableRefObject<HTMLDivElement | null>
  navigationPanelRef: MutableRefObject<HTMLDivElement | null>
  cameraPresetPanelRef: MutableRefObject<HTMLDivElement | null>
  screenshotPanelRef: MutableRefObject<HTMLDivElement | null>
  setMoreMenuOpen: Dispatch<SetStateAction<boolean>>
  setSectionMenuOpen: Dispatch<SetStateAction<boolean>>
  setToolboxMenuOpen: Dispatch<SetStateAction<boolean>>
  setNavigationPanelOpen: Dispatch<SetStateAction<boolean>>
  setCameraPresetPanelOpen: Dispatch<SetStateAction<boolean>>
  setScreenshotPanelOpen: Dispatch<SetStateAction<boolean>>
  setIsPreviewPopoutOpen: Dispatch<SetStateAction<boolean>>
  setCompactLayout: Dispatch<SetStateAction<boolean>>
  setNavigationSettings: Dispatch<SetStateAction<NavigationSettings>>
  setShortcutFeedback: Dispatch<SetStateAction<string | null>>
  resetCameraPresetUiState: () => void
}

function useDismissOnOutsideClick(
  open: boolean,
  ref: MutableRefObject<HTMLDivElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [close, open, ref])
}

export function useEditor11UiChrome({
  hasProjectId,
  hasSelectedRoom,
  moreMenuOpen,
  sectionMenuOpen,
  toolboxMenuOpen,
  navigationPanelOpen,
  cameraPresetPanelOpen,
  screenshotPanelOpen,
  shortcutFeedback,
  moreMenuRef,
  sectionMenuRef,
  toolboxMenuRef,
  navigationPanelRef,
  cameraPresetPanelRef,
  screenshotPanelRef,
  setMoreMenuOpen,
  setSectionMenuOpen,
  setToolboxMenuOpen,
  setNavigationPanelOpen,
  setCameraPresetPanelOpen,
  setScreenshotPanelOpen,
  setIsPreviewPopoutOpen,
  setCompactLayout,
  setNavigationSettings,
  setShortcutFeedback,
  resetCameraPresetUiState,
}: UseEditor11UiChromeArgs) {
  useDismissOnOutsideClick(moreMenuOpen, moreMenuRef, () => setMoreMenuOpen(false))
  useDismissOnOutsideClick(sectionMenuOpen, sectionMenuRef, () => setSectionMenuOpen(false))
  useDismissOnOutsideClick(toolboxMenuOpen, toolboxMenuRef, () => setToolboxMenuOpen(false))
  useDismissOnOutsideClick(navigationPanelOpen, navigationPanelRef, () => setNavigationPanelOpen(false))
  useDismissOnOutsideClick(cameraPresetPanelOpen, cameraPresetPanelRef, () => setCameraPresetPanelOpen(false))
  useDismissOnOutsideClick(screenshotPanelOpen, screenshotPanelRef, () => setScreenshotPanelOpen(false))

  useEffect(() => {
    const onResize = () => {
      setCompactLayout(window.innerWidth < 1180)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setCompactLayout])

  useEffect(() => {
    let active = true
    getTenantSettings()
      .then((settings) => {
        if (!active) {
          return
        }
        setNavigationSettings((current) => resolveNavigationSettings({
          ...(current ?? {}),
          ...settings,
        }))
      })
      .catch(() => {
        // optional
      })

    return () => {
      active = false
    }
  }, [setNavigationSettings])

  useEffect(() => {
    if (!shortcutFeedback) {
      return
    }

    const timer = window.setTimeout(() => {
      setShortcutFeedback(null)
    }, 2200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [setShortcutFeedback, shortcutFeedback])

  useEffect(() => {
    if (hasProjectId) {
      return
    }

    setCameraPresetPanelOpen(false)
    resetCameraPresetUiState()
  }, [hasProjectId, resetCameraPresetUiState, setCameraPresetPanelOpen])

  useEffect(() => {
    if (hasSelectedRoom) {
      return
    }

    setIsPreviewPopoutOpen(false)
  }, [hasSelectedRoom, setIsPreviewPopoutOpen])

  const handleNavigationSettingsChange = useCallback((next: NavigationSettings) => {
    setNavigationSettings(next)
    void updateTenantSettings({
      navigation_profile: next.navigation_profile,
      invert_y_axis: next.invert_y_axis,
      middle_mouse_pan: next.middle_mouse_pan,
      touchpad_mode: next.touchpad_mode,
      zoom_direction: next.zoom_direction,
    }).catch(() => {
      // keep local persistence as fallback
    })
  }, [setNavigationSettings])

  return {
    handleNavigationSettingsChange,
  }
}

import { useCallback, useEffect } from 'react'
import { usePolygonEditor } from '../../editor/usePolygonEditor.js'
import { useEditorModeStore } from '../../editor/editorModeStore.js'
import { getEditorModeForWorkflowStep, useWorkflowStateStore } from '../../editor/workflowStateStore.js'
import { useAppShellEditorBridge } from '../../components/layout/AppShellEditorBridge.js'
import { parseReferenceImage } from './editor11PageHelpers.js'
import { useEditor11AppShellBridge } from './useEditor11AppShellBridge.js'
import { useEditor11CameraState } from './useEditor11CameraState.js'
import { useEditor11PageDomainServices } from './useEditor11PageDomainServices.js'
import { useEditor11InitialData } from './useEditor11InitialData.js'
import { useEditor11MaterialPatch } from './useEditor11MaterialPatch.js'
import { useEditor11PageState } from './useEditor11PageState.js'
import { useEditor11ProjectSideData } from './useEditor11ProjectSideData.js'
import { useEditor11RoomViewportSync } from './useEditor11RoomViewportSync.js'
import { useEditor11SplitLayout } from './useEditor11SplitLayout.js'
import { useEditor11UiChrome } from './useEditor11UiChrome.js'
import { useEditor11ViewPersistence } from './useEditor11ViewPersistence.js'
import {
  DEFAULT_PLANNER_SPLIT3_PRIMARY_RATIO,
  DEFAULT_PLANNER_SPLIT3_SECONDARY_RATIO,
  DEFAULT_PLANNER_SPLIT_RATIO,
  DEFAULT_PLANNER_VIEW_MODE,
} from '../../pages/plannerViewSettings.js'

interface Editor11PageServiceRefs {
  moreMenuRef: React.RefObject<HTMLDivElement | null>
  sectionMenuRef: React.RefObject<HTMLDivElement | null>
  toolboxMenuRef: React.RefObject<HTMLDivElement | null>
  navigationPanelRef: React.RefObject<HTMLDivElement | null>
  cameraPresetPanelRef: React.RefObject<HTMLDivElement | null>
  screenshotPanelRef: React.RefObject<HTMLDivElement | null>
  captureRootRef: React.RefObject<HTMLDivElement | null>
  splitContainerRef: React.RefObject<HTMLDivElement | null>
}

interface UseEditor11PageServicesArgs {
  projectId: string | null
  unknownUserLabel: string
  appShellBridge: ReturnType<typeof useAppShellEditorBridge>
  pageState: ReturnType<typeof useEditor11PageState>
  camera: ReturnType<typeof useEditor11CameraState>
  editor: ReturnType<typeof usePolygonEditor>
  editorMode: ReturnType<typeof useEditorModeStore>
  workflow: ReturnType<typeof useWorkflowStateStore>
  refs: Editor11PageServiceRefs
  resetCameraPresetUiState: () => void
}

export function useEditor11PageServices({
  projectId,
  unknownUserLabel,
  appShellBridge,
  pageState,
  camera,
  editor,
  editorMode,
  workflow,
  refs,
  resetCameraPresetUiState,
}: UseEditor11PageServicesArgs) {
  useEditor11InitialData({
    projectId,
    selectedRoomId: pageState.selectedRoomId,
    daylightEnabled: pageState.daylightEnabled,
    stairsEnabled: pageState.stairsEnabled,
    multilevelDocsEnabled: pageState.multilevelDocsEnabled,
    setProject: pageState.setProject,
    setProjectLockState: pageState.setProjectLockState,
    setSelectedRoomId: pageState.setSelectedRoomId,
    setError: pageState.setError,
    setLoading: pageState.setLoading,
    setLevels: pageState.setLevels,
    setActiveLevelId: pageState.setActiveLevelId,
    setTenantPlugins: pageState.setTenantPlugins,
    setPresentationEnabled: pageState.setPresentationEnabled,
    setDaylightEnabled: pageState.setDaylightEnabled,
    setMaterialsEnabled: pageState.setMaterialsEnabled,
    setStairsEnabled: pageState.setStairsEnabled,
    setMultilevelDocsEnabled: pageState.setMultilevelDocsEnabled,
    setAcousticEnabled: pageState.setAcousticEnabled,
    setVerticalConnections: pageState.setVerticalConnections,
    setAutoDollhouseSettings: pageState.setAutoDollhouseSettings,
    setRenderEnvironmentPanelOpen: pageState.setRenderEnvironmentPanelOpen,
    setRenderEnvironmentSettings: pageState.setRenderEnvironmentSettings,
    setRenderEnvironmentPresets: pageState.setRenderEnvironmentPresets,
    setSectionLines: pageState.setSectionLines,
    setSelectedSectionLineId: pageState.setSelectedSectionLineId,
    setProjectEnvironment: pageState.setProjectEnvironment,
    setSunPreview: pageState.setSunPreview,
    setSunPreviewLoading: pageState.setSunPreviewLoading,
  })

  useEffect(() => {
    editorMode.setMode(getEditorModeForWorkflowStep(workflow.step))
  }, [editorMode.setMode, workflow.step])

  const {
    environmentMedia,
    acoustics,
    actionStates,
    sidebarPluginSlots,
    visibility,
    documentation,
    roomOperations,
  } = useEditor11PageDomainServices({
    projectId,
    pageState,
    editor,
    editorMode,
    captureRootRef: refs.captureRootRef,
  })

  useEditor11SplitLayout({
    splitContainerRef: refs.splitContainerRef,
    activeSplitDrag: pageState.activeSplitDrag,
    splitRatio: pageState.splitRatio,
    setSplitRatio: pageState.setSplitRatio,
    setActiveSplitDrag: pageState.setActiveSplitDrag,
  })

  useEditor11ProjectSideData({
    projectId,
    selectedAlternativeId: pageState.selectedAlternativeId,
    setSelectedAlternativeId: pageState.setSelectedAlternativeId,
    setBulkDeliveredMessage: pageState.setBulkDeliveredMessage,
    setBulkDeliveredError: pageState.setBulkDeliveredError,
    setDrawingGroups: pageState.setDrawingGroups,
    setSelectedDrawingGroupId: pageState.setSelectedDrawingGroupId,
  })

  useEditor11RoomViewportSync({
    project: pageState.project,
    selectedRoomId: pageState.selectedRoomId,
    editor,
    parseReferenceImage,
    setSelectedOpeningId: pageState.setSelectedOpeningId,
    setSelectedPlacementId: pageState.setSelectedPlacementId,
    setOpenings: pageState.setOpenings,
    setPlacements: pageState.setPlacements,
    setDimensions: pageState.setDimensions,
    setCenterlines: pageState.setCenterlines,
  })

  const updateCameraState = useCallback((patch: Partial<{ x_mm: number; y_mm: number; camera_height_mm: number }>) => {
    camera.setCameraState((previous) => {
      const next = {
        ...previous,
        ...patch,
      }
      const unchanged =
        previous.x_mm === next.x_mm &&
        previous.y_mm === next.y_mm &&
        previous.camera_height_mm === next.camera_height_mm

      return unchanged ? previous : next
    })
  }, [camera.setCameraState])

  useEditor11ViewPersistence({
    projectId,
    selectedRoom: roomOperations.selectedRoom,
    viewMode: pageState.viewMode,
    splitRatio: pageState.splitRatio,
    split3PrimaryRatio: pageState.split3PrimaryRatio,
    split3SecondaryRatio: pageState.split3SecondaryRatio,
    showVirtualVisitor: camera.showVirtualVisitor,
    cameraHeightMm: camera.cameraHeightMm,
    navigationSettings: pageState.navigationSettings,
    setProjectElevations: pageState.setProjectElevations,
    updateCameraState,
    setViewMode: pageState.setViewMode,
    setSplitRatio: pageState.setSplitRatio,
    setSplit3PrimaryRatio: pageState.setSplit3PrimaryRatio,
    setSplit3SecondaryRatio: pageState.setSplit3SecondaryRatio,
    setShowVirtualVisitor: camera.setShowVirtualVisitor,
    setCameraHeightMm: camera.setCameraHeightMm,
    setNavigationSettings: pageState.setNavigationSettings,
  })

  const { handleNavigationSettingsChange } = useEditor11UiChrome({
    hasProjectId: Boolean(projectId),
    hasSelectedRoom: Boolean(roomOperations.selectedRoom),
    moreMenuOpen: pageState.moreMenuOpen,
    sectionMenuOpen: pageState.sectionMenuOpen,
    toolboxMenuOpen: pageState.toolboxMenuOpen,
    navigationPanelOpen: pageState.navigationPanelOpen,
    cameraPresetPanelOpen: pageState.cameraPresetPanelOpen,
    screenshotPanelOpen: pageState.screenshotPanelOpen,
    shortcutFeedback: pageState.shortcutFeedback,
    moreMenuRef: refs.moreMenuRef,
    sectionMenuRef: refs.sectionMenuRef,
    toolboxMenuRef: refs.toolboxMenuRef,
    navigationPanelRef: refs.navigationPanelRef,
    cameraPresetPanelRef: refs.cameraPresetPanelRef,
    screenshotPanelRef: refs.screenshotPanelRef,
    setMoreMenuOpen: pageState.setMoreMenuOpen,
    setSectionMenuOpen: pageState.setSectionMenuOpen,
    setToolboxMenuOpen: pageState.setToolboxMenuOpen,
    setNavigationPanelOpen: pageState.setNavigationPanelOpen,
    setCameraPresetPanelOpen: pageState.setCameraPresetPanelOpen,
    setScreenshotPanelOpen: pageState.setScreenshotPanelOpen,
    setIsPreviewPopoutOpen: pageState.setIsPreviewPopoutOpen,
    setCompactLayout: pageState.setCompactLayout,
    setNavigationSettings: pageState.setNavigationSettings,
    setShortcutFeedback: pageState.setShortcutFeedback,
    resetCameraPresetUiState,
  })

  const handleMaterialRoomPatch = useEditor11MaterialPatch({
    selectedRoomId: pageState.selectedRoomId,
    setProject: pageState.setProject,
    setPlacements: pageState.setPlacements,
  })

  const activeLevel = pageState.levels.find((level) => level.id === pageState.activeLevelId) ?? null
  const dimensionsVisible = pageState.dimensions.length > 0
    ? pageState.dimensions.every((dimension) => dimension.visible !== false)
    : false
  const placementsVisible = pageState.placements.length > 0
    ? pageState.placements.every((placement) => placement.visible !== false)
    : false
  const dimensionsLocked = pageState.dimensions.length > 0
    ? pageState.dimensions.every((dimension) => dimension.locked === true)
    : false

  useEditor11AppShellBridge({
    appShellBridge,
    workflow,
    editorMode,
    modeLabel: editorMode.modeLabel,
    actionStates,
    tenantPlugins: pageState.tenantPlugins,
    project: pageState.project,
    projectLockState: pageState.projectLockState,
    viewMode: pageState.viewMode,
    currentMode: editorMode.mode,
    magnetismEnabled: editor.state.settings.magnetismEnabled,
    axisMagnetismEnabled: editor.state.settings.axisMagnetismEnabled,
    angleSnapEnabled: editor.state.settings.angleSnap,
    safeEditEnabled: pageState.safeEditMode,
    areasVisible: pageState.showAreasPanel,
    rightSidebarVisible: pageState.rightSidebarVisible,
    unknownUserLabel,
    onSetViewMode: pageState.setViewMode,
    onTogglePanel: (panel) => {
      if (panel === 'navigation') pageState.setNavigationPanelOpen((prev) => !prev)
      else if (panel === 'camera') pageState.setCameraPresetPanelOpen((prev) => !prev)
      else if (panel === 'capture') pageState.setScreenshotPanelOpen((prev) => !prev)
      else if (panel === 'renderEnvironment') pageState.setRenderEnvironmentPanelOpen((prev) => !prev)
      else if (panel === 'daylight') pageState.setDaylightPanelOpen((prev) => !prev)
      else if (panel === 'material') pageState.setMaterialPanelOpen((prev) => !prev)
      else if (panel === 'leftSidebar') pageState.setLeftSidebarVisible((prev) => !prev)
      else if (panel === 'rightSidebar') pageState.setRightSidebarVisible((prev) => !prev)
      else if (panel === 'stairs') pageState.setStairsPanelOpen((prev) => !prev)
      else if (panel === 'sections') pageState.setSectionsPanelOpen((prev) => !prev)
    },
    onScreenshot: () => { void environmentMedia.handleCaptureScreenshot() },
    onExport360: () => { void environmentMedia.handleStartExport360() },
    onAutocomplete: () => { void roomOperations.handleAutoComplete() },
    onGltfExport: () => { void roomOperations.handleGltfExport() },
    onMarkDelivered: () => { void roomOperations.handleMarkAllDelivered() },
    onImportDxf: () => { void roomOperations.handleImportFile('dxf') },
    onImportIfc: () => { void roomOperations.handleImportFile('ifc') },
    onImportSketchup: () => { void roomOperations.handleImportFile('sketchup') },
    onToggleMagnetism: () => {
      editor.updateSettings({ magnetismEnabled: !editor.state.settings.magnetismEnabled })
    },
    onToggleAxisMagnetism: () => {
      editor.updateSettings({ axisMagnetismEnabled: !editor.state.settings.axisMagnetismEnabled })
    },
    onToggleAngleSnap: () => {
      editor.updateSettings({ angleSnap: !editor.state.settings.angleSnap })
    },
    onToggleSafeEdit: () => {
      pageState.setSafeEditMode((prev) => !prev)
    },
    onToggleAreas: () => {
      pageState.setShowAreasPanel((prev) => !prev)
    },
    onToggleActiveLevelVisibility: () => {
      visibility.handleSetActiveLevelVisibility(!(activeLevel?.visible ?? true))
    },
    onToggleDimensionsVisibility: () => {
      visibility.handleSetDimensionsVisible(!dimensionsVisible)
    },
    onTogglePlacementsVisibility: () => {
      visibility.handleSetPlacementsVisible(!placementsVisible)
    },
    onToggleActiveLevelLock: () => {
      visibility.handleSetActiveLevelLocked(!(activeLevel?.locked ?? false))
    },
    onToggleDimensionsLock: () => {
      visibility.handleSetDimensionsLocked(!dimensionsLocked)
    },
    onResetWorkspaceLayout: () => {
      pageState.setViewMode(DEFAULT_PLANNER_VIEW_MODE)
      pageState.setSplitRatio(DEFAULT_PLANNER_SPLIT_RATIO)
      pageState.setSplit3PrimaryRatio(DEFAULT_PLANNER_SPLIT3_PRIMARY_RATIO)
      pageState.setSplit3SecondaryRatio(DEFAULT_PLANNER_SPLIT3_SECONDARY_RATIO)
      pageState.setRightSidebarVisible(true)
      pageState.setActiveSplitDrag(null)
    },
  })

  return {
    environmentMedia,
    acoustics,
    actionStates,
    sidebarPluginSlots,
    visibility,
    documentation,
    roomOperations,
    handleNavigationSettingsChange,
    handleMaterialRoomPatch,
  }
}

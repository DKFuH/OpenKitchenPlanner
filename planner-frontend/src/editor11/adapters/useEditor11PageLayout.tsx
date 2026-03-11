import type { ComponentProps } from 'react'
import { useEditor11CameraPresets } from './useEditor11CameraPresets.js'
import { useEditor11CameraState } from './useEditor11CameraState.js'
import { useEditor11DockPanels } from './useEditor11DockPanels.js'
import { useEditor11DocumentationMutations } from './useEditor11DocumentationMutations.js'
import { useEditor11EnvironmentMedia } from './useEditor11EnvironmentMedia.js'
import { useEditor11PageChrome } from './useEditor11PageChrome.js'
import { useEditor11PageState } from './useEditor11PageState.js'
import { useEditor11RoomOperations } from './useEditor11RoomOperations.js'
import { useEditor11SelectionOrchestration } from './useEditor11SelectionOrchestration.js'
import { useEditor11VisibilityMutations } from './useEditor11VisibilityMutations.js'
import { useEditor11WorkspaceView } from './useEditor11WorkspaceView.js'
import { Preview3DPopout } from '../viewports/Preview3DPopout.js'

interface UseEditor11PageLayoutArgs {
  styles: Record<string, string>
  projectId: string | null
  pageState: ReturnType<typeof useEditor11PageState>
  camera: ReturnType<typeof useEditor11CameraState>
  cameraPresetsState: ReturnType<typeof useEditor11CameraPresets>
  roomOperations: ReturnType<typeof useEditor11RoomOperations>
  selection: ReturnType<typeof useEditor11SelectionOrchestration>
  visibility: ReturnType<typeof useEditor11VisibilityMutations>
  documentation: ReturnType<typeof useEditor11DocumentationMutations>
  environmentMedia: ReturnType<typeof useEditor11EnvironmentMedia>
  handleNavigationSettingsChange: Parameters<typeof useEditor11DockPanels>[0]['navigationPanel']['onChange']
  handleMaterialRoomPatch: Parameters<typeof useEditor11DockPanels>[0]['materialPanel']['onApplied']
  effectiveViewMode: Parameters<typeof useEditor11WorkspaceView>[0]['effectiveViewMode']
  captureRootRef: Parameters<typeof useEditor11WorkspaceView>[0]['captureRootRef']
  splitContainerRef: Parameters<typeof useEditor11WorkspaceView>[0]['splitContainerRef']
  tripleEditorViewport: Parameters<typeof useEditor11WorkspaceView>[0]['tripleEditorViewport']
  sectionProjectionPanel: Parameters<typeof useEditor11WorkspaceView>[0]['sectionProjectionPanel']
  canvasPanel: Parameters<typeof useEditor11WorkspaceView>[0]['canvasPanel']
  previewPanel: Parameters<typeof useEditor11WorkspaceView>[0]['previewPanel']
  previewProps: ComponentProps<typeof Preview3DPopout>['previewProps']
}

export function useEditor11PageLayout({
  styles,
  projectId,
  pageState,
  camera,
  cameraPresetsState,
  roomOperations,
  selection,
  visibility,
  documentation,
  environmentMedia,
  handleNavigationSettingsChange,
  handleMaterialRoomPatch,
  effectiveViewMode,
  captureRootRef,
  splitContainerRef,
  tripleEditorViewport,
  sectionProjectionPanel,
  canvasPanel,
  previewPanel,
  previewProps,
}: UseEditor11PageLayoutArgs) {
  const selectedRoom = roomOperations.selectedRoom as Parameters<typeof useEditor11DockPanels>[0]['materialPanel']['room']

  const { dockPanels } = useEditor11DockPanels({
    classNames: {
      cameraDock: styles.cameraDock,
      navigationDock: styles.navigationDock,
      renderEnvironmentDock: styles.renderEnvironmentDock,
      importDock: styles.importDock,
      importNotice: styles.importNotice,
      importNoticeError: styles.importNoticeError,
      daylightDock: styles.daylightDock,
      daylightDockShifted: styles.daylightDockShifted,
      materialDock: styles.materialDock,
      materialDockShifted: styles.materialDockShifted,
      materialDockShiftedDouble: styles.materialDockShiftedDouble,
    },
    cameraPanel: {
      open: pageState.cameraPresetPanelOpen,
      presets: cameraPresetsState.cameraPresets,
      activePresetId: cameraPresetsState.activeCameraPresetId,
      loading: cameraPresetsState.cameraPresetLoading,
      saving: cameraPresetsState.cameraPresetSaving,
      cameraFovDeg: camera.cameraFovDeg,
      onSetCameraFovDeg: camera.setCameraFovDeg,
      onSaveCurrentPreset: cameraPresetsState.handleSaveCurrentPreset,
      onApplyPreset: cameraPresetsState.handleApplyPreset,
      onDeletePreset: cameraPresetsState.handleDeletePreset,
      onSetDefaultPreset: cameraPresetsState.handleSetDefaultPreset,
    },
    stairsPanel: {
      open: pageState.stairsPanelOpen,
      enabled: pageState.stairsEnabled,
      levels: pageState.levels,
      connections: pageState.verticalConnections,
      activeLevelId: pageState.activeLevelId,
      selectedRoomId: pageState.selectedRoomId,
      onCreate: documentation.handleCreateVerticalConnection,
      onUpdate: documentation.handleUpdateVerticalConnection,
      onDelete: documentation.handleDeleteVerticalConnection,
    },
    sectionsPanel: {
      open: pageState.sectionsPanelOpen,
      enabled: pageState.multilevelDocsEnabled,
      hasSelectedRoom: Boolean(pageState.selectedRoomId),
      activeLevelId: pageState.activeLevelId,
      levels: pageState.levels,
      sections: pageState.sectionLines,
      selectedSectionId: pageState.selectedSectionLineId,
      onSelect: pageState.setSelectedSectionLineId,
      onCreate: documentation.handleCreateSectionLine,
      onUpdate: documentation.handleUpdateSectionLine,
      onDelete: documentation.handleDeleteSectionLine,
    },
    navigationPanel: {
      open: pageState.navigationPanelOpen,
      settings: pageState.navigationSettings,
      onChange: handleNavigationSettingsChange,
    },
    renderEnvironmentPanel: {
      open: pageState.renderEnvironmentPanelOpen,
      presets: pageState.renderEnvironmentPresets,
      environment: pageState.renderEnvironmentSettings,
      saving: pageState.renderEnvironmentSaving,
      onChange: environmentMedia.handleRenderEnvironmentChange,
      onSave: environmentMedia.handleSaveRenderEnvironment,
    },
    importPanel: {
      open: pageState.importDockOpen,
      projectId,
      onJobUpdated: roomOperations.handleImportJobUpdated,
      notice: pageState.importNotice,
      noticeError: pageState.importNoticeError,
      activeImportJobId: pageState.activeImportJobId,
    },
    daylightPanel: {
      enabled: pageState.daylightEnabled,
      open: pageState.daylightPanelOpen,
      shifted: pageState.renderEnvironmentPanelOpen,
      environment: pageState.projectEnvironment,
      preview: pageState.sunPreview,
      loadingPreview: pageState.sunPreviewLoading,
      savingEnvironment: pageState.daylightSaving,
      onChange: environmentMedia.handleDaylightPatch,
      onSave: () => {
        void environmentMedia.handleSaveDaylightEnvironment()
      },
      onRefreshPreview: () => {
        void environmentMedia.handleRefreshSunPreview()
      },
    },
    materialPanel: {
      enabled: pageState.materialsEnabled,
      open: pageState.materialPanelOpen,
      shifted: pageState.renderEnvironmentPanelOpen && pageState.daylightEnabled && pageState.daylightPanelOpen
        ? 'double'
        : pageState.renderEnvironmentPanelOpen || (pageState.daylightEnabled && pageState.daylightPanelOpen)
          ? 'single'
          : 'none',
      projectId,
      room: selectedRoom,
      onApplied: handleMaterialRoomPatch,
    },
  })

  const { workspaceView } = useEditor11WorkspaceView({
    effectiveViewMode,
    classNames: {
      workspace: styles.workspace,
      editorViewport: styles.editorViewport,
      splitLayout: styles.splitLayout,
      splitPane: styles.splitPane,
      splitPanePrimary: styles.splitPanePrimary,
      splitPaneSecondary: styles.splitPaneSecondary,
      splitDivider: styles.splitDivider,
    },
    captureRootRef,
    splitContainerRef,
    onStartSplitDrag: () => pageState.setActiveSplitDrag('split'),
    tripleEditorViewport,
    sectionProjectionPanel,
    canvasPanel,
    previewPanel,
  })

  const { chromeNodes, statusBarNode } = useEditor11PageChrome({
    classNames: {
      bulkDeliveredError: styles.bulkDeliveredError,
      bulkDeliveredSuccess: styles.bulkDeliveredSuccess,
      shortcutFeedback: styles.shortcutFeedback,
    },
    bulkNotice: {
      message: pageState.bulkDeliveredMessage,
      error: pageState.bulkDeliveredError,
    },
    screenshotNotice: {
      message: pageState.screenshotMessage,
      error: pageState.screenshotError,
    },
    shortcutFeedback: pageState.shortcutFeedback,
    structure: {
      levels: pageState.levels,
      activeLevelId: pageState.activeLevelId,
      onSelectLevel: pageState.setActiveLevelId,
      onToggleLevelVisibility: visibility.handleToggleLevelVisibility,
      onCreateLevel: visibility.handleCreateLevel,
      rooms: roomOperations.roomsOnActiveLevel,
      selectedRoomId: pageState.selectedRoomId,
      onSelectRoom: selection.onSelectRoom,
      onAddRoom: roomOperations.handleAddRoom,
    },
    layoutTabs: {
      projectId,
      activeLevelId: pageState.activeLevelId,
      activeSheetId: pageState.activeLayoutSheetId,
      onSheetChange: pageState.setActiveLayoutSheetId,
      showDaylightOptions: pageState.daylightEnabled,
    },
    statusBar: {
      visible: pageState.statusBarVisible,
      project: pageState.project,
      selectedRoom,
    },
  })

  const previewPopoutNode = pageState.project
    ? (
        <Preview3DPopout
          open={pageState.isPreviewPopoutOpen}
          title={`${pageState.project.name} - 3D Preview`}
          name={`okp-preview-${pageState.project.id}`}
          onClose={() => pageState.setIsPreviewPopoutOpen(false)}
          previewProps={previewProps}
        />
      )
    : null

  return {
    dockPanels,
    workspaceView,
    chromeNodes,
    statusBarNode,
    previewPopoutNode,
  }
}

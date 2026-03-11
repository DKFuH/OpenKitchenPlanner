import { usePolygonEditor } from '../../editor/usePolygonEditor.js'
import { useEditorModeStore } from '../../editor/editorModeStore.js'
import { buildDefaultSectionLine, buildFootprintFromRoom, resolveArticlePriceForVariant, resolveArticleVariantId } from './editor11PageHelpers.js'
import { useEditor11Acoustics } from './useEditor11Acoustics.js'
import { useEditor11ActionOrchestration } from './useEditor11ActionOrchestration.js'
import { useEditor11DocumentationMutations } from './useEditor11DocumentationMutations.js'
import { useEditor11EnvironmentMedia } from './useEditor11EnvironmentMedia.js'
import { useEditor11PageState } from './useEditor11PageState.js'
import { useEditor11RoomOperations } from './useEditor11RoomOperations.js'
import { useEditor11VisibilityMutations } from './useEditor11VisibilityMutations.js'

interface UseEditor11PageDomainServicesArgs {
  projectId: string | null
  pageState: ReturnType<typeof useEditor11PageState>
  editor: ReturnType<typeof usePolygonEditor>
  editorMode: ReturnType<typeof useEditorModeStore>
  captureRootRef: React.RefObject<HTMLDivElement | null>
}

export function useEditor11PageDomainServices({
  projectId,
  pageState,
  editor,
  editorMode,
  captureRootRef,
}: UseEditor11PageDomainServicesArgs) {
  const environmentMedia = useEditor11EnvironmentMedia({
    projectId,
    daylightEnabled: pageState.daylightEnabled,
    compactLayout: pageState.compactLayout,
    viewMode: pageState.viewMode,
    renderEnvironmentSettings: pageState.renderEnvironmentSettings,
    screenshotOptions: pageState.screenshotOptions,
    captureRootRef,
    projectEnvironment: pageState.projectEnvironment,
    setSunPreviewLoading: pageState.setSunPreviewLoading,
    setSunPreview: pageState.setSunPreview,
    setProjectEnvironment: pageState.setProjectEnvironment,
    setDaylightSaving: pageState.setDaylightSaving,
    setRenderEnvironmentSettings: pageState.setRenderEnvironmentSettings,
    setRenderEnvironmentPresets: pageState.setRenderEnvironmentPresets,
    setRenderEnvironmentSaving: pageState.setRenderEnvironmentSaving,
    setScreenshotBusy: pageState.setScreenshotBusy,
    setScreenshotError: pageState.setScreenshotError,
    setScreenshotMessage: pageState.setScreenshotMessage,
    setExport360Busy: pageState.setExport360Busy,
  })

  const acoustics = useEditor11Acoustics({
    projectId,
    acousticEnabled: pageState.acousticEnabled,
    acousticVariable: pageState.acousticVariable,
    activeAcousticGridId: pageState.activeAcousticGridId,
    acousticGrids: pageState.acousticGrids,
    setAcousticGrids: pageState.setAcousticGrids,
    setActiveAcousticGridId: pageState.setActiveAcousticGridId,
    setAcousticEnabled: pageState.setAcousticEnabled,
    setAcousticBusy: pageState.setAcousticBusy,
    setAcousticVariable: pageState.setAcousticVariable,
    setAcousticGrid: pageState.setAcousticGrid,
    setAcousticMin: pageState.setAcousticMin,
    setAcousticMax: pageState.setAcousticMax,
  })

  const { actionStates, sidebarPluginSlots } = useEditor11ActionOrchestration({
    projectId,
    compactLayout: pageState.compactLayout,
    selectedRoomId: pageState.selectedRoomId,
    selectedSectionLineId: pageState.selectedSectionLineId,
    selectedAlternativeId: pageState.selectedAlternativeId,
    presentationEnabled: pageState.presentationEnabled,
    daylightEnabled: pageState.daylightEnabled,
    hasProjectEnvironment: Boolean(pageState.projectEnvironment),
    materialsEnabled: pageState.materialsEnabled,
    autoCompleteLoading: pageState.autoCompleteLoading,
    previewPopoutOpen: pageState.isPreviewPopoutOpen,
    gltfExportLoading: pageState.gltfExportLoading,
    bulkDeliveredLoading: pageState.bulkDeliveredLoading,
    screenshotBusy: pageState.screenshotBusy,
    export360Busy: pageState.export360Busy,
    tenantPlugins: pageState.tenantPlugins,
    shortcutFeedback: pageState.shortcutFeedback,
    setShortcutFeedback: pageState.setShortcutFeedback,
    setViewMode: pageState.setViewMode,
  })

  const visibility = useEditor11VisibilityMutations({
    projectId,
    activeLevelId: pageState.activeLevelId,
    levels: pageState.levels,
    dimensions: pageState.dimensions,
    placements: pageState.placements,
    selectedRoomId: pageState.selectedRoomId,
    setLevels: pageState.setLevels,
    setActiveLevelId: pageState.setActiveLevelId,
    setDimensions: pageState.setDimensions,
    setPlacements: pageState.setPlacements,
  })

  const documentation = useEditor11DocumentationMutations({
    project: pageState.project,
    projectId,
    selectedRoomId: pageState.selectedRoomId,
    activeLevelId: pageState.activeLevelId,
    levels: pageState.levels,
    setVerticalConnections: pageState.setVerticalConnections,
    setSectionLines: pageState.setSectionLines,
    setSelectedSectionLineId: pageState.setSelectedSectionLineId,
    buildFootprintFromRoom,
    buildDefaultSectionLine,
  })

  const roomOperations = useEditor11RoomOperations({
    roomContextArgs: {
      project: pageState.project,
      activeLevelId: pageState.activeLevelId,
      selectedRoomId: pageState.selectedRoomId,
      openings: pageState.openings,
      selectedOpeningId: pageState.selectedOpeningId,
      placements: pageState.placements,
      selectedPlacementId: pageState.selectedPlacementId,
      verticalConnections: pageState.verticalConnections,
    },
    roomMutationsArgs: {
      project: pageState.project,
      activeLevelId: pageState.activeLevelId,
      levels: pageState.levels,
      resetToSelection: editorMode.resetToSelection,
      setProject: pageState.setProject,
      setSelectedRoomId: pageState.setSelectedRoomId,
    },
    entityMutationsArgs: {
      setOpenings: pageState.setOpenings,
      setSelectedOpeningId: pageState.setSelectedOpeningId,
      setPlacements: pageState.setPlacements,
      setSelectedPlacementId: pageState.setSelectedPlacementId,
      selectedCatalogItem: pageState.selectedCatalogItem,
      configuredDimensions: pageState.configuredDimensions,
      chosenOptions: pageState.chosenOptions,
      resetToSelection: editorMode.resetToSelection,
      resolveArticleVariantId,
      resolveArticlePriceForVariant,
    },
    roomIntegrityArgs: {
      projectId,
      setValidationLoading: pageState.setValidationLoading,
      setValidationResult: pageState.setValidationResult,
      onReferenceImageLocalUpdate: editor.setReferenceImage,
    },
    importExportArgs: {
      projectId,
      selectedAlternativeId: pageState.selectedAlternativeId,
      selectedRoomId: pageState.selectedRoomId,
      setProject: pageState.setProject,
      setProjectElevations: pageState.setProjectElevations,
      setSelectedRoomId: pageState.setSelectedRoomId,
      setImportDockOpen: pageState.setImportDockOpen,
      setActiveImportJobId: pageState.setActiveImportJobId,
      setImportNotice: pageState.setImportNotice,
      setImportNoticeError: pageState.setImportNoticeError,
      setShortcutFeedback: pageState.setShortcutFeedback,
      setAutoCompleteLoading: pageState.setAutoCompleteLoading,
      setGltfExportLoading: pageState.setGltfExportLoading,
      setBulkDeliveredLoading: pageState.setBulkDeliveredLoading,
      setBulkDeliveredMessage: pageState.setBulkDeliveredMessage,
      setBulkDeliveredError: pageState.setBulkDeliveredError,
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
  }
}

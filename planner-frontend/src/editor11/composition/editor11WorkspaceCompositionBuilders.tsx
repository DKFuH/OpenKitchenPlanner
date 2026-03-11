import type { ComponentProps } from 'react'
import { CatalogSidePanel } from '../../components/editor/CatalogSidePanel.js'
import type { CeilingConstraint } from '../../components/editor/RightSidebar.js'
import type { RoomPayload } from '../../api/rooms.js'
import { usePolygonEditor } from '../../editor/usePolygonEditor.js'
import { useEditor11Acoustics } from '../adapters/useEditor11Acoustics.js'
import { useEditor11CameraState } from '../adapters/useEditor11CameraState.js'
import { useEditor11PageState } from '../adapters/useEditor11PageState.js'
import { useEditor11RoomOperations } from '../adapters/useEditor11RoomOperations.js'
import { useEditor11SelectionOrchestration } from '../adapters/useEditor11SelectionOrchestration.js'
import { useEditor11VisibilityMutations } from '../adapters/useEditor11VisibilityMutations.js'
import { useEditor11WorkspaceComposition } from './useEditor11WorkspaceComposition.js'
import { coreEditorPlugin } from '../plugins/CoreEditorPluginBridge.js'

type WorkspaceCompositionArgs = Parameters<typeof useEditor11WorkspaceComposition>[0]

export interface Editor11WorkspaceCompositionArgsInput {
  styles: Record<string, string>
  projectId: string | null
  navigate: (path: string) => void
  workflowStep: ComponentProps<typeof CatalogSidePanel>['workflowStep']
  sidebarPluginSlots: WorkspaceCompositionArgs['sidebarArgs']['leftSidebarProps']['pluginSlotEntries']
  pageState: ReturnType<typeof useEditor11PageState>
  roomOperations: ReturnType<typeof useEditor11RoomOperations>
  selection: ReturnType<typeof useEditor11SelectionOrchestration>
  visibility: ReturnType<typeof useEditor11VisibilityMutations>
  acoustics: ReturnType<typeof useEditor11Acoustics>
  projection: {
    elevationLoading: boolean
    elevationSvg: string
    sectionViewLoading: boolean
    sectionViewSaving: boolean
    sectionViewError: string | null
    sectionView: WorkspaceCompositionArgs['sectionPanelArgs']['sectionView']
    sectionViewConfigDraft: WorkspaceCompositionArgs['sectionPanelArgs']['sectionViewConfigDraft']
    setSectionViewConfigDraft: WorkspaceCompositionArgs['sectionPanelArgs']['onSetSectionViewConfigDraft']
    handleSaveSectionViewConfig: () => void
  }
  editor: ReturnType<typeof usePolygonEditor>
  camera: ReturnType<typeof useEditor11CameraState>
}

interface WorkspaceCompositionBuilderContext {
  selectedRoom: RoomPayload | null
  ceilingConstraints: CeilingConstraint[]
}

export function buildEditor11SidebarArgs(
  input: Editor11WorkspaceCompositionArgsInput,
): WorkspaceCompositionArgs['sidebarArgs'] {
  const { projectId, navigate, sidebarPluginSlots, pageState, roomOperations, selection, visibility } = input

  return {
    showAreasPanel: pageState.showAreasPanel,
    projectId,
    leftSidebarVisible: pageState.leftSidebarVisible,
    onOpenAlternative: pageState.setSelectedAlternativeId,
    levelsPanelProps: {
      levels: pageState.levels,
      activeLevelId: pageState.activeLevelId,
      onSelectLevel: pageState.setActiveLevelId,
      onToggleVisibility: visibility.handleToggleLevelVisibility,
      onCreateLevel: visibility.handleCreateLevel,
    },
    leftSidebarProps: {
      rooms: roomOperations.roomsOnActiveLevel,
      selectedRoomId: pageState.selectedRoomId,
      onSelectRoom: selection.onSelectRoom,
      onAddRoom: roomOperations.handleAddRoom,
      projectId,
      pluginSlotEntries: sidebarPluginSlots,
      onNavigateToPath: navigate,
    },
  }
}

export function buildEditor11InspectorArgs(
  input: Editor11WorkspaceCompositionArgsInput,
  context: WorkspaceCompositionBuilderContext,
): WorkspaceCompositionArgs['inspectorArgs'] {
  const { projectId, workflowStep, pageState, roomOperations, selection, visibility, acoustics, editor } = input

  return {
    projectId: projectId ?? '',
    room: roomOperations.selectedRoom,
    levels: pageState.levels,
    activeLevelId: pageState.activeLevelId,
    selectedVertexIndex: editor.state.selectedIndex,
    selectedVertex: selection.selectedVertex,
    selectedEdgeIndex: editor.state.selectedEdgeIndex,
    dimensions: pageState.dimensions,
    edgeLengthMm: selection.selectedEdgeLengthMm,
    dimensionAssistSegments: selection.dimensionAssistSegments,
    selectedOpening: roomOperations.selectedOpening,
    selectedPlacement: roomOperations.selectedPlacement,
    selectedCatalogItem: pageState.selectedCatalogItem,
    configuredDimensions: pageState.configuredDimensions,
    onConfigureDimensions: pageState.setConfiguredDimensions,
    chosenOptions: pageState.chosenOptions,
    onSetChosenOptions: pageState.setChosenOptions,
    ceilingConstraints: context.ceilingConstraints,
    selectedWallGeom: selection.selectedWallGeom,
    selectedWallVisible: selection.selectedWallVisible,
    selectedWallLocked: selection.selectedWallLocked,
    onMoveVertex: editor.moveVertex,
    onSetEdgeLength: editor.setEdgeLength,
    onEdgeLengthDraftChange: pageState.setEdgeLengthPreviewMm,
    onUpdateOpening: roomOperations.handleUpdateOpening,
    onDeleteOpening: roomOperations.handleDeleteOpening,
    onUpdatePlacement: roomOperations.handleUpdatePlacement,
    onDeletePlacement: roomOperations.handleDeletePlacement,
    onSaveCeilingConstraints: roomOperations.handleSaveCeilingConstraints,
    validationResult: pageState.validationResult,
    validationLoading: pageState.validationLoading,
    onRunValidation: roomOperations.handleRunValidation,
    placements: pageState.placements,
    selectedRoomId: pageState.selectedRoomId,
    acousticEnabled: pageState.acousticEnabled,
    acousticOpacityPct: pageState.acousticOpacityPct,
    acousticVariable: pageState.acousticVariable,
    acousticGrids: pageState.acousticGrids,
    activeAcousticGridId: pageState.activeAcousticGridId,
    acousticMin: pageState.acousticMin,
    acousticMax: pageState.acousticMax,
    acousticBusy: pageState.acousticBusy,
    onToggleAcoustics: pageState.setAcousticEnabled,
    onSetAcousticOpacityPct: pageState.setAcousticOpacityPct,
    onSetAcousticVariable: acoustics.handleSetAcousticVariable,
    onAcousticUpload: acoustics.handleAcousticUpload,
    onSelectAcousticGrid: pageState.setActiveAcousticGridId,
    onDeleteAcousticGrid: acoustics.handleDeleteAcousticGrid,
    safeEditMode: pageState.safeEditMode,
    onToggleSafeEditMode: pageState.setSafeEditMode,
    onToggleActiveLevelVisibility: visibility.handleSetActiveLevelVisibility,
    onSetDimensionsVisible: visibility.handleSetDimensionsVisible,
    onSetPlacementsVisible: visibility.handleSetPlacementsVisible,
    onSetSelectedWallVisible: selection.handleSetSelectedWallVisible,
    autoDollhouse: pageState.autoDollhouseSettings,
    autoDollhouseSaving: pageState.autoDollhouseSaving,
    onSaveAutoDollhouse: selection.handleSaveAutoDollhouse,
    onSetActiveLevelLocked: visibility.handleSetActiveLevelLocked,
    onSetDimensionsLocked: visibility.handleSetDimensionsLocked,
    onSetSelectedPlacementLocked: selection.handleSetSelectedPlacementLocked,
    onSetSelectedWallLocked: selection.handleSetSelectedWallLocked,
    drawingGroups: pageState.drawingGroups,
    selectedDrawingGroupId: pageState.selectedDrawingGroupId,
    currentSelectionMembers: selection.currentSelectionMembers,
    onSelectDrawingGroup: (groupId) => selection.handleSelectDrawingGroup(groupId, pageState.drawingGroups),
    onCreateDrawingGroup: selection.handleCreateDrawingGroup,
    onDeleteDrawingGroup: selection.handleDeleteDrawingGroup,
    onApplyDrawingGroupTransform: selection.handleApplyDrawingGroupTransform,
    onSyncDrawingGroupConfig: selection.handleSyncDrawingGroupConfig,
    catalogPanel: (
      <CatalogSidePanel
        projectId={projectId}
        selectedCatalogItem={pageState.selectedCatalogItem}
        onSelectCatalogItem={pageState.setSelectedCatalogItem}
        workflowStep={workflowStep}
      />
    ),
  }
}

export function buildEditor11ViewportArgs(
  input: Editor11WorkspaceCompositionArgsInput,
  context: WorkspaceCompositionBuilderContext,
): WorkspaceCompositionArgs['viewportArgs'] {
  const { pageState, roomOperations, selection, projection, camera } = input

  return {
    canvasProps: {
      room: context.selectedRoom,
      onRoomUpdated: roomOperations.handleRoomUpdated,
      editor: selection.editor,
      verticalConnections: roomOperations.verticalConnectionsForSelectedRoom,
      openings: pageState.openings,
      selectedOpeningId: pageState.selectedOpeningId,
      onSelectOpening: selection.onSelectOpening,
      onAddOpening: roomOperations.handleAddOpening,
      placements: pageState.placements,
      dimensions: pageState.dimensions,
      centerlines: pageState.centerlines,
      selectedPlacementId: pageState.selectedPlacementId,
      onSelectPlacement: selection.onSelectPlacement,
      highlightedOpeningIds: selection.highlightedOpeningIds,
      highlightedPlacementIds: selection.highlightedPlacementIds,
      canAddPlacement: pageState.selectedCatalogItem !== null,
      onAddPlacement: roomOperations.handleAddPlacement,
      acousticGrid: pageState.acousticGrid,
      acousticVisible: pageState.acousticEnabled,
      acousticOpacity: pageState.acousticOpacityPct / 100,
      edgeLengthPreviewMm: pageState.edgeLengthPreviewMm,
      onReferenceImageUpdate: roomOperations.handleReferenceImageUpdate,
      navigationSettings: pageState.navigationSettings,
      safeEditMode: pageState.safeEditMode,
      editorChromeMode: 'minimal',
      showCompass: pageState.daylightEnabled,
      northAngleDeg: pageState.projectEnvironment?.north_angle_deg ?? 0,
      virtualVisitor: {
        x_mm: camera.cameraState.x_mm,
        y_mm: camera.cameraState.y_mm,
        yaw_rad: camera.cameraState.yaw_rad,
        visible: camera.showVirtualVisitor,
      },
      onRepositionVisitor: camera.showVirtualVisitor ? camera.handleRepositionVisitor : undefined,
      onBoundaryTopologyRebind: roomOperations.handleBoundaryTopologyRebind,
      onShortcutBlocked: pageState.setShortcutFeedback,
    },
    previewProps: {
      room: context.selectedRoom,
      verticalConnections: roomOperations.verticalConnectionsForSelectedRoom,
      cameraState: camera.cameraState,
      onCameraStateChange: camera.handleCameraStateChange,
      sunlight: pageState.daylightEnabled ? pageState.sunPreview : null,
      navigationSettings: pageState.navigationSettings,
      autoDollhouseSettings: pageState.autoDollhouseSettings,
      renderEnvironment: pageState.renderEnvironmentSettings,
      fovDeg: camera.cameraFovDeg,
    },
    wallElevationProps: {
      selectedRoomId: pageState.selectedRoomId,
      selectedRoomName: roomOperations.selectedRoom?.name ?? null,
      selectedWallId: selection.selectedWallId,
      selectedElevationWallIndex: pageState.selectedElevationWallIndex,
      elevations: selection.elevationsForSelectedRoom,
      elevationLoading: projection.elevationLoading,
      elevationSvg: projection.elevationSvg,
      onSelectWallIndex: pageState.setSelectedElevationWallIndex,
    },
  }
}

export function buildEditor11SectionPanelArgs(
  input: Editor11WorkspaceCompositionArgsInput,
): WorkspaceCompositionArgs['sectionPanelArgs'] {
  const { styles, pageState, selection, projection } = input

  return {
    classNames: {
      projectionPanel: styles.projectionPanel,
      projectionHeader: styles.projectionHeader,
      projectionTitle: styles.projectionTitle,
      btnSecondary: styles.btnSecondary,
      projectionHint: styles.projectionHint,
      projectionError: styles.projectionError,
      projectionConfigGrid: styles.projectionConfigGrid,
      projectionField: styles.projectionField,
      projectionToggles: styles.projectionToggles,
      projectionMeta: styles.projectionMeta,
      projectionColumns: styles.projectionColumns,
      projectionList: styles.projectionList,
    },
    selectedSectionLineId: pageState.selectedSectionLineId,
    sectionViewLoading: projection.sectionViewLoading,
    sectionViewSaving: projection.sectionViewSaving,
    sectionViewError: projection.sectionViewError,
    sectionView: projection.sectionView,
    sectionViewConfigDraft: projection.sectionViewConfigDraft,
    onSaveSectionViewConfig: projection.handleSaveSectionViewConfig,
    onSetSectionViewConfigDraft: projection.setSectionViewConfigDraft,
    onSelectOpening: selection.onSelectOpening,
    onSelectPlacement: selection.onSelectPlacement,
  }
}

export function buildEditor11ShellArgs(
  input: Editor11WorkspaceCompositionArgsInput,
): WorkspaceCompositionArgs['shellArgs'] {
  const { pageState, selection } = input

  return {
    snapshot: selection.snapshot,
    dispatch: selection.dispatch,
    plugins: [coreEditorPlugin],
    layout: selection.snapshot.viewLayout,
    inspectorOpen: pageState.rightSidebarVisible,
    primaryRatio: pageState.split3PrimaryRatio,
    secondaryRatio: pageState.split3SecondaryRatio,
    onPrimaryRatioChange: pageState.setSplit3PrimaryRatio,
    onSecondaryRatioChange: pageState.setSplit3SecondaryRatio,
  }
}

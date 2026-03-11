import { useEditorModeStore } from '../../editor/editorModeStore.js'
import { usePolygonEditor } from '../../editor/usePolygonEditor.js'
import { useEditor11PageState } from '../adapters/useEditor11PageState.js'
import { useEditor11RoomOperations } from '../adapters/useEditor11RoomOperations.js'
import { useEditor11SelectionOrchestration } from '../adapters/useEditor11SelectionOrchestration.js'

interface UseEditor11PageSelectionArgs {
  projectId: string | null
  pageState: ReturnType<typeof useEditor11PageState>
  editor: ReturnType<typeof usePolygonEditor>
  editorMode: ReturnType<typeof useEditorModeStore>
  roomOperations: ReturnType<typeof useEditor11RoomOperations>
  baseEditorWithMode: Parameters<typeof useEditor11SelectionOrchestration>[0]['selectionBridgeArgs']['baseEditor']
}

export function useEditor11PageSelection({
  projectId,
  pageState,
  editor,
  editorMode,
  roomOperations,
  baseEditorWithMode,
}: UseEditor11PageSelectionArgs) {
  const { state } = editor

  return useEditor11SelectionOrchestration({
    selectionStateArgs: {
      editorState: state,
      drawingGroups: pageState.drawingGroups,
      selectedDrawingGroupId: pageState.selectedDrawingGroupId,
      selectedRoomId: pageState.selectedRoomId,
      selectedPlacementId: pageState.selectedPlacementId,
      selectedOpeningId: pageState.selectedOpeningId,
      selectedRoomBoundary: roomOperations.selectedRoom?.boundary,
      safeEditMode: pageState.safeEditMode,
      selectedCatalogItem: pageState.selectedCatalogItem,
      setEdgeLengthPreviewMm: pageState.setEdgeLengthPreviewMm,
      setShortcutFeedback: pageState.setShortcutFeedback,
      onDeleteVertex: editor.deleteVertex,
      onAddOpening: roomOperations.handleAddOpening,
      onAddPlacement: roomOperations.handleAddPlacement,
    },
    wallStateArgs: {
      projectElevations: pageState.projectElevations,
      selectedRoomId: pageState.selectedRoomId,
      wallIds: state.wallIds,
      vertices: state.vertices,
      setSelectedElevationWallIndex: pageState.setSelectedElevationWallIndex,
      openings: pageState.openings,
      placements: pageState.placements,
    },
    bridgeArgs: {
      projectId,
      activeLevelId: pageState.activeLevelId,
      selectedRoomId: pageState.selectedRoomId,
      selectedOpeningId: pageState.selectedOpeningId,
      selectedPlacementId: pageState.selectedPlacementId,
      editorMode: editorMode.mode,
      compactLayout: pageState.compactLayout,
      viewMode: pageState.viewMode,
      rightSidebarVisible: pageState.rightSidebarVisible,
      leftSidebarVisible: pageState.leftSidebarVisible,
      wallIds: state.wallIds,
      onSelectEdge: editor.selectEdge,
      setViewMode: pageState.setViewMode,
      setSelectedRoomId: pageState.setSelectedRoomId,
      setSelectedOpeningId: pageState.setSelectedOpeningId,
      setSelectedPlacementId: pageState.setSelectedPlacementId,
      setLeftSidebarVisible: pageState.setLeftSidebarVisible,
      setRightSidebarVisible: pageState.setRightSidebarVisible,
    },
    drawingGroupsArgs: {
      projectId,
      selectedRoomId: pageState.selectedRoomId,
      setDrawingGroups: pageState.setDrawingGroups,
      setSelectedDrawingGroupId: pageState.setSelectedDrawingGroupId,
      setOpenings: pageState.setOpenings,
      setPlacements: pageState.setPlacements,
      setDimensions: pageState.setDimensions,
      setCenterlines: pageState.setCenterlines,
    },
    entityVisibilityArgs: {
      projectId,
      selectedRoomId: pageState.selectedRoomId,
      selectedPlacementId: pageState.selectedPlacementId,
      setProject: pageState.setProject,
      setPlacements: pageState.setPlacements,
      setAutoDollhouseSettings: pageState.setAutoDollhouseSettings,
      setAutoDollhouseSaving: pageState.setAutoDollhouseSaving,
    },
    selectionBridgeArgs: {
      baseEditor: baseEditorWithMode,
      selectedRoomId: pageState.selectedRoomId,
      wallIds: state.wallIds,
    },
  })
}

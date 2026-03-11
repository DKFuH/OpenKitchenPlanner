import { useEditor11Bridge } from './useEditor11Bridge.js'
import { useEditor11DrawingGroups } from './useEditor11DrawingGroups.js'
import { useEditor11EntityVisibility } from './useEditor11EntityVisibility.js'
import { useEditor11SelectionBridge } from './useEditor11SelectionBridge.js'
import { useEditor11SelectionState } from './useEditor11SelectionState.js'
import { useEditor11WallState } from './useEditor11WallState.js'

interface UseEditor11SelectionOrchestrationArgs {
  selectionStateArgs: Parameters<typeof useEditor11SelectionState>[0]
  wallStateArgs: Omit<Parameters<typeof useEditor11WallState>[0], 'selectedWallSegment' | 'selectedEdgeIndex' | 'edgeLengthMm'>
  bridgeArgs: Omit<Parameters<typeof useEditor11Bridge>[0], 'selectedWallId'>
  drawingGroupsArgs: Omit<Parameters<typeof useEditor11DrawingGroups>[0], 'onSelectPlacement' | 'onSelectOpening' | 'onClearSelection'>
  entityVisibilityArgs: Omit<Parameters<typeof useEditor11EntityVisibility>[0], 'selectedWallId'>
  selectionBridgeArgs: Omit<Parameters<typeof useEditor11SelectionBridge>[0], 'dispatch'>
}

export function useEditor11SelectionOrchestration({
  selectionStateArgs,
  wallStateArgs,
  bridgeArgs,
  drawingGroupsArgs,
  entityVisibilityArgs,
  selectionBridgeArgs,
}: UseEditor11SelectionOrchestrationArgs) {
  const selectionState = useEditor11SelectionState(selectionStateArgs)

  const wallState = useEditor11WallState({
    ...wallStateArgs,
    selectedEdgeIndex: selectionStateArgs.editorState.selectedEdgeIndex,
    selectedWallSegment: selectionState.selectedWallSegment,
    edgeLengthMm: selectionState.selectedEdgeLengthMm,
  })

  const bridgedState = useEditor11Bridge({
    ...bridgeArgs,
    selectedWallId: wallState.selectedWallId,
  })

  const drawingGroups = useEditor11DrawingGroups({
    ...drawingGroupsArgs,
    onSelectPlacement: (placementId) => {
      if (placementId && bridgeArgs.selectedRoomId) {
        bridgedState.dispatch({ id: 'select.placement', roomId: bridgeArgs.selectedRoomId, placementId })
        return
      }
      bridgedState.dispatch({ id: 'selection.clear' })
    },
    onSelectOpening: (openingId) => {
      if (openingId && bridgeArgs.selectedRoomId) {
        bridgedState.dispatch({ id: 'select.opening', roomId: bridgeArgs.selectedRoomId, openingId })
        return
      }
      bridgedState.dispatch({ id: 'selection.clear' })
    },
    onClearSelection: () => {
      bridgedState.dispatch({ id: 'selection.clear' })
    },
  })

  const entityVisibility = useEditor11EntityVisibility({
    ...entityVisibilityArgs,
    selectedWallId: wallState.selectedWallId,
  })

  const selectionBridge = useEditor11SelectionBridge({
    ...selectionBridgeArgs,
    dispatch: bridgedState.dispatch,
  })

  return {
    ...selectionState,
    ...wallState,
    ...bridgedState,
    ...drawingGroups,
    ...entityVisibility,
    ...selectionBridge,
  }
}

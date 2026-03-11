import { useCallback, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { EditorCommand } from '../state/EditorCommands.js'
import type { EditorSelection, EditorStateSnapshot, EditorTool11 } from '../state/EditorSelection.js'
import type { PlannerViewMode } from '../../pages/plannerViewSettings.js'

interface UseEditor11BridgeArgs {
  projectId: string | null
  activeLevelId: string | null
  selectedRoomId: string | null
  selectedWallId: string | null
  selectedOpeningId: string | null
  selectedPlacementId: string | null
  editorMode: string
  compactLayout: boolean
  viewMode: PlannerViewMode
  rightSidebarVisible: boolean
  leftSidebarVisible: boolean
  wallIds: string[]
  onSelectEdge: (index: number | null) => void
  setViewMode: Dispatch<SetStateAction<PlannerViewMode>>
  setSelectedRoomId: Dispatch<SetStateAction<string | null>>
  setSelectedOpeningId: Dispatch<SetStateAction<string | null>>
  setSelectedPlacementId: Dispatch<SetStateAction<string | null>>
  setLeftSidebarVisible: Dispatch<SetStateAction<boolean>>
  setRightSidebarVisible: Dispatch<SetStateAction<boolean>>
}

function resolveEditor11Tool(mode: string): EditorTool11 {
  switch (mode) {
    case 'wallCreate':
      return 'draw-wall'
    case 'roomCreate':
      return 'draw-room'
    case 'dimCreate':
      return 'dimension'
    case 'pan':
      return 'pan'
    default:
      return 'select'
  }
}

function resolveSelection(
  selectedRoomId: string | null,
  selectedWallId: string | null,
  selectedOpeningId: string | null,
  selectedPlacementId: string | null,
): EditorSelection {
  if (selectedRoomId && selectedPlacementId) {
    return { kind: 'placement', roomId: selectedRoomId, placementId: selectedPlacementId }
  }
  if (selectedRoomId && selectedOpeningId) {
    return { kind: 'opening', roomId: selectedRoomId, openingId: selectedOpeningId }
  }
  if (selectedRoomId && selectedWallId) {
    return { kind: 'wall', roomId: selectedRoomId, wallId: selectedWallId }
  }
  if (selectedRoomId) {
    return { kind: 'room', roomId: selectedRoomId }
  }
  return { kind: 'none' }
}

function resolveViewLayout(compactLayout: boolean, viewMode: PlannerViewMode): EditorStateSnapshot['viewLayout'] {
  const effectiveMode = compactLayout && (viewMode === 'split' || viewMode === 'split3') ? '2d' : viewMode
  if (effectiveMode === '3d') {
    return 'focus-3d'
  }
  if (effectiveMode === 'elevation') {
    return 'focus-wall'
  }
  if (effectiveMode === '2d') {
    return 'focus-2d'
  }
  return 'triple'
}

export function useEditor11Bridge({
  projectId,
  activeLevelId,
  selectedRoomId,
  selectedWallId,
  selectedOpeningId,
  selectedPlacementId,
  editorMode,
  compactLayout,
  viewMode,
  rightSidebarVisible,
  leftSidebarVisible,
  wallIds,
  onSelectEdge,
  setViewMode,
  setSelectedRoomId,
  setSelectedOpeningId,
  setSelectedPlacementId,
  setLeftSidebarVisible,
  setRightSidebarVisible,
}: UseEditor11BridgeArgs) {
  const selection = useMemo(
    () => resolveSelection(selectedRoomId, selectedWallId, selectedOpeningId, selectedPlacementId),
    [selectedOpeningId, selectedPlacementId, selectedRoomId, selectedWallId],
  )

  const snapshot = useMemo<EditorStateSnapshot>(() => ({
    projectId,
    activeLevelId,
    activeRoomId: selectedRoomId,
    activeWallId: selectedWallId,
    selection,
    activeTool: resolveEditor11Tool(editorMode),
    inspectorOpen: rightSidebarVisible,
    leftSidebarOpen: leftSidebarVisible,
    viewLayout: resolveViewLayout(compactLayout, viewMode),
  }), [
    activeLevelId,
    compactLayout,
    editorMode,
    leftSidebarVisible,
    projectId,
    rightSidebarVisible,
    selectedRoomId,
    selectedWallId,
    selection,
    viewMode,
  ])

  const dispatch = useCallback((command: EditorCommand) => {
    switch (command.id) {
      case 'selection.clear':
        setSelectedOpeningId(null)
        setSelectedPlacementId(null)
        onSelectEdge(null)
        break
      case 'panel.toggle-inspector':
        setRightSidebarVisible((prev) => !prev)
        break
      case 'panel.toggle-left-sidebar':
        setLeftSidebarVisible((prev) => !prev)
        break
      case 'layout.set':
        setViewMode(command.layout === 'focus-3d'
          ? '3d'
          : command.layout === 'focus-wall'
            ? 'elevation'
            : command.layout === 'focus-2d'
              ? '2d'
              : 'split3')
        break
      case 'select.room':
        setSelectedRoomId(command.roomId)
        setSelectedOpeningId(null)
        setSelectedPlacementId(null)
        onSelectEdge(null)
        break
      case 'select.wall':
        setSelectedRoomId(command.roomId)
        setSelectedOpeningId(null)
        setSelectedPlacementId(null)
        onSelectEdge(wallIds.findIndex((wallId) => wallId === command.wallId))
        break
      case 'select.opening':
        setSelectedRoomId(command.roomId)
        setSelectedOpeningId(command.openingId)
        setSelectedPlacementId(null)
        onSelectEdge(null)
        break
      case 'select.placement':
        setSelectedRoomId(command.roomId)
        setSelectedPlacementId(command.placementId)
        setSelectedOpeningId(null)
        onSelectEdge(null)
        break
      default:
        break
    }
  }, [
    onSelectEdge,
    setLeftSidebarVisible,
    setRightSidebarVisible,
    setSelectedOpeningId,
    setSelectedPlacementId,
    setSelectedRoomId,
    setViewMode,
    wallIds,
  ])

  return {
    snapshot,
    dispatch,
  }
}

import { useCallback, useEffect, useMemo } from 'react'
import { edgeLengthMm, type EditorState } from '../../editor/usePolygonEditor.js'
import { resolvePolygonShortcutStates } from '../../editor/actionStateResolver.js'
import type { DrawingGroup, DrawingGroupMember } from '../../api/drawingGroups.js'

type WallSegmentFlags = {
  id: string
  visible?: boolean
  is_hidden?: boolean
  locked?: boolean
  lock_scope?: string | null
  [key: string]: unknown
}

interface VertexPoint {
  x_mm: number
  y_mm: number
}

interface UseEditor11SelectionStateArgs {
  editorState: EditorState
  drawingGroups: DrawingGroup[]
  selectedDrawingGroupId: string | null
  selectedRoomId: string | null
  selectedPlacementId: string | null
  selectedOpeningId: string | null
  selectedRoomBoundary: unknown
  safeEditMode: boolean
  selectedCatalogItem: unknown
  setEdgeLengthPreviewMm: (value: number | null) => void
  setShortcutFeedback: (value: string | null) => void
  onDeleteVertex: (index: number) => void
  onAddOpening: (wallId: string, wallLengthMm: number) => void
  onAddPlacement: (wallId: string, wallLengthMm: number) => void
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function extractBoundaryWallSegments(boundary: unknown): WallSegmentFlags[] {
  const candidate = asRecord(boundary)
  if (!candidate || !Array.isArray(candidate.wall_segments)) {
    return []
  }

  const segments: WallSegmentFlags[] = []
  for (const entry of candidate.wall_segments) {
    const wall = asRecord(entry)
    if (!wall || typeof wall.id !== 'string' || wall.id.trim().length === 0) {
      continue
    }
    segments.push(wall as WallSegmentFlags)
  }

  return segments
}

export function useEditor11SelectionState({
  editorState,
  drawingGroups,
  selectedDrawingGroupId,
  selectedRoomId,
  selectedPlacementId,
  selectedOpeningId,
  selectedRoomBoundary,
  safeEditMode,
  selectedCatalogItem,
  setEdgeLengthPreviewMm,
  setShortcutFeedback,
  onDeleteVertex,
  onAddOpening,
  onAddPlacement,
}: UseEditor11SelectionStateArgs) {
  const hasValidSelectedEdge = editorState.selectedEdgeIndex !== null
    && editorState.selectedEdgeIndex >= 0
    && editorState.selectedEdgeIndex < editorState.vertices.length
    && editorState.selectedEdgeIndex < editorState.wallIds.length
  const selectedEdgeIndex = hasValidSelectedEdge ? editorState.selectedEdgeIndex : null

  const selectedVertex = editorState.selectedIndex !== null
    ? (editorState.vertices[editorState.selectedIndex] ?? null)
    : null

  const selectedEdgeLengthMm = selectedEdgeIndex !== null
    ? edgeLengthMm(editorState.vertices, selectedEdgeIndex)
    : null

  useEffect(() => {
    setEdgeLengthPreviewMm(null)
  }, [editorState.selectedEdgeIndex, selectedEdgeLengthMm, setEdgeLengthPreviewMm])

  const selectedDrawingGroup = useMemo(
    () => drawingGroups.find((group) => group.id === selectedDrawingGroupId) ?? null,
    [drawingGroups, selectedDrawingGroupId],
  )

  const currentSelectionMembers = useMemo(() => {
    const members: DrawingGroupMember[] = []
    if (selectedRoomId && selectedPlacementId) {
      members.push({ entity_type: 'placement', entity_id: selectedPlacementId, room_id: selectedRoomId })
    }
    if (selectedRoomId && selectedOpeningId) {
      members.push({ entity_type: 'opening', entity_id: selectedOpeningId, room_id: selectedRoomId })
    }
    return members
  }, [selectedOpeningId, selectedPlacementId, selectedRoomId])

  const highlightedOpeningIds = useMemo(() => {
    if (!selectedDrawingGroup) {
      return []
    }
    return selectedDrawingGroup.members_json
      .filter((member) => member.entity_type === 'opening')
      .filter((member) => !member.room_id || member.room_id === selectedRoomId)
      .map((member) => member.entity_id)
  }, [selectedDrawingGroup, selectedRoomId])

  const highlightedPlacementIds = useMemo(() => {
    if (!selectedDrawingGroup) {
      return []
    }
    return selectedDrawingGroup.members_json
      .filter((member) => member.entity_type === 'placement')
      .filter((member) => !member.room_id || member.room_id === selectedRoomId)
      .map((member) => member.entity_id)
  }, [selectedDrawingGroup, selectedRoomId])

  const selectedRoomWallSegments = useMemo(
    () => extractBoundaryWallSegments(selectedRoomBoundary),
    [selectedRoomBoundary],
  )

  const selectedWallSegment = useMemo(() => {
    const index = editorState.selectedEdgeIndex
    if (index === null) {
      return null
    }
    return selectedRoomWallSegments[index] ?? null
  }, [editorState.selectedEdgeIndex, selectedRoomWallSegments])

  const selectedVertexLocked = useMemo(() => {
    if (editorState.selectedIndex === null || editorState.vertices.length < 2) {
      return false
    }

    const previousEdgeIndex = (editorState.selectedIndex - 1 + editorState.vertices.length) % editorState.vertices.length
    const currentWallLocked = Boolean(selectedRoomWallSegments[editorState.selectedIndex]?.locked)
    const previousWallLocked = Boolean(selectedRoomWallSegments[previousEdgeIndex]?.locked)
    return currentWallLocked || previousWallLocked
  }, [editorState.selectedIndex, editorState.vertices.length, selectedRoomWallSegments])

  const polygonShortcutStates = useMemo(() => resolvePolygonShortcutStates({
    safeEditMode,
    selectedVertexIndex: editorState.selectedIndex,
    selectedEdgeIndex: editorState.selectedEdgeIndex,
    selectedVertexLocked,
  }), [editorState.selectedEdgeIndex, editorState.selectedIndex, safeEditMode, selectedVertexLocked])

  const handleDeleteSelectedVertex = useCallback(() => {
    if (editorState.selectedIndex === null || !polygonShortcutStates.deleteVertex.enabled) {
      if (!polygonShortcutStates.deleteVertex.enabled) {
        setShortcutFeedback(polygonShortcutStates.deleteVertex.reasonIfDisabled ?? 'Punkt kann nicht geloescht werden')
      }
      return
    }

    onDeleteVertex(editorState.selectedIndex)
  }, [
    editorState.selectedIndex,
    onDeleteVertex,
    polygonShortcutStates.deleteVertex.enabled,
    polygonShortcutStates.deleteVertex.reasonIfDisabled,
    setShortcutFeedback,
  ])

  const handleAddOpeningForSelectedEdge = useCallback(() => {
    const selectedEdgeIndex = editorState.selectedEdgeIndex
    if (selectedEdgeIndex === null) {
      setShortcutFeedback('Wandkante auswaehlen, um eine Oeffnung hinzuzufuegen')
      return
    }

    const wallId = editorState.wallIds[selectedEdgeIndex]
    const start = editorState.vertices[selectedEdgeIndex] as VertexPoint | undefined
    const end = editorState.vertices[(selectedEdgeIndex + 1) % editorState.vertices.length] as VertexPoint | undefined
    if (!wallId || !start || !end) {
      return
    }

    onAddOpening(wallId, Math.hypot(end.x_mm - start.x_mm, end.y_mm - start.y_mm))
  }, [editorState.selectedEdgeIndex, editorState.vertices, editorState.wallIds, onAddOpening, setShortcutFeedback])

  const handleAddPlacementForSelectedEdge = useCallback(() => {
    const selectedEdgeIndex = editorState.selectedEdgeIndex
    if (selectedEdgeIndex === null) {
      setShortcutFeedback('Wandkante auswaehlen, um ein Objekt zu platzieren')
      return
    }

    if (!selectedCatalogItem) {
      setShortcutFeedback('Katalogobjekt auswaehlen, bevor platziert werden kann')
      return
    }

    const wallId = editorState.wallIds[selectedEdgeIndex]
    const start = editorState.vertices[selectedEdgeIndex] as VertexPoint | undefined
    const end = editorState.vertices[(selectedEdgeIndex + 1) % editorState.vertices.length] as VertexPoint | undefined
    if (!wallId || !start || !end) {
      return
    }

    onAddPlacement(wallId, Math.hypot(end.x_mm - start.x_mm, end.y_mm - start.y_mm))
  }, [editorState.selectedEdgeIndex, editorState.vertices, editorState.wallIds, onAddPlacement, selectedCatalogItem, setShortcutFeedback])

  return {
    selectedVertex,
    selectedEdgeLengthMm,
    currentSelectionMembers,
    highlightedOpeningIds,
    highlightedPlacementIds,
    selectedWallSegment,
    polygonShortcutStates,
    handleDeleteSelectedVertex,
    handleAddOpeningForSelectedEdge,
    handleAddPlacementForSelectedEdge,
  }
}

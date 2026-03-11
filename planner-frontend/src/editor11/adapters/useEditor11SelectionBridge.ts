import { useCallback, useMemo } from 'react'
import type { EditorAPI } from '../../editor/usePolygonEditor.js'
import type { EditorCommandHandler } from '../state/EditorCommands.js'

interface UseEditor11SelectionBridgeArgs {
  baseEditor: EditorAPI
  dispatch: EditorCommandHandler
  selectedRoomId: string | null
  wallIds: string[]
}

export function useEditor11SelectionBridge({
  baseEditor,
  dispatch,
  selectedRoomId,
  wallIds,
}: UseEditor11SelectionBridgeArgs) {
  const onSelectOpening = useCallback((openingId: string | null) => {
    if (selectedRoomId && openingId) {
      dispatch({ id: 'select.opening', roomId: selectedRoomId, openingId })
      return
    }
    dispatch({ id: 'selection.clear' })
  }, [dispatch, selectedRoomId])

  const onSelectPlacement = useCallback((placementId: string | null) => {
    if (selectedRoomId && placementId) {
      dispatch({ id: 'select.placement', roomId: selectedRoomId, placementId })
      return
    }
    dispatch({ id: 'selection.clear' })
  }, [dispatch, selectedRoomId])

  const onSelectRoom = useCallback((roomId: string) => {
    dispatch({ id: 'select.room', roomId })
  }, [dispatch])

  const editor = useMemo<EditorAPI>(() => ({
    ...baseEditor,
    selectVertex: (index: number | null) => {
      baseEditor.selectVertex(index)
      dispatch({ id: 'selection.clear' })
    },
    selectEdge: (index: number | null) => {
      baseEditor.selectEdge(index)
      if (index === null || !selectedRoomId) {
        dispatch({ id: 'selection.clear' })
        return
      }

      const wallId = wallIds[index] ?? null
      if (!wallId) {
        dispatch({ id: 'selection.clear' })
        return
      }

      dispatch({ id: 'select.wall', roomId: selectedRoomId, wallId })
    },
  }), [baseEditor, dispatch, selectedRoomId, wallIds])

  return {
    editor,
    onSelectOpening,
    onSelectPlacement,
    onSelectRoom,
  }
}

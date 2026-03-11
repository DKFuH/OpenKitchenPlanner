import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { dimensionsApi, type Dimension } from '../../api/dimensions.js'
import { centerlinesApi, type Centerline } from '../../api/centerlines.js'
import type { ProjectDetail } from '../../api/projects.js'
import type { Opening } from '../../api/openings.js'
import type { Placement } from '../../api/placements.js'
import type { RoomBoundaryPayload, RoomPayload } from '../../api/rooms.js'
import type { EditorState } from '../../editor/usePolygonEditor.js'
import type { Vertex } from '@shared/types'

interface PolygonEditorBridge {
  reset: () => void
  loadBoundary: (vertices: Vertex[], wallIds?: string[]) => void
  setReferenceImage: (referenceImage: NonNullable<EditorState['referenceImage']> | null) => void
}

interface UseEditor11RoomViewportSyncArgs {
  project: ProjectDetail | null
  selectedRoomId: string | null
  editor: PolygonEditorBridge
  parseReferenceImage: (raw: unknown) => NonNullable<EditorState['referenceImage']> | null
  setSelectedOpeningId: Dispatch<SetStateAction<string | null>>
  setSelectedPlacementId: Dispatch<SetStateAction<string | null>>
  setOpenings: Dispatch<SetStateAction<Opening[]>>
  setPlacements: Dispatch<SetStateAction<Placement[]>>
  setDimensions: Dispatch<SetStateAction<Dimension[]>>
  setCenterlines: Dispatch<SetStateAction<Centerline[]>>
}

export function useEditor11RoomViewportSync({
  project,
  selectedRoomId,
  editor,
  parseReferenceImage,
  setSelectedOpeningId,
  setSelectedPlacementId,
  setOpenings,
  setPlacements,
  setDimensions,
  setCenterlines,
}: UseEditor11RoomViewportSyncArgs) {
  const { reset, loadBoundary, setReferenceImage } = editor

  useEffect(() => {
    setSelectedOpeningId(null)
    setSelectedPlacementId(null)

    if (!project || !selectedRoomId) {
      reset()
      setOpenings([])
      setPlacements([])
      setDimensions([])
      setCenterlines([])
      return
    }

    const room = project.rooms.find((entry) => entry.id === selectedRoomId)
    const boundary = room?.boundary as RoomBoundaryPayload | undefined
    const vertices = (boundary?.vertices ?? []) as Vertex[]
    const wallIds = (boundary?.wall_segments ?? []).map((segment) => segment.id)

    if (vertices.length >= 3) {
      loadBoundary(vertices, wallIds.length === vertices.length ? wallIds : undefined)
    } else {
      reset()
    }

    setReferenceImage(parseReferenceImage((room as unknown as RoomPayload | undefined)?.reference_image))
    setOpenings((room?.openings as Opening[]) ?? [])
    setPlacements((room?.placements as Placement[]) ?? [])

    let cancelled = false
    dimensionsApi.list(selectedRoomId)
      .then((items) => {
        if (!cancelled) {
          setDimensions(items)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDimensions([])
        }
      })

    centerlinesApi.list(selectedRoomId)
      .then((items) => {
        if (!cancelled) {
          setCenterlines(items)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCenterlines([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    loadBoundary,
    parseReferenceImage,
    project,
    reset,
    selectedRoomId,
    setReferenceImage,
    setCenterlines,
    setDimensions,
    setOpenings,
    setPlacements,
    setSelectedOpeningId,
    setSelectedPlacementId,
  ])
}

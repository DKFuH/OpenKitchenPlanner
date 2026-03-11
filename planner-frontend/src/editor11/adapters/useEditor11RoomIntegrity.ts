import { useCallback } from 'react'
import type { MutableRefObject, Dispatch, SetStateAction } from 'react'
import { roomsApi, type RoomPayload } from '../../api/rooms.js'
import type { Opening } from '../../api/openings.js'
import type { Placement } from '../../api/placements.js'
import { validateApi, type ValidateResponse } from '../../api/validate.js'
import type { CeilingConstraint } from '../../components/editor/RightSidebar.js'
import type { EditorState } from '../../editor/usePolygonEditor.js'

interface UseEditor11RoomIntegrityArgs {
  projectId: string | null
  selectedRoomRef: MutableRefObject<RoomPayload | null>
  openingsRef: MutableRefObject<Opening[]>
  placementsRef: MutableRefObject<Placement[]>
  setValidationLoading: Dispatch<SetStateAction<boolean>>
  setValidationResult: Dispatch<SetStateAction<ValidateResponse | null>>
  onReferenceImageLocalUpdate: (img: NonNullable<EditorState['referenceImage']>) => void
  onRoomUpdated: (room: RoomPayload) => void
}

export function useEditor11RoomIntegrity({
  projectId,
  selectedRoomRef,
  openingsRef,
  placementsRef,
  setValidationLoading,
  setValidationResult,
  onReferenceImageLocalUpdate,
  onRoomUpdated,
}: UseEditor11RoomIntegrityArgs) {
  const handleRunValidation = useCallback(async () => {
    if (!selectedRoomRef.current || !projectId) return
    const room = selectedRoomRef.current
    const boundary = room.boundary as {
      vertices?: Array<{ id: string; x_mm: number; y_mm: number }>
      wall_segments?: Array<{ id: string; start_vertex_id?: string; end_vertex_id?: string; length_mm?: number }>
    }
    const vertices = boundary.vertices ?? []
    const wallSegments = boundary.wall_segments ?? []
    const roomPolygon = vertices.map((vertex) => ({ x_mm: vertex.x_mm, y_mm: vertex.y_mm }))
    if (roomPolygon.length < 3) return

    const vertexById = new Map(vertices.map((vertex) => [vertex.id, vertex]))
    const walls = wallSegments.flatMap((wall) => {
      const start = vertexById.get(wall.start_vertex_id ?? '')
      const end = vertexById.get(wall.end_vertex_id ?? '')
      if (!start || !end) return []
      const length = wall.length_mm ?? Math.hypot(end.x_mm - start.x_mm, end.y_mm - start.y_mm)
      return [{ id: wall.id, start: { x_mm: start.x_mm, y_mm: start.y_mm }, end: { x_mm: end.x_mm, y_mm: end.y_mm }, length_mm: length }]
    })

    const objects = placementsRef.current.map((placement) => ({
      id: placement.id,
      type: 'base' as const,
      wall_id: placement.wall_id,
      offset_mm: placement.offset_mm,
      width_mm: placement.width_mm,
      depth_mm: placement.depth_mm,
      height_mm: placement.height_mm,
    }))
    const openings = openingsRef.current.map((opening) => ({
      id: opening.id,
      wall_id: opening.wall_id,
      offset_mm: opening.offset_mm,
      width_mm: opening.width_mm,
    }))
    const constraints = (room.ceiling_constraints as CeilingConstraint[] | undefined) ?? []

    setValidationLoading(true)
    try {
      const result = await validateApi.run(projectId, {
        user_id: 'anonymous',
        roomPolygon,
        objects,
        openings,
        walls,
        ceilingConstraints: constraints,
        nominalCeilingMm: room.ceiling_height_mm,
      })
      setValidationResult(result)
    } catch (error) {
      console.error('Validierung fehlgeschlagen:', error)
    } finally {
      setValidationLoading(false)
    }
  }, [openingsRef, placementsRef, projectId, selectedRoomRef, setValidationLoading, setValidationResult])

  const handleSaveCeilingConstraints = useCallback((constraints: CeilingConstraint[]) => {
    if (!selectedRoomRef.current) return
    roomsApi.update(selectedRoomRef.current.id, {
      ceiling_constraints: constraints as unknown[],
    }).then((updated) => {
      onRoomUpdated(updated)
    }).catch((error: Error) => console.error('Dachschraegen speichern fehlgeschlagen:', error))
  }, [onRoomUpdated, selectedRoomRef])

  const handleReferenceImageUpdate = useCallback((img: NonNullable<EditorState['referenceImage']>) => {
    onReferenceImageLocalUpdate(img)
    if (!selectedRoomRef.current) return

    roomsApi.updateReferenceImage(selectedRoomRef.current.id, img)
      .then((updated) => {
        onRoomUpdated(updated)
      })
      .catch((error: Error) => {
        console.error('Referenzbild speichern fehlgeschlagen:', error)
      })
  }, [onReferenceImageLocalUpdate, onRoomUpdated, selectedRoomRef])

  return {
    handleRunValidation,
    handleSaveCeilingConstraints,
    handleReferenceImageUpdate,
  }
}

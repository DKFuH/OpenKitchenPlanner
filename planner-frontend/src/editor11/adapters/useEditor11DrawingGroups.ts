import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { drawingGroupsApi, type DrawingGroup, type DrawingGroupConfigPatch, type DrawingGroupMember } from '../../api/drawingGroups.js'
import { dimensionsApi, type Dimension } from '../../api/dimensions.js'
import { centerlinesApi, type Centerline } from '../../api/centerlines.js'
import { roomsApi } from '../../api/rooms.js'
import type { Opening } from '../../api/openings.js'
import type { Placement } from '../../api/placements.js'

interface UseEditor11DrawingGroupsArgs {
  projectId: string | null
  selectedRoomId: string | null
  setDrawingGroups: Dispatch<SetStateAction<DrawingGroup[]>>
  setSelectedDrawingGroupId: Dispatch<SetStateAction<string | null>>
  setOpenings: Dispatch<SetStateAction<Opening[]>>
  setPlacements: Dispatch<SetStateAction<Placement[]>>
  setDimensions: Dispatch<SetStateAction<Dimension[]>>
  setCenterlines: Dispatch<SetStateAction<Centerline[]>>
  onSelectPlacement: (placementId: string | null) => void
  onSelectOpening: (openingId: string | null) => void
  onClearSelection: () => void
}

export function useEditor11DrawingGroups({
  projectId,
  selectedRoomId,
  setDrawingGroups,
  setSelectedDrawingGroupId,
  setOpenings,
  setPlacements,
  setDimensions,
  setCenterlines,
  onSelectPlacement,
  onSelectOpening,
  onClearSelection,
}: UseEditor11DrawingGroupsArgs) {
  const reloadDrawingGroups = useCallback(async () => {
    if (!projectId) {
      setDrawingGroups([])
      setSelectedDrawingGroupId(null)
      return
    }

    const groups = await drawingGroupsApi.list(projectId)
    setDrawingGroups(groups)
    setSelectedDrawingGroupId((previous) => (previous && groups.some((group) => group.id === previous) ? previous : null))
  }, [projectId, setDrawingGroups, setSelectedDrawingGroupId])

  const refreshSelectedRoomCollections = useCallback(async () => {
    if (!projectId || !selectedRoomId) {
      return
    }

    const [rooms, nextDimensions, nextCenterlines] = await Promise.all([
      roomsApi.list(projectId),
      dimensionsApi.list(selectedRoomId),
      centerlinesApi.list(selectedRoomId),
    ])

    const room = rooms.find((entry) => entry.id === selectedRoomId)
    setOpenings((room?.openings ?? []) as Opening[])
    setPlacements((room?.placements ?? []) as Placement[])
    setDimensions(nextDimensions)
    setCenterlines(nextCenterlines)
  }, [projectId, selectedRoomId, setCenterlines, setDimensions, setOpenings, setPlacements])

  const handleSelectDrawingGroup = useCallback((groupId: string | null, drawingGroups: DrawingGroup[]) => {
    setSelectedDrawingGroupId(groupId)
    if (!groupId) {
      onClearSelection()
      return
    }

    const selectedGroup = drawingGroups.find((group) => group.id === groupId)
    const placementMember = selectedGroup?.members_json.find((member) => member.entity_type === 'placement')
    const openingMember = selectedGroup?.members_json.find((member) => member.entity_type === 'opening')

    if (placementMember?.entity_id) {
      onSelectPlacement(placementMember.entity_id)
      return
    }

    if (openingMember?.entity_id) {
      onSelectOpening(openingMember.entity_id)
      return
    }

    onClearSelection()
  }, [onClearSelection, onSelectOpening, onSelectPlacement, setSelectedDrawingGroupId])

  const handleCreateDrawingGroup = useCallback((payload: {
    name: string
    kind: DrawingGroup['kind']
    members_json: DrawingGroupMember[]
  }) => {
    if (!projectId) {
      return
    }

    void drawingGroupsApi.create(projectId, payload)
      .then((created) => {
        setDrawingGroups((previous) => [created, ...previous])
        setSelectedDrawingGroupId(created.id)
      })
      .catch((groupError: Error) => {
        console.error('S90: Gruppe konnte nicht erstellt werden:', groupError)
      })
  }, [projectId, setDrawingGroups, setSelectedDrawingGroupId])

  const handleDeleteDrawingGroup = useCallback((groupId: string) => {
    void drawingGroupsApi.remove(groupId)
      .then(() => {
        setDrawingGroups((previous) => previous.filter((group) => group.id !== groupId))
        setSelectedDrawingGroupId((previous) => (previous === groupId ? null : previous))
      })
      .catch((groupError: Error) => {
        console.error('S90: Gruppe konnte nicht gelöscht werden:', groupError)
      })
  }, [setDrawingGroups, setSelectedDrawingGroupId])

  const handleApplyDrawingGroupTransform = useCallback((groupId: string, payload: {
    translate?: { x_mm: number; y_mm: number }
    rotation_deg?: number
  }) => {
    void drawingGroupsApi.applyTransform(groupId, payload)
      .then(() => Promise.all([refreshSelectedRoomCollections(), reloadDrawingGroups()]))
      .catch((groupError: Error) => {
        console.error('S90: Gruppen-Transform fehlgeschlagen:', groupError)
      })
  }, [refreshSelectedRoomCollections, reloadDrawingGroups])

  const handleSyncDrawingGroupConfig = useCallback((groupId: string, config: DrawingGroupConfigPatch) => {
    void drawingGroupsApi.update(groupId, {
      config_json: config as Record<string, unknown>,
      sync_members: true,
    })
      .then(() => Promise.all([refreshSelectedRoomCollections(), reloadDrawingGroups()]))
      .catch((groupError: Error) => {
        console.error('S90: Gruppen-Lock/Visibility Sync fehlgeschlagen:', groupError)
      })
  }, [refreshSelectedRoomCollections, reloadDrawingGroups])

  return {
    reloadDrawingGroups,
    refreshSelectedRoomCollections,
    handleSelectDrawingGroup,
    handleCreateDrawingGroup,
    handleDeleteDrawingGroup,
    handleApplyDrawingGroupTransform,
    handleSyncDrawingGroupConfig,
  }
}

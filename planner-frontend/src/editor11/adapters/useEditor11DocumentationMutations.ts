import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { SectionLine } from '@shared/types'
import { annotationsApi } from '../../api/rooms.js'
import type { ProjectDetail } from '../../api/projects.js'
import { verticalConnectionsApi, type VerticalConnection, type VerticalConnectionKind } from '../../api/verticalConnections.js'
import type { BuildingLevel } from '../../api/levels.js'
import type { RoomPayload } from '../../api/rooms.js'

interface UseEditor11DocumentationMutationsArgs {
  project: ProjectDetail | null
  projectId: string | null
  selectedRoomId: string | null
  activeLevelId: string | null
  levels: BuildingLevel[]
  setVerticalConnections: Dispatch<SetStateAction<VerticalConnection[]>>
  setSectionLines: Dispatch<SetStateAction<SectionLine[]>>
  setSelectedSectionLineId: Dispatch<SetStateAction<string | null>>
  buildFootprintFromRoom: (room: RoomPayload) => Record<string, unknown>
  buildDefaultSectionLine: (room: RoomPayload) => Omit<SectionLine, 'id' | 'room_id'>
}

export function useEditor11DocumentationMutations({
  project,
  projectId,
  selectedRoomId,
  activeLevelId,
  levels,
  setVerticalConnections,
  setSectionLines,
  setSelectedSectionLineId,
  buildFootprintFromRoom,
  buildDefaultSectionLine,
}: UseEditor11DocumentationMutationsArgs) {
  const handleCreateVerticalConnection = useCallback(async (payload: {
    from_level_id: string
    to_level_id: string
    kind: VerticalConnectionKind
    stair_json: Record<string, unknown>
  }) => {
    if (!projectId) {
      throw new Error('Projektkontext fehlt')
    }

    if (!selectedRoomId || !project) {
      throw new Error('Bitte zuerst einen Raum auswählen')
    }

    const room = project.rooms.find((entry) => entry.id === selectedRoomId)
    if (!room) {
      throw new Error('Ausgewählter Raum nicht gefunden')
    }

    const created = await verticalConnectionsApi.create(projectId, {
      from_level_id: payload.from_level_id,
      to_level_id: payload.to_level_id,
      kind: payload.kind,
      stair_json: payload.stair_json,
      footprint_json: buildFootprintFromRoom(room as unknown as RoomPayload),
    })

    setVerticalConnections((previous) => [...previous, created].sort((left, right) => left.created_at.localeCompare(right.created_at)))
  }, [buildFootprintFromRoom, project, projectId, selectedRoomId, setVerticalConnections])

  const handleUpdateVerticalConnection = useCallback(async (connectionId: string, payload: {
    from_level_id: string
    to_level_id: string
    kind: VerticalConnectionKind
    stair_json: Record<string, unknown>
  }) => {
    const updated = await verticalConnectionsApi.update(connectionId, payload)
    setVerticalConnections((previous) => previous.map((entry) => (entry.id === updated.id ? updated : entry)))
  }, [setVerticalConnections])

  const handleDeleteVerticalConnection = useCallback(async (connectionId: string) => {
    await verticalConnectionsApi.remove(connectionId)
    setVerticalConnections((previous) => previous.filter((entry) => entry.id !== connectionId))
  }, [setVerticalConnections])

  const handleCreateSectionLine = useCallback(async (payload: {
    label?: string
    depth_mm?: number
    direction: 'left' | 'right' | 'both'
    level_scope: 'room_level' | 'single_level' | 'range' | 'all_levels'
    sheet_visibility: 'all' | 'sheet_only' | 'hidden'
  }) => {
    if (!selectedRoomId || !project) {
      throw new Error('Bitte zuerst einen Raum auswählen')
    }

    const room = project.rooms.find((entry) => entry.id === selectedRoomId)
    if (!room) {
      throw new Error('Ausgewählter Raum nicht gefunden')
    }

    const line = buildDefaultSectionLine(room as unknown as RoomPayload)
    const requestPayload: Record<string, unknown> = {
      ...line,
      ...(payload.label ? { label: payload.label } : {}),
      ...(typeof payload.depth_mm === 'number' ? { depth_mm: payload.depth_mm } : {}),
      direction: payload.direction,
      level_scope: payload.level_scope,
      sheet_visibility: payload.sheet_visibility,
    }

    if (payload.level_scope === 'single_level') {
      if (!activeLevelId) {
        throw new Error('Aktive Ebene fehlt für single_level')
      }
      requestPayload.level_id = activeLevelId
    }

    if (payload.level_scope === 'range') {
      const ordered = [...levels].sort((left, right) => left.order_index - right.order_index)
      const from = ordered[0]?.id
      const to = ordered[ordered.length - 1]?.id
      if (!from || !to || from === to) {
        throw new Error('Für level_scope=range sind mindestens zwei Ebenen erforderlich')
      }
      requestPayload.from_level_id = from
      requestPayload.to_level_id = to
    }

    const created = await annotationsApi.createSection(selectedRoomId, requestPayload as Omit<SectionLine, 'id' | 'room_id'>)
    setSectionLines((previous) => [...previous, created])
    setSelectedSectionLineId(created.id)
  }, [activeLevelId, buildDefaultSectionLine, levels, project, selectedRoomId, setSectionLines, setSelectedSectionLineId])

  const handleUpdateSectionLine = useCallback(async (sectionId: string, patch: {
    label?: string
    depth_mm?: number
    direction: 'left' | 'right' | 'both'
    level_scope: 'room_level' | 'single_level' | 'range' | 'all_levels'
    sheet_visibility: 'all' | 'sheet_only' | 'hidden'
  }) => {
    if (!selectedRoomId) {
      throw new Error('Bitte zuerst einen Raum auswählen')
    }

    const requestPatch: Record<string, unknown> = {
      ...(patch.label ? { label: patch.label } : { label: '' }),
      ...(typeof patch.depth_mm === 'number' ? { depth_mm: patch.depth_mm } : {}),
      direction: patch.direction,
      level_scope: patch.level_scope,
      sheet_visibility: patch.sheet_visibility,
      level_id: null,
      from_level_id: null,
      to_level_id: null,
    }

    if (patch.level_scope === 'single_level') {
      if (!activeLevelId) {
        throw new Error('Aktive Ebene fehlt für single_level')
      }
      requestPatch.level_id = activeLevelId
    }

    if (patch.level_scope === 'range') {
      const ordered = [...levels].sort((left, right) => left.order_index - right.order_index)
      const from = ordered[0]?.id
      const to = ordered[ordered.length - 1]?.id
      if (!from || !to || from === to) {
        throw new Error('Für level_scope=range sind mindestens zwei Ebenen erforderlich')
      }
      requestPatch.from_level_id = from
      requestPatch.to_level_id = to
    }

    const updated = await annotationsApi.updateSection(selectedRoomId, sectionId, requestPatch as Partial<Omit<SectionLine, 'id' | 'room_id'>>)
    setSectionLines((previous) => previous.map((entry) => (entry.id === updated.id ? updated : entry)))
  }, [activeLevelId, levels, selectedRoomId, setSectionLines])

  const handleDeleteSectionLine = useCallback(async (sectionId: string) => {
    if (!selectedRoomId) {
      throw new Error('Bitte zuerst einen Raum auswählen')
    }

    await annotationsApi.deleteSectionLine(selectedRoomId, sectionId)
    setSectionLines((previous) => previous.filter((entry) => entry.id !== sectionId))
    setSelectedSectionLineId((previous) => (previous === sectionId ? null : previous))
  }, [selectedRoomId, setSectionLines, setSelectedSectionLineId])

  return {
    handleCreateVerticalConnection,
    handleUpdateVerticalConnection,
    handleDeleteVerticalConnection,
    handleCreateSectionLine,
    handleUpdateSectionLine,
    handleDeleteSectionLine,
  }
}

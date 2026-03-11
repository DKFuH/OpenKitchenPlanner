import { useEditor11EntityMutations } from './useEditor11EntityMutations.js'
import { useEditor11ImportExportActions } from './useEditor11ImportExportActions.js'
import { useEditor11RoomContext } from './useEditor11RoomContext.js'
import { useEditor11RoomIntegrity } from './useEditor11RoomIntegrity.js'
import { useEditor11RoomMutations } from './useEditor11RoomMutations.js'

interface UseEditor11RoomOperationsArgs {
  roomContextArgs: Parameters<typeof useEditor11RoomContext>[0]
  roomMutationsArgs: Omit<Parameters<typeof useEditor11RoomMutations>[0], 'selectedRoomRef'>
  entityMutationsArgs: Omit<Parameters<typeof useEditor11EntityMutations>[0], 'selectedRoomRef' | 'openingsRef' | 'placementsRef'>
  roomIntegrityArgs: Omit<Parameters<typeof useEditor11RoomIntegrity>[0], 'selectedRoomRef' | 'openingsRef' | 'placementsRef' | 'onRoomUpdated'>
  importExportArgs: Omit<Parameters<typeof useEditor11ImportExportActions>[0], 'selectedRoomRef'>
}

export function useEditor11RoomOperations({
  roomContextArgs,
  roomMutationsArgs,
  entityMutationsArgs,
  roomIntegrityArgs,
  importExportArgs,
}: UseEditor11RoomOperationsArgs) {
  const roomContext = useEditor11RoomContext(roomContextArgs)
  const roomMutations = useEditor11RoomMutations({
    ...roomMutationsArgs,
    selectedRoomRef: roomContext.selectedRoomRef,
  })
  const entityMutations = useEditor11EntityMutations({
    ...entityMutationsArgs,
    selectedRoomRef: roomContext.selectedRoomRef,
    openingsRef: roomContext.openingsRef,
    placementsRef: roomContext.placementsRef,
  })
  const roomIntegrity = useEditor11RoomIntegrity({
    ...roomIntegrityArgs,
    selectedRoomRef: roomContext.selectedRoomRef,
    openingsRef: roomContext.openingsRef,
    placementsRef: roomContext.placementsRef,
    onRoomUpdated: roomMutations.handleRoomUpdated,
  })
  const importExport = useEditor11ImportExportActions({
    ...importExportArgs,
    selectedRoomRef: roomContext.selectedRoomRef,
  })

  return {
    ...roomContext,
    ...roomMutations,
    ...entityMutations,
    ...roomIntegrity,
    ...importExport,
  }
}

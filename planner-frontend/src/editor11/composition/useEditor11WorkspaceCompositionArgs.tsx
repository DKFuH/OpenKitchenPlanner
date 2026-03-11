import type { RoomPayload } from '../../api/rooms.js'
import type { CeilingConstraint } from '../../components/editor/RightSidebar.js'
import { useEditor11WorkspaceComposition } from './useEditor11WorkspaceComposition.js'
import {
  buildEditor11InspectorArgs,
  buildEditor11SectionPanelArgs,
  buildEditor11ShellArgs,
  buildEditor11SidebarArgs,
  buildEditor11ViewportArgs,
  type Editor11WorkspaceCompositionArgsInput,
} from './editor11WorkspaceCompositionBuilders.js'

type WorkspaceCompositionArgs = Parameters<typeof useEditor11WorkspaceComposition>[0]

export function useEditor11WorkspaceCompositionArgs(
  input: Editor11WorkspaceCompositionArgsInput,
): WorkspaceCompositionArgs {
  const { roomOperations } = input
  const selectedRoom = roomOperations.selectedRoom as unknown as RoomPayload | null
  const ceilingConstraints = (selectedRoom?.ceiling_constraints as CeilingConstraint[] | undefined) ?? []
  const context = {
    selectedRoom,
    ceilingConstraints,
  }

  return {
    sidebarArgs: buildEditor11SidebarArgs(input),
    inspectorArgs: buildEditor11InspectorArgs(input, context),
    viewportArgs: buildEditor11ViewportArgs(input, context),
    sectionPanelArgs: buildEditor11SectionPanelArgs(input),
    shellArgs: buildEditor11ShellArgs(input),
  }
}

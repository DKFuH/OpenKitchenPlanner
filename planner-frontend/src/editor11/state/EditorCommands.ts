export type EditorCommand =
  | { id: 'selection.clear' }
  | { id: 'select.room'; roomId: string }
  | { id: 'select.wall'; roomId: string; wallId: string }
  | { id: 'select.opening'; roomId: string; openingId: string }
  | { id: 'select.placement'; roomId: string; placementId: string }
  | { id: 'layout.set'; layout: 'triple' | 'focus-2d' | 'focus-3d' | 'focus-wall' }
  | { id: 'panel.toggle-inspector' }
  | { id: 'panel.toggle-left-sidebar' }

export type EditorCommandHandler = (command: EditorCommand) => void

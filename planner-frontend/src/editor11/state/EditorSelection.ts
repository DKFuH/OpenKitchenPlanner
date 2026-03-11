export type EditorSelection =
  | { kind: 'none' }
  | { kind: 'room'; roomId: string }
  | { kind: 'wall'; roomId: string; wallId: string }
  | { kind: 'opening'; roomId: string; openingId: string }
  | { kind: 'placement'; roomId: string; placementId: string }
  | { kind: 'dimension'; roomId: string; dimensionId: string }

export type EditorTool11 =
  | 'select'
  | 'draw-wall'
  | 'draw-room'
  | 'add-opening'
  | 'place-object'
  | 'dimension'
  | 'pan'
  | 'orbit'

export interface EditorStateSnapshot {
  projectId: string | null
  activeLevelId: string | null
  activeRoomId: string | null
  activeWallId: string | null
  selection: EditorSelection
  activeTool: EditorTool11
  inspectorOpen: boolean
  leftSidebarOpen: boolean
  viewLayout: 'triple' | 'focus-2d' | 'focus-3d' | 'focus-wall'
}

import type { DrawingGroup, DrawingGroupConfigPatch, DrawingGroupMember } from '../../../api/drawingGroups.js'
import { GroupsPanel } from '../../../components/editor/GroupsPanel.js'

interface LegacyGroupsInspectorSectionProps {
  drawingGroups: DrawingGroup[]
  selectedDrawingGroupId: string | null
  currentSelectionMembers: DrawingGroupMember[]
  onSelectDrawingGroup: (groupId: string | null) => void
  onCreateDrawingGroup: (payload: {
    name: string
    kind: DrawingGroup['kind']
    members_json: DrawingGroupMember[]
  }) => void
  onDeleteDrawingGroup: (groupId: string) => void
  onApplyDrawingGroupTransform: (groupId: string, payload: {
    translate?: { x_mm: number; y_mm: number }
    rotation_deg?: number
  }) => void
  onSyncDrawingGroupConfig: (groupId: string, config: DrawingGroupConfigPatch) => void
}

export function LegacyGroupsInspectorSection(props: LegacyGroupsInspectorSectionProps) {
  return (
    <GroupsPanel
      groups={props.drawingGroups}
      selectedGroupId={props.selectedDrawingGroupId}
      selectionMembers={props.currentSelectionMembers}
      onSelectGroup={props.onSelectDrawingGroup}
      onCreateGroup={props.onCreateDrawingGroup}
      onDeleteGroup={props.onDeleteDrawingGroup}
      onApplyTransform={props.onApplyDrawingGroupTransform}
      onSyncConfig={props.onSyncDrawingGroupConfig}
    />
  )
}

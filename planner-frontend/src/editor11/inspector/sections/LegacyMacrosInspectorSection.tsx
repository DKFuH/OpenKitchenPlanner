import type { Placement } from '../../../api/placements.js'
import { MacrosPanel } from '../../../components/editor/MacrosPanel.js'

interface LegacyMacrosInspectorSectionProps {
  projectId: string
  selectedRoomId: string | null
  placements: Placement[]
}

export function LegacyMacrosInspectorSection({
  projectId,
  selectedRoomId,
  placements,
}: LegacyMacrosInspectorSectionProps) {
  return selectedRoomId ? <MacrosPanel projectId={projectId} currentPlacements={placements} /> : null
}

import type { Placement } from '../../../api/placements.js'
import { KitchenAssistantPanel } from '../../../pages/KitchenAssistantPanel.js'

interface LegacyKitchenAssistantInspectorSectionProps {
  selectedRoomId: string | null
  placements: Placement[]
}

export function LegacyKitchenAssistantInspectorSection({
  selectedRoomId,
  placements,
}: LegacyKitchenAssistantInspectorSectionProps) {
  return <KitchenAssistantPanel roomId={selectedRoomId} placements={placements} />
}

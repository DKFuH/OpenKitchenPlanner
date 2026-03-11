import type { Room } from '../../../api/projects.js'
import { RoomFeaturesPanel } from '../../../components/editor/RoomFeaturesPanel.js'

interface LegacyRoomFeaturesInspectorSectionProps {
  selectedRoomId: string | null
  room: Room | null
}

export function LegacyRoomFeaturesInspectorSection({
  selectedRoomId,
  room,
}: LegacyRoomFeaturesInspectorSectionProps) {
  return selectedRoomId && room ? <RoomFeaturesPanel roomId={selectedRoomId} /> : null
}

import { ConstraintsPanel } from '../../../pages/ConstraintsPanel.js'

export function LegacyConstraintsInspectorSection({ selectedRoomId }: { selectedRoomId: string | null }) {
  return selectedRoomId ? <ConstraintsPanel roomId={selectedRoomId} /> : null
}

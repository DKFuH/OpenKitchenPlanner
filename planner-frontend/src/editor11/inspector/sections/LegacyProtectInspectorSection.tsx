import type { Room } from '../../../api/projects.js'
import type { Placement } from '../../../api/placements.js'
import { ProtectPanel } from '../../../components/editor/ProtectPanel.js'

interface LegacyProtectInspectorSectionProps {
  projectId: string
  selectedRoomId: string | null
  placements: Placement[]
  room: Room | null
}

export function LegacyProtectInspectorSection({
  projectId,
  selectedRoomId,
  placements,
  room,
}: LegacyProtectInspectorSectionProps) {
  return (
    <ProtectPanel
      projectId={projectId}
      roomId={selectedRoomId}
      placements={placements}
      ceilingHeightMm={room?.ceiling_height_mm ?? 2500}
    />
  )
}

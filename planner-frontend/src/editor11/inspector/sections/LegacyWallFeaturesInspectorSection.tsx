import type { Point2D } from '@shared/types'
import { WallFeaturesPanel } from '../../../components/editor/WallFeaturesPanel.js'

interface LegacyWallFeaturesInspectorSectionProps {
  selectedRoomId: string | null
  selectedWallGeom: { id: string; start: Point2D; end: Point2D } | null
  edgeLengthMm: number | null
}

export function LegacyWallFeaturesInspectorSection({
  selectedRoomId,
  selectedWallGeom,
  edgeLengthMm,
}: LegacyWallFeaturesInspectorSectionProps) {
  if (!selectedWallGeom || !selectedRoomId) {
    return null
  }

  return (
    <WallFeaturesPanel
      roomId={selectedRoomId}
      wallId={selectedWallGeom.id}
      wallLengthMm={edgeLengthMm ?? 1000}
    />
  )
}

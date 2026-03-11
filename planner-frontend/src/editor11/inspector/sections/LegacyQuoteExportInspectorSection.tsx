import type { Placement } from '../../../api/placements.js'
import { QuoteExportSection } from '../QuoteExportSection.js'

interface LegacyQuoteExportInspectorSectionProps {
  projectId: string
  selectedRoomId: string | null
  placements: Placement[]
}

export function LegacyQuoteExportInspectorSection({
  projectId,
  selectedRoomId,
  placements,
}: LegacyQuoteExportInspectorSectionProps) {
  return (
    <QuoteExportSection
      projectId={projectId}
      selectedRoomId={selectedRoomId}
      placements={placements}
    />
  )
}

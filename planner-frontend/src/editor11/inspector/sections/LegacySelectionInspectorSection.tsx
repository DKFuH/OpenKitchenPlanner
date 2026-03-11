import type { Point2D, Vertex } from '@shared/types'
import type { Opening } from '../../../api/openings.js'
import type { Placement } from '../../../api/placements.js'
import type { UnifiedCatalogItem } from '../../../api/catalog.js'
import type { DimensionAssistSegment } from '../../../editor/roomTopology.js'
import {
  EdgePanel,
  KonfiguratorPanel,
  OpeningPanel,
  PlacementPanel,
  type ConfiguredDimensions,
  VertexPanel,
} from '../../../components/editor/RightSidebar.js'

interface LegacySelectionInspectorSectionProps {
  selectedOpening: Opening | null
  selectedPlacement: Placement | null
  selectedVertex: Vertex | null
  selectedVertexIndex: number | null
  selectedEdgeIndex: number | null
  edgeLengthMm: number | null
  dimensionAssistSegments: DimensionAssistSegment[]
  selectedCatalogItem: UnifiedCatalogItem | null
  configuredDimensions: ConfiguredDimensions | null
  chosenOptions: Record<string, string>
  onUpdateOpening: (opening: Opening) => void
  onDeleteOpening: (openingId: string) => void
  onUpdatePlacement: (placement: Placement) => void
  onDeletePlacement: (placementId: string) => void
  onMoveVertex: (index: number, pos: Point2D) => void
  onSetEdgeLength: (edgeIndex: number, lengthMm: number, options?: { fineStep?: boolean }) => void
  onEdgeLengthDraftChange: (lengthMm: number | null) => void
  onConfigureDimensions: (dims: ConfiguredDimensions) => void
  onSetChosenOptions: (options: Record<string, string>) => void
}

export function LegacySelectionInspectorSection({
  selectedOpening,
  selectedPlacement,
  selectedVertex,
  selectedVertexIndex,
  selectedEdgeIndex,
  edgeLengthMm,
  dimensionAssistSegments,
  selectedCatalogItem,
  configuredDimensions,
  chosenOptions,
  onUpdateOpening,
  onDeleteOpening,
  onUpdatePlacement,
  onDeletePlacement,
  onMoveVertex,
  onSetEdgeLength,
  onEdgeLengthDraftChange,
  onConfigureDimensions,
  onSetChosenOptions,
}: LegacySelectionInspectorSectionProps) {
  if (selectedOpening) {
    return (
      <OpeningPanel
        key={selectedOpening.id}
        opening={selectedOpening}
        onUpdate={onUpdateOpening}
        onDelete={onDeleteOpening}
      />
    )
  }

  if (selectedPlacement) {
    return (
      <PlacementPanel
        key={selectedPlacement.id}
        placement={selectedPlacement}
        onUpdate={onUpdatePlacement}
        onDelete={onDeletePlacement}
      />
    )
  }

  if (selectedVertex !== null && selectedVertexIndex !== null) {
    return (
      <VertexPanel
        key={selectedVertex.id}
        index={selectedVertexIndex}
        vertex={selectedVertex}
        onMove={onMoveVertex}
      />
    )
  }

  if (selectedEdgeIndex !== null && edgeLengthMm !== null) {
    return (
      <EdgePanel
        key={selectedEdgeIndex}
        edgeIndex={selectedEdgeIndex}
        lengthMm={edgeLengthMm}
        dimensionAssistSegments={dimensionAssistSegments}
        onSetLength={onSetEdgeLength}
        onDraftChange={onEdgeLengthDraftChange}
      />
    )
  }

  if (selectedCatalogItem && configuredDimensions) {
    return (
      <KonfiguratorPanel
        key={selectedCatalogItem.id}
        item={selectedCatalogItem}
        dimensions={configuredDimensions}
        onChange={onConfigureDimensions}
        chosenOptions={chosenOptions}
        onSetOptions={onSetChosenOptions}
      />
    )
  }

  return null
}

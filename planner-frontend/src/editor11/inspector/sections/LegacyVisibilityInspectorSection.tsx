import type { BuildingLevel } from '../../../api/levels.js'
import type { Placement } from '../../../api/placements.js'
import type { Dimension } from '../../../api/dimensions.js'
import type { AutoDollhousePatch, AutoDollhouseSettings } from '../../../api/visibility.js'
import { VisibilityPanel } from '../../../components/editor/VisibilityPanel.js'

interface LegacyVisibilityInspectorSectionProps {
  levels: BuildingLevel[]
  activeLevelId: string | null
  dimensions: Dimension[]
  placements: Placement[]
  selectedWallVisible: boolean | null
  autoDollhouse: AutoDollhouseSettings | null
  autoDollhouseSaving: boolean
  onToggleActiveLevelVisibility: (next: boolean) => void
  onSetDimensionsVisible: (next: boolean) => void
  onSetPlacementsVisible: (next: boolean) => void
  onSetSelectedWallVisible: (next: boolean) => void
  onSaveAutoDollhouse: (patch: AutoDollhousePatch) => void
}

export function LegacyVisibilityInspectorSection({
  levels,
  activeLevelId,
  dimensions,
  placements,
  selectedWallVisible,
  autoDollhouse,
  autoDollhouseSaving,
  onToggleActiveLevelVisibility,
  onSetDimensionsVisible,
  onSetPlacementsVisible,
  onSetSelectedWallVisible,
  onSaveAutoDollhouse,
}: LegacyVisibilityInspectorSectionProps) {
  const activeLevel = levels.find((level) => level.id === activeLevelId) ?? null
  const dimensionsVisible = dimensions.length > 0
    ? dimensions.every((dimension) => dimension.visible !== false)
    : null
  const placementsVisible = placements.length > 0
    ? placements.every((placement) => placement.visible !== false)
    : null

  return (
    <VisibilityPanel
      activeLevelName={activeLevel?.name ?? null}
      activeLevelVisible={activeLevel ? activeLevel.visible : null}
      dimensionsVisible={dimensionsVisible}
      placementsVisible={placementsVisible}
      selectedWallVisible={selectedWallVisible}
      autoDollhouse={autoDollhouse}
      autoDollhouseSaving={autoDollhouseSaving}
      onToggleActiveLevelVisibility={onToggleActiveLevelVisibility}
      onSetDimensionsVisible={onSetDimensionsVisible}
      onSetPlacementsVisible={onSetPlacementsVisible}
      onSetSelectedWallVisible={onSetSelectedWallVisible}
      onSaveAutoDollhouse={onSaveAutoDollhouse}
    />
  )
}

import type { BuildingLevel } from '../../../api/levels.js'
import type { Placement } from '../../../api/placements.js'
import type { Dimension } from '../../../api/dimensions.js'
import { LockPanel } from '../../../components/editor/LockPanel.js'

interface LegacyLockingInspectorSectionProps {
  levels: BuildingLevel[]
  activeLevelId: string | null
  dimensions: Dimension[]
  selectedPlacement: Placement | null
  safeEditMode: boolean
  selectedWallLocked: boolean | null
  onToggleSafeEditMode: (enabled: boolean) => void
  onSetActiveLevelLocked: (next: boolean) => void
  onSetDimensionsLocked: (next: boolean) => void
  onSetSelectedPlacementLocked: (next: boolean) => void
  onSetSelectedWallLocked: (next: boolean) => void
}

export function LegacyLockingInspectorSection({
  levels,
  activeLevelId,
  dimensions,
  selectedPlacement,
  safeEditMode,
  selectedWallLocked,
  onToggleSafeEditMode,
  onSetActiveLevelLocked,
  onSetDimensionsLocked,
  onSetSelectedPlacementLocked,
  onSetSelectedWallLocked,
}: LegacyLockingInspectorSectionProps) {
  const activeLevel = levels.find((level) => level.id === activeLevelId) ?? null
  const dimensionsLocked = dimensions.length > 0
    ? dimensions.every((dimension) => dimension.locked === true)
    : null
  const selectedPlacementLocked = selectedPlacement
    ? Boolean(selectedPlacement.locked)
    : null

  return (
    <LockPanel
      safeEditMode={safeEditMode}
      activeLevelLocked={activeLevel ? activeLevel.locked : null}
      dimensionsLocked={dimensionsLocked}
      selectedPlacementLocked={selectedPlacementLocked}
      selectedWallLocked={selectedWallLocked}
      onToggleSafeEditMode={onToggleSafeEditMode}
      onSetActiveLevelLocked={onSetActiveLevelLocked}
      onSetDimensionsLocked={onSetDimensionsLocked}
      onSetSelectedPlacementLocked={onSetSelectedPlacementLocked}
      onSetSelectedWallLocked={onSetSelectedWallLocked}
    />
  )
}

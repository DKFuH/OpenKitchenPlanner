import type { Point2D } from '@shared/types'
import { CeilingConstraintPanel, type CeilingConstraint } from '../../../components/editor/RightSidebar.js'

interface LegacyCeilingConstraintsInspectorSectionProps {
  ceilingConstraints: CeilingConstraint[]
  selectedWallGeom: { id: string; start: Point2D; end: Point2D } | null
  onSaveCeilingConstraints: (constraints: CeilingConstraint[]) => void
}

export function LegacyCeilingConstraintsInspectorSection(props: LegacyCeilingConstraintsInspectorSectionProps) {
  return (
    <CeilingConstraintPanel
      constraints={props.ceilingConstraints}
      wallGeom={props.selectedWallGeom}
      onSave={props.onSaveCeilingConstraints}
    />
  )
}

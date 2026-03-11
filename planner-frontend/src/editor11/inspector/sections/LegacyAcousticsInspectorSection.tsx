import type { AcousticGridMeta } from '../../../api/acoustics.js'
import { AcousticPanel } from '../../../components/editor/RightSidebar.js'

interface LegacyAcousticsInspectorSectionProps {
  acousticEnabled: boolean
  acousticOpacityPct: number
  acousticVariable: 'spl_db' | 'spl_dba' | 't20_s' | 'sti'
  acousticGrids: AcousticGridMeta[]
  activeAcousticGridId: string | null
  acousticMin: number | null
  acousticMax: number | null
  acousticBusy: boolean
  onToggleAcoustics: (enabled: boolean) => void
  onSetAcousticOpacityPct: (value: number) => void
  onSetAcousticVariable: (value: 'spl_db' | 'spl_dba' | 't20_s' | 'sti') => void
  onAcousticUpload: (file: File) => void
  onSelectAcousticGrid: (gridId: string | null) => void
  onDeleteAcousticGrid: (gridId: string) => void
}

export function LegacyAcousticsInspectorSection(props: LegacyAcousticsInspectorSectionProps) {
  return (
    <AcousticPanel
      enabled={props.acousticEnabled}
      opacityPct={props.acousticOpacityPct}
      variable={props.acousticVariable}
      grids={props.acousticGrids}
      activeGridId={props.activeAcousticGridId}
      min={props.acousticMin}
      max={props.acousticMax}
      busy={props.acousticBusy}
      onToggle={props.onToggleAcoustics}
      onSetOpacityPct={props.onSetAcousticOpacityPct}
      onSetVariable={props.onSetAcousticVariable}
      onUpload={props.onAcousticUpload}
      onSelectGrid={props.onSelectAcousticGrid}
      onDeleteGrid={props.onDeleteAcousticGrid}
    />
  )
}

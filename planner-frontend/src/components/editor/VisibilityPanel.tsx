import styles from './VisibilityPanel.module.css'

interface Props {
  activeLevelName: string | null
  activeLevelVisible: boolean | null
  dimensionsVisible: boolean | null
  placementsVisible: boolean | null
  selectedWallVisible: boolean | null
  onToggleActiveLevelVisibility: (next: boolean) => void
  onSetDimensionsVisible: (next: boolean) => void
  onSetPlacementsVisible: (next: boolean) => void
  onSetSelectedWallVisible: (next: boolean) => void
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (next: boolean) => void
}) {
  return (
    <label className={styles.row}>
      <span className={styles.label}>{label}</span>
      <input
        type='checkbox'
        checked={value ?? false}
        disabled={value == null}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

export function VisibilityPanel({
  activeLevelName,
  activeLevelVisible,
  dimensionsVisible,
  placementsVisible,
  selectedWallVisible,
  onToggleActiveLevelVisibility,
  onSetDimensionsVisible,
  onSetPlacementsVisible,
  onSetSelectedWallVisible,
}: Props) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>Visibility</h3>

      <ToggleRow
        label={activeLevelName ? `Ebene: ${activeLevelName}` : 'Aktive Ebene'}
        value={activeLevelVisible}
        onChange={onToggleActiveLevelVisibility}
      />

      <ToggleRow
        label='Maße (Raum)'
        value={dimensionsVisible}
        onChange={onSetDimensionsVisible}
      />

      <ToggleRow
        label='Assets / Placements'
        value={placementsVisible}
        onChange={onSetPlacementsVisible}
      />

      <ToggleRow
        label='Selektierte Wand'
        value={selectedWallVisible}
        onChange={onSetSelectedWallVisible}
      />

      <p className={styles.hint}>S88: Sichtbarkeit für Ebenen, Maße, Assets und Wände.</p>
    </section>
  )
}

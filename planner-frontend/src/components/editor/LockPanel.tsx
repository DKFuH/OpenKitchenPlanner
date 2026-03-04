import styles from './LockPanel.module.css'

interface Props {
  safeEditMode: boolean
  activeLevelLocked: boolean | null
  dimensionsLocked: boolean | null
  selectedPlacementLocked: boolean | null
  selectedWallLocked: boolean | null
  onToggleSafeEditMode: (next: boolean) => void
  onSetActiveLevelLocked: (next: boolean) => void
  onSetDimensionsLocked: (next: boolean) => void
  onSetSelectedPlacementLocked: (next: boolean) => void
  onSetSelectedWallLocked: (next: boolean) => void
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

export function LockPanel({
  safeEditMode,
  activeLevelLocked,
  dimensionsLocked,
  selectedPlacementLocked,
  selectedWallLocked,
  onToggleSafeEditMode,
  onSetActiveLevelLocked,
  onSetDimensionsLocked,
  onSetSelectedPlacementLocked,
  onSetSelectedWallLocked,
}: Props) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>Locking & Safe-Edit</h3>

      <label className={styles.row}>
        <span className={styles.label}>Safe-Edit Modus</span>
        <input
          type='checkbox'
          checked={safeEditMode}
          onChange={(event) => onToggleSafeEditMode(event.target.checked)}
        />
      </label>

      <ToggleRow
        label='Aktive Ebene sperren'
        value={activeLevelLocked}
        onChange={onSetActiveLevelLocked}
      />

      <ToggleRow
        label='Maße (Raum) sperren'
        value={dimensionsLocked}
        onChange={onSetDimensionsLocked}
      />

      <ToggleRow
        label='Selektiertes Asset sperren'
        value={selectedPlacementLocked}
        onChange={onSetSelectedPlacementLocked}
      />

      <ToggleRow
        label='Selektierte Wand sperren'
        value={selectedWallLocked}
        onChange={onSetSelectedWallLocked}
      />

      <p className={styles.hint}>Gelockte Objekte sind gegen versehentliche Änderungen geschützt.</p>
    </section>
  )
}

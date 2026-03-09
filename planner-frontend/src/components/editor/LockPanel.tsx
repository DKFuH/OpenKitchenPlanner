import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    padding: '0.75rem',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  title: {
    margin: '0 0 0.45rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.05em',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.4rem',
  },
  label: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground1,
  },
  hint: {
    margin: '0.25rem 0 0',
    fontSize: '0.74rem',
    color: tokens.colorNeutralForeground3,
  },
})

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
  const styles = useStyles();

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
  const styles = useStyles();

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

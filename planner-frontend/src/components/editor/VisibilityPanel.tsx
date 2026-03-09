import { useEffect, useState } from 'react'
import type { AutoDollhousePatch, AutoDollhouseSettings } from '../../api/visibility.js'
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
  autoSection: {
    marginTop: '0.7rem',
    paddingTop: '0.55rem',
    borderTop: `1px dashed ${tokens.colorNeutralStroke1}`,
  },
  autoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.45rem',
  },
  autoTitle: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  autoStatus: {
    fontSize: '0.72rem',
    color: tokens.colorNeutralForeground3,
  },
  field: {
    display: 'grid',
    gap: '0.2rem',
    marginBottom: '0.45rem',
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground1,
  },
  saveButton: {
    width: '100%',
    fontSize: '0.76rem',
    padding: '0.35rem 0.5rem',
    borderRadius: '6px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    background: 'var(--surface-raised, #182130)',
    color: tokens.colorNeutralForeground1,
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
})

interface Props {
  activeLevelName: string | null
  activeLevelVisible: boolean | null
  dimensionsVisible: boolean | null
  placementsVisible: boolean | null
  selectedWallVisible: boolean | null
  autoDollhouse: AutoDollhouseSettings | null
  autoDollhouseSaving: boolean
  onToggleActiveLevelVisibility: (next: boolean) => void
  onSetDimensionsVisible: (next: boolean) => void
  onSetPlacementsVisible: (next: boolean) => void
  onSetSelectedWallVisible: (next: boolean) => void
  onSaveAutoDollhouse: (patch: AutoDollhousePatch) => void
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

export function VisibilityPanel({
activeLevelName,
  activeLevelVisible,
  dimensionsVisible,
  placementsVisible,
  selectedWallVisible,
  autoDollhouse,
  autoDollhouseSaving,
  onToggleActiveLevelVisibility,
  onSetDimensionsVisible,
  onSetPlacementsVisible,
  onSetSelectedWallVisible,
  onSaveAutoDollhouse,
}: Props) {
  const styles = useStyles();

  const [draftEnabled, setDraftEnabled] = useState(false)
  const [draftAlpha, setDraftAlpha] = useState(0.32)
  const [draftDistance, setDraftDistance] = useState(2400)
  const [draftAngle, setDraftAngle] = useState(35)

  useEffect(() => {
    if (!autoDollhouse) {
      return
    }
    setDraftEnabled(autoDollhouse.enabled)
    setDraftAlpha(autoDollhouse.alpha_front_walls)
    setDraftDistance(autoDollhouse.distance_threshold)
    setDraftAngle(autoDollhouse.angle_threshold_deg)
  }, [autoDollhouse])

  const autoDollhouseReady = autoDollhouse !== null

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

      <div className={styles.autoSection}>
        <div className={styles.autoHeader}>
          <span className={styles.autoTitle}>Auto-Dollhouse</span>
          <span className={styles.autoStatus}>
            {draftEnabled ? 'Auto aktiv' : 'Manuell'}
          </span>
        </div>

        <label className={styles.row}>
          <span className={styles.label}>Frontwände automatisch ausblenden</span>
          <input
            type='checkbox'
            checked={draftEnabled}
            disabled={!autoDollhouseReady}
            onChange={(event) => setDraftEnabled(event.target.checked)}
          />
        </label>

        <label className={styles.field}>
          Alpha Frontwände ({draftAlpha.toFixed(2)})
          <input
            type='range'
            min={0.05}
            max={0.95}
            step={0.01}
            value={draftAlpha}
            disabled={!autoDollhouseReady}
            onChange={(event) => setDraftAlpha(Number(event.target.value))}
          />
        </label>

        <label className={styles.field}>
          Distanz-Schwelle ({Math.round(draftDistance)} mm)
          <input
            type='range'
            min={300}
            max={6000}
            step={50}
            value={draftDistance}
            disabled={!autoDollhouseReady}
            onChange={(event) => setDraftDistance(Number(event.target.value))}
          />
        </label>

        <label className={styles.field}>
          Winkel-Schwelle ({Math.round(draftAngle)}°)
          <input
            type='range'
            min={5}
            max={85}
            step={1}
            value={draftAngle}
            disabled={!autoDollhouseReady}
            onChange={(event) => setDraftAngle(Number(event.target.value))}
          />
        </label>

        <button
          type='button'
          className={styles.saveButton}
          disabled={!autoDollhouseReady || autoDollhouseSaving}
          onClick={() => onSaveAutoDollhouse({
            enabled: draftEnabled,
            alpha_front_walls: draftAlpha,
            distance_threshold: Math.round(draftDistance),
            angle_threshold_deg: Math.round(draftAngle),
          })}
        >
          {autoDollhouseSaving ? 'Speichere…' : 'Auto-Dollhouse speichern'}
        </button>
      </div>

      <p className={styles.hint}>S88: Sichtbarkeit für Ebenen, Maße, Assets und Wände.</p>
    </section>
  )
}

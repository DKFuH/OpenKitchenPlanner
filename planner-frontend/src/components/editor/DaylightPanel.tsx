import { CompassOverlay } from './CompassOverlay.js'
import type { ProjectEnvironment, SunPreview } from '../../plugins/daylight/index.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    padding: '12px',
    display: 'grid',
    gap: '10px',
  },
  title: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '600',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  field: {
    display: 'grid',
    gap: '4px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    '& input': {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      borderRadius: tokens.borderRadiusSmall,
      background: tokens.colorNeutralBackground1,
      padding: '6px 8px',
      fontSize: '13px',
    },
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  slider: {
    width: '100%',
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  btnPrimary: {
    border: `1px solid ${tokens.colorBrandForeground1}`,
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    borderRadius: tokens.borderRadiusSmall,
    padding: '6px 10px',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.65',
      cursor: 'not-allowed',
    },
  },
  btnSecondary: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    borderRadius: tokens.borderRadiusSmall,
    padding: '6px 10px',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.65',
      cursor: 'not-allowed',
    },
  },
  meta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  pill: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusCircular,
    padding: '3px 8px',
    background: tokens.colorNeutralBackground2,
  },
})

interface Props {
  environment: ProjectEnvironment
  preview: SunPreview | null
  loadingPreview: boolean
  savingEnvironment: boolean
  onChange: (patch: Partial<ProjectEnvironment>) => void
  onSave: () => void
  onRefreshPreview: () => void
}

function toLocalDatetimeInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetMs = date.getTimezoneOffset() * 60_000
  const local = new Date(date.getTime() - offsetMs)
  return local.toISOString().slice(0, 16)
}

function fromLocalDatetimeInput(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function toNumber(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function DaylightPanel({
environment,
  preview,
  loadingPreview,
  savingEnvironment,
  onChange,
  onSave,
  onRefreshPreview,
}: Props) {
  const styles = useStyles()

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Tageslicht</h3>
        <CompassOverlay northAngleDeg={environment.north_angle_deg} mode='inline' />
      </div>

      <div className={styles.grid}>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          Nordrichtung: {Math.round(environment.north_angle_deg)}°
          <input
            className={styles.slider}
            type='range'
            min={0}
            max={360}
            step={1}
            value={environment.north_angle_deg}
            onChange={(event) => onChange({ north_angle_deg: Number(event.target.value) })}
          />
        </label>

        <label className={styles.field}>
          Breitengrad
          <input
            type='number'
            step='0.0001'
            min='-90'
            max='90'
            value={environment.latitude ?? ''}
            onChange={(event) => onChange({ latitude: toNumber(event.target.value) })}
            placeholder='z. B. 48.137'
          />
        </label>

        <label className={styles.field}>
          Längengrad
          <input
            type='number'
            step='0.0001'
            min='-180'
            max='180'
            value={environment.longitude ?? ''}
            onChange={(event) => onChange({ longitude: toNumber(event.target.value) })}
            placeholder='z. B. 11.576'
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          Datum/Uhrzeit
          <input
            type='datetime-local'
            value={toLocalDatetimeInput(environment.default_datetime)}
            onChange={(event) => onChange({ default_datetime: fromLocalDatetimeInput(event.target.value) })}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          Zeitzone
          <input
            value={environment.timezone ?? ''}
            onChange={(event) => onChange({ timezone: event.target.value || null })}
            placeholder='Europe/Berlin'
          />
        </label>
      </div>

      <label className={styles.toggle}>
        <input
          type='checkbox'
          checked={environment.daylight_enabled}
          onChange={(event) => onChange({ daylight_enabled: event.target.checked })}
        />
        Tageslicht aktiv
      </label>

      <div className={styles.actions}>
        <button type='button' className={styles.btnPrimary} disabled={savingEnvironment} onClick={onSave}>
          {savingEnvironment ? 'Speichert…' : 'Speichern'}
        </button>
        <button type='button' className={styles.btnSecondary} disabled={loadingPreview} onClick={onRefreshPreview}>
          {loadingPreview ? 'Berechnet…' : 'Sonnenstand berechnen'}
        </button>
      </div>

      {preview && (
        <div className={styles.meta}>
          <span className={styles.pill}>Azimut {preview.azimuth_deg.toFixed(1)}°</span>
          <span className={styles.pill}>Elevation {preview.elevation_deg.toFixed(1)}°</span>
          <span className={styles.pill}>Intensität {(preview.intensity * 100).toFixed(0)}%</span>
        </div>
      )}
    </section>
  )
}

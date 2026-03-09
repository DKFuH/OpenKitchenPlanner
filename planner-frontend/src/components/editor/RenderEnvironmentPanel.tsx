import type {
  RenderEnvironmentPreset,
  RenderEnvironmentSettings,
} from './renderEnvironmentState.js'
import {
  applyRenderEnvironmentPreset,
  clampEnvironmentIntensity,
  normalizeEnvironmentRotation,
  normalizeGroundTint,
} from './renderEnvironmentState.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    background: 'var(--editor-surface)',
    border: '1px solid var(--editor-border)',
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    padding: '0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  title: {
    margin: '0',
    fontSize: '0.9rem',
    color: 'var(--editor-text)',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.5rem',
  },
  presetCard: {
    border: '1px solid var(--editor-border)',
    borderRadius: tokens.borderRadiusSmall,
    background: 'var(--editor-surface-alt)',
    color: 'var(--editor-text)',
    padding: '0.35rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    cursor: 'pointer',
    textAlign: 'left',
    '& strong': {
      fontSize: '0.75rem',
    },
    '& small': {
      fontSize: '0.64rem',
      color: 'var(--editor-text-muted)',
      lineHeight: '1.2',
    },
  },
  presetCardActive: {
    boxShadow: `0 0 0 1px color-mix(in srgb, ${tokens.colorBrandForeground1} 45%, transparent)`,
    border: `1px solid ${tokens.colorBrandForeground1}`,
  },
  presetPreview: {
    width: '100%',
    aspectRatio: '2.4 / 1',
    borderRadius: `calc(${tokens.borderRadiusSmall} - 2px)`,
    border: '1px solid var(--editor-border)',
  },
  presetPreviewStudio: {
    background: 'linear-gradient(145deg, #e5edf7 0%, #adbfd8 55%, #6f8aad 100%)',
  },
  presetPreviewDaylight: {
    background: 'linear-gradient(145deg, #d8efff 0%, #78b4ff 55%, #2f6cb0 100%)',
  },
  presetPreviewInterior: {
    background: 'linear-gradient(145deg, #c5ab90 0%, #7a6658 55%, #3f3644 100%)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.55rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.28rem',
    fontSize: '0.72rem',
    color: 'var(--editor-text-muted)',
    '& input': {
      background: 'var(--editor-surface-alt)',
      border: '1px solid var(--editor-border)',
      borderRadius: tokens.borderRadiusSmall,
      color: 'var(--editor-text)',
      padding: '0.34rem 0.5rem',
      fontSize: '0.75rem',
    },
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  slider: {
    accentColor: tokens.colorBrandForeground1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.55rem',
  },
  tintControl: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.72rem',
    color: 'var(--editor-text-muted)',
  },
  tintPicker: {
    width: '1.6rem',
    height: '1.6rem',
    padding: '0',
    border: 'none',
    background: 'transparent',
  },
  btnPrimary: {
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    border: 'none',
    borderRadius: tokens.borderRadiusCircular,
    padding: '0.34rem 0.82rem',
    cursor: 'pointer',
    fontSize: '0.78rem',
    '&:disabled': {
      opacity: '0.55',
      cursor: 'not-allowed',
    },
  },
})

interface Props {
  presets: RenderEnvironmentPreset[]
  environment: RenderEnvironmentSettings
  saving: boolean
  onChange: (next: RenderEnvironmentSettings) => void
  onSave: () => void
}

function presetPreviewClassName(
  presetId: RenderEnvironmentSettings['preset_id'],
  styles: ReturnType<typeof useStyles>,
): string {
  if (presetId === 'studio') return styles.presetPreviewStudio
  if (presetId === 'interior') return styles.presetPreviewInterior
  return styles.presetPreviewDaylight
}

export function RenderEnvironmentPanel({
presets,
  environment,
  saving,
  onChange,
  onSave,
}: Props) {
  const styles = useStyles();

  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>Render-Umgebung</h3>

      <div className={styles.presetGrid}>
        {presets.map((preset) => {
          const selected = environment.preset_id === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              className={`${styles.presetCard} ${selected ? styles.presetCardActive : ''}`}
              onClick={() => onChange(applyRenderEnvironmentPreset(environment, preset.id))}
            >
              <span className={`${styles.presetPreview} ${presetPreviewClassName(preset.id, styles)}`} />
              <strong>{preset.label}</strong>
              <small>{preset.description}</small>
            </button>
          )
        })}
      </div>

      <div className={styles.grid}>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          Intensitaet: {environment.intensity.toFixed(2)}
          <input
            className={styles.slider}
            type="range"
            min={0.2}
            max={2}
            step={0.05}
            value={environment.intensity}
            onChange={(event) => onChange({
              ...environment,
              intensity: clampEnvironmentIntensity(Number(event.target.value)),
            })}
          />
        </label>

        <label className={styles.field}>
          Rotation (Grad)
          <input
            type="number"
            min={0}
            max={360}
            step={1}
            value={Math.round(environment.rotation_deg)}
            onChange={(event) => onChange({
              ...environment,
              rotation_deg: normalizeEnvironmentRotation(Number(event.target.value)),
            })}
          />
        </label>

        <label className={styles.field}>
          Ground Tint
          <input
            value={environment.ground_tint}
            onChange={(event) => onChange({
              ...environment,
              ground_tint: normalizeGroundTint(event.target.value, environment.preset_id),
            })}
            placeholder="#9AB77C"
          />
        </label>
      </div>

      <div className={styles.actions}>
        <label className={styles.tintControl}>
          <span>Tint</span>
          <input
            className={styles.tintPicker}
            type="color"
            value={environment.ground_tint}
            onChange={(event) => onChange({
              ...environment,
              ground_tint: normalizeGroundTint(event.target.value, environment.preset_id),
            })}
          />
        </label>
        <button type="button" className={styles.btnPrimary} onClick={onSave} disabled={saving}>
          {saving ? 'Speichert...' : 'Speichern'}
        </button>
      </div>
    </section>
  )
}

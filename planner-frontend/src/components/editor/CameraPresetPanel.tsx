import { useMemo, useState } from 'react'
import type { CameraPreset, CameraPresetMode } from '../../api/cameraPresets.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: '0',
    width: '320px',
    maxHeight: 'min(72vh, 560px)',
    overflow: 'auto',
    border: '1px solid var(--editor-border)',
    borderRadius: tokens.borderRadiusMedium,
    background: 'var(--editor-surface)',
    boxShadow: tokens.shadow16,
    zIndex: '110',
    padding: '0.6rem',
    display: 'grid',
    gap: '0.55rem',
  },
  title: {
    margin: '0',
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--editor-text-muted)',
  },
  field: {
    display: 'grid',
    gap: '0.25rem',
    fontSize: '0.76rem',
    color: 'var(--editor-text-muted)',
    '& input': {
      border: '1px solid var(--editor-border)',
      borderRadius: tokens.borderRadiusSmall,
      background: 'var(--editor-surface-alt)',
      color: 'var(--editor-text)',
      padding: '0.35rem 0.45rem',
    },
    '& select': {
      border: '1px solid var(--editor-border)',
      borderRadius: tokens.borderRadiusSmall,
      background: 'var(--editor-surface-alt)',
      color: 'var(--editor-text)',
      padding: '0.35rem 0.45rem',
    },
  },
  inline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  action: {
    border: '1px solid var(--editor-border)',
    borderRadius: tokens.borderRadiusSmall,
    background: 'var(--editor-surface-alt)',
    color: 'var(--editor-text)',
    padding: '0.35rem 0.55rem',
    fontSize: '0.74rem',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.55',
      cursor: 'not-allowed',
    },
  },
  list: {
    display: 'grid',
    gap: '0.4rem',
  },
  item: {
    border: '1px solid var(--editor-border)',
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.4rem',
    background: 'var(--editor-surface-alt)',
    display: 'grid',
    gap: '0.3rem',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.45rem',
  },
  itemName: {
    fontSize: '0.78rem',
    color: 'var(--editor-text)',
  },
  itemMeta: {
    fontSize: '0.72rem',
    color: 'var(--editor-text-muted)',
  },
  itemActions: {
    display: 'flex',
    gap: '0.35rem',
  },
  empty: {
    margin: '0',
    color: 'var(--editor-text-muted)',
    fontSize: '0.75rem',
  },
  checkboxRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.75rem',
    color: 'var(--editor-text)',
  },
})

interface Props {
  presets: CameraPreset[]
  activePresetId: string | null
  loading: boolean
  saving: boolean
  cameraFovDeg: number
  onSetCameraFovDeg: (next: number) => void
  onSaveCurrentPreset: (payload: { name: string; mode: CameraPresetMode; isDefault: boolean }) => void
  onApplyPreset: (presetId: string) => void
  onDeletePreset: (presetId: string) => void
  onSetDefaultPreset: (presetId: string) => void
}

export function CameraPresetPanel({
presets,
  activePresetId,
  loading,
  saving,
  cameraFovDeg,
  onSetCameraFovDeg,
  onSaveCurrentPreset,
  onApplyPreset,
  onDeletePreset,
  onSetDefaultPreset,
}: Props) {
  const styles = useStyles();

  const [name, setName] = useState('Neue Ansicht')
  const [mode, setMode] = useState<CameraPresetMode>('orbit')
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  const sortedPresets = useMemo(
    () => [...presets].sort((left, right) => left.name.localeCompare(right.name)),
    [presets],
  )

  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>Camera Presets</h3>

      <label className={styles.field}>
        FOV ({Math.round(cameraFovDeg)}°)
        <input
          type='range'
          min={20}
          max={110}
          step={1}
          value={cameraFovDeg}
          onChange={(event) => onSetCameraFovDeg(Number(event.target.value))}
        />
      </label>

      <label className={styles.field}>
        Preset-Name
        <input
          type='text'
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder='Neue Ansicht'
        />
      </label>

      <label className={styles.field}>
        Modus
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value === 'visitor' ? 'visitor' : 'orbit')}
        >
          <option value='orbit'>Orbit</option>
          <option value='visitor'>Visitor</option>
        </select>
      </label>

      <label className={styles.checkboxRow}>
        <input
          type='checkbox'
          checked={saveAsDefault}
          onChange={(event) => setSaveAsDefault(event.target.checked)}
        />
        Als Default speichern
      </label>

      <button
        type='button'
        className={styles.action}
        disabled={saving || name.trim().length === 0}
        onClick={() => onSaveCurrentPreset({
          name: name.trim(),
          mode,
          isDefault: saveAsDefault,
        })}
      >
        {saving ? 'Speichere…' : 'Aktuelle Ansicht speichern'}
      </button>

      {loading ? (
        <p className={styles.empty}>Presets werden geladen…</p>
      ) : sortedPresets.length === 0 ? (
        <p className={styles.empty}>Noch keine Kamera-Presets vorhanden.</p>
      ) : (
        <div className={styles.list}>
          {sortedPresets.map((preset) => (
            <article key={preset.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <strong className={styles.itemName}>{preset.name}</strong>
                <span className={styles.itemMeta}>{preset.id === activePresetId ? 'aktiv' : ''}</span>
              </div>
              <div className={styles.itemMeta}>
                {preset.mode} · FOV {Math.round(preset.fov)}° {preset.is_default ? '· default' : ''}
              </div>
              <div className={styles.itemActions}>
                <button type='button' className={styles.action} onClick={() => onApplyPreset(preset.id)}>
                  Anwenden
                </button>
                <button type='button' className={styles.action} onClick={() => onSetDefaultPreset(preset.id)}>
                  Default
                </button>
                <button type='button' className={styles.action} onClick={() => onDeletePreset(preset.id)}>
                  Entfernen
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

import { useMemo, useState, type FormEvent } from 'react'
import type { BuildingLevel } from '../../api/levels.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  section: {
    padding: '0.75rem',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  title: {
    margin: '0 0 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.05em',
  },
  empty: {
    margin: '0 0 0.5rem',
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
  },
  list: {
    listStyle: 'none',
    margin: '0',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  levelButton: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    border: 'none',
    background: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.35rem 0.5rem',
    cursor: 'pointer',
    fontSize: '0.82rem',
    '&:hover': {
      background: 'var(--surface-hover)',
    },
  },
  levelButtonActive: {
    background: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: '600',
  },
  meta: {
    color: tokens.colorNeutralForeground3,
    fontSize: '0.75rem',
  },
  visibilityToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.74rem',
    color: tokens.colorNeutralForeground3,
  },
  addButton: {
    width: '100%',
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.35rem',
    fontSize: '0.8rem',
    background: 'none',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    '&:hover': {
      color: tokens.colorBrandForeground1,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  confirmButton: {
    width: 'auto',
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.35rem',
    fontSize: '0.8rem',
    background: 'none',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    '&:hover': {
      color: tokens.colorBrandForeground1,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
    flex: '1',
  },
  cancelButton: {
    width: 'auto',
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.35rem',
    fontSize: '0.8rem',
    background: 'none',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    '&:hover': {
      color: tokens.colorBrandForeground1,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
    flex: '1',
  },
  addForm: {
    marginTop: '0.35rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  fieldLabel: {
    fontSize: '0.73rem',
    color: tokens.colorNeutralForeground3,
  },
  select: {
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    padding: '0.3rem 0.45rem',
    fontSize: '0.8rem',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    padding: '0.3rem 0.45rem',
    fontSize: '0.8rem',
  },
  actions: {
    display: 'flex',
    gap: '0.35rem',
  },
})

interface Props {
  levels: BuildingLevel[]
  activeLevelId: string | null
  onSelectLevel: (id: string) => void
  onToggleVisibility: (level: BuildingLevel) => void
  onCreateLevel: (payload: { name: string; elevation_mm: number }) => void
}

type LevelPreset = 'EG' | 'OG' | 'UG' | 'custom'

const PRESET_ELEVATIONS: Record<Exclude<LevelPreset, 'custom'>, number> = {
  EG: 0,
  OG: 2800,
  UG: -2800,
}

export function LevelsPanel({
levels, activeLevelId, onSelectLevel, onToggleVisibility, onCreateLevel }: Props) {
  const styles = useStyles();

  const [adding, setAdding] = useState(false)
  const [preset, setPreset] = useState<LevelPreset>('EG')
  const [customName, setCustomName] = useState('')

  const sortedLevels = useMemo(
    () => [...levels].sort((left, right) => left.order_index - right.order_index),
    [levels],
  )

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const name = preset === 'custom' ? customName.trim() : preset
    if (!name) {
      return
    }

    const elevation = preset === 'custom' ? 0 : PRESET_ELEVATIONS[preset]
    onCreateLevel({ name, elevation_mm: elevation })

    setCustomName('')
    setPreset('EG')
    setAdding(false)
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>Ebenen</h3>

      {sortedLevels.length === 0 ? (
        <p className={styles.empty}>Keine Ebene verfügbar</p>
      ) : (
        <ul className={styles.list}>
          {sortedLevels.map((level) => (
            <li key={level.id} className={styles.row}>
              <button
                type="button"
                className={`${styles.levelButton} ${activeLevelId === level.id ? styles.levelButtonActive : ''}`}
                onClick={() => onSelectLevel(level.id)}
                title={`Ebene ${level.name} auswählen`}
              >
                <span>{level.name}</span>
                <span className={styles.meta}>{level.elevation_mm} mm</span>
              </button>
              <label className={styles.visibilityToggle}>
                <input
                  type="checkbox"
                  checked={level.visible}
                  onChange={() => onToggleVisibility(level)}
                />
                Sichtbar
              </label>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form className={styles.addForm} onSubmit={handleSubmit}>
          <label className={styles.fieldLabel} htmlFor="level-preset-select">Typ</label>
          <select
            id="level-preset-select"
            className={styles.select}
            value={preset}
            onChange={(event) => setPreset(event.target.value as LevelPreset)}
          >
            <option value="EG">EG</option>
            <option value="OG">OG</option>
            <option value="UG">UG</option>
            <option value="custom">Custom</option>
          </select>

          {preset === 'custom' && (
            <>
              <label className={styles.fieldLabel} htmlFor="level-custom-name">Name</label>
              <input
                id="level-custom-name"
                className={styles.input}
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="z. B. Galerie"
              />
            </>
          )}

          <div className={styles.actions}>
            <button type="submit" className={styles.confirmButton}>Anlegen</button>
            <button type="button" className={styles.cancelButton} onClick={() => setAdding(false)}>Abbrechen</button>
          </div>
        </form>
      ) : (
        <button type="button" className={styles.addButton} onClick={() => setAdding(true)}>
          + Ebene hinzufügen
        </button>
      )}
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import type { SectionLine } from '@shared/types'
import type { BuildingLevel } from '../../api/levels.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  section: {
    padding: '0.75rem',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  title: {
    margin: '0',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.05em',
  },
  newButton: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.72rem',
    padding: '0.18rem 0.45rem',
    cursor: 'pointer',
    '&:hover': {
      color: tokens.colorBrandForeground1,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.6',
    },
  },
  list: {
    listStyle: 'none',
    margin: '0',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    maxHeight: '132px',
    overflowY: 'auto',
  },
  rowButton: {
    width: '100%',
    textAlign: 'left',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    padding: '0.3rem 0.4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.12rem',
    cursor: 'pointer',
    '&:hover': {
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.6',
    },
  },
  rowButtonActive: {
    background: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandForeground1}`,
  },
  rowLabel: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  rowMeta: {
    fontSize: '0.7rem',
    color: tokens.colorNeutralForeground3,
  },
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0.24rem',
  },
  label: {
    fontSize: '0.68rem',
    color: tokens.colorNeutralForeground3,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.25rem 0.4rem',
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.76rem',
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.6',
    },
  },
  hint: {
    margin: '0',
    fontSize: '0.76rem',
    color: tokens.colorNeutralForeground3,
  },
  warn: {
    margin: '0',
    fontSize: '0.74rem',
    color: 'var(--status-warning-text)',
    background: 'var(--status-warning-bg)',
    border: '1px solid var(--status-warning-border)',
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.3rem 0.45rem',
  },
  error: {
    margin: '0',
    fontSize: '0.74rem',
    color: tokens.colorPaletteRedForeground1,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.3rem',
  },
  primaryButton: {
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorBrandForeground1}`,
    fontSize: '0.74rem',
    padding: '0.26rem 0.35rem',
    cursor: 'pointer',
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.6',
    },
  },
  secondaryButton: {
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: '0.74rem',
    padding: '0.26rem 0.35rem',
    cursor: 'pointer',
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.6',
    },
  },
  deleteButton: {
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorPaletteRedForeground1}`,
    fontSize: '0.74rem',
    padding: '0.26rem 0.35rem',
    cursor: 'pointer',
    background: tokens.colorNeutralBackground1,
    color: tokens.colorPaletteRedForeground1,
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '0.6',
    },
  },
})

type SectionDirection = 'left' | 'right' | 'both'
type SectionScope = 'room_level' | 'single_level' | 'range' | 'all_levels'
type SectionVisibility = 'all' | 'sheet_only' | 'hidden'

interface Props {
  enabled: boolean
  hasSelectedRoom: boolean
  activeLevelId: string | null
  levels: BuildingLevel[]
  sections: SectionLine[]
  selectedSectionId: string | null
  onSelect: (id: string | null) => void
  onCreate: (payload: {
    label?: string
    depth_mm?: number
    direction: SectionDirection
    level_scope: SectionScope
    sheet_visibility: SectionVisibility
  }) => Promise<void>
  onUpdate: (id: string, patch: {
    label?: string
    depth_mm?: number
    direction: SectionDirection
    level_scope: SectionScope
    sheet_visibility: SectionVisibility
  }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const SCOPE_OPTIONS: Array<{ value: SectionScope; label: string }> = [
  { value: 'room_level', label: 'Raumebene' },
  { value: 'single_level', label: 'Aktive Ebene' },
  { value: 'range', label: 'Ebenenbereich' },
  { value: 'all_levels', label: 'Alle Ebenen' },
]

const DIRECTION_OPTIONS: Array<{ value: SectionDirection; label: string }> = [
  { value: 'both', label: 'Beidseitig' },
  { value: 'left', label: 'Links' },
  { value: 'right', label: 'Rechts' },
]

const VISIBILITY_OPTIONS: Array<{ value: SectionVisibility; label: string }> = [
  { value: 'all', label: 'Alle Sheets' },
  { value: 'sheet_only', label: 'Nur aktives Sheet' },
  { value: 'hidden', label: 'Ausgeblendet' },
]

export function SectionPanel({
enabled,
  hasSelectedRoom,
  activeLevelId,
  levels,
  sections,
  selectedSectionId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const styles = useStyles();

  const [label, setLabel] = useState('')
  const [depthMm, setDepthMm] = useState('1500')
  const [direction, setDirection] = useState<SectionDirection>('both')
  const [levelScope, setLevelScope] = useState<SectionScope>('room_level')
  const [sheetVisibility, setSheetVisibility] = useState<SectionVisibility>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSection = useMemo(
    () => sections.find((entry) => entry.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  )

  useEffect(() => {
    if (!selectedSection) {
      return
    }

    setLabel(selectedSection.label ?? '')
    setDepthMm(typeof selectedSection.depth_mm === 'number' ? String(selectedSection.depth_mm) : '1500')
    setDirection((selectedSection.direction as SectionDirection | undefined) ?? 'both')
    setLevelScope((selectedSection.level_scope as SectionScope | undefined) ?? 'room_level')
    setSheetVisibility((selectedSection.sheet_visibility as SectionVisibility | undefined) ?? 'all')
  }, [selectedSection])

  function resetForCreate() {
    onSelect(null)
    setLabel('')
    setDepthMm('1500')
    setDirection('both')
    setLevelScope('room_level')
    setSheetVisibility('all')
    setError(null)
  }

  function buildPayload() {
    const parsedDepth = Number(depthMm)

    return {
      ...(label.trim() ? { label: label.trim() } : {}),
      ...(Number.isFinite(parsedDepth) && parsedDepth > 0 ? { depth_mm: parsedDepth } : {}),
      direction,
      level_scope: levelScope,
      sheet_visibility: sheetVisibility,
    }
  }

  async function handleCreate() {
    if (!enabled || busy) return
    if (!hasSelectedRoom) {
      setError('Bitte zuerst einen Raum auswählen.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onCreate(buildPayload())
      resetForCreate()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Schnitt konnte nicht erstellt werden.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    if (!enabled || busy || !selectedSectionId) return

    setBusy(true)
    setError(null)
    try {
      await onUpdate(selectedSectionId, buildPayload())
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Schnitt konnte nicht gespeichert werden.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!enabled || busy || !selectedSectionId) return

    setBusy(true)
    setError(null)
    try {
      await onDelete(selectedSectionId)
      resetForCreate()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Schnitt konnte nicht gelöscht werden.')
    } finally {
      setBusy(false)
    }
  }

  const activeLevelName = activeLevelId
    ? levels.find((entry) => entry.id === activeLevelId)?.name ?? 'Unbekannte Ebene'
    : null

  if (!enabled) {
    return (
      <section className={styles.section}>
        <h3 className={styles.title}>Sektionen</h3>
        <p className={styles.hint}>Plugin deaktiviert</p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sektionen</h3>
        <button type="button" className={styles.newButton} disabled={busy} onClick={resetForCreate}>
          Neu
        </button>
      </div>

      {sections.length === 0 ? (
        <p className={styles.hint}>Keine vertikalen Schnitte im Raum.</p>
      ) : (
        <ul className={styles.list}>
          {sections.map((entry) => {
            const isActive = entry.id === selectedSectionId
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`${styles.rowButton} ${isActive ? styles.rowButtonActive : ''}`}
                  onClick={() => {
                    onSelect(entry.id)
                    setError(null)
                  }}
                >
                  <span className={styles.rowLabel}>{entry.label?.trim() || `Schnitt ${entry.id.slice(0, 8)}`}</span>
                  <span className={styles.rowMeta}>{entry.level_scope ?? 'room_level'} · {entry.direction ?? 'both'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className={styles.form}>
        <label className={styles.label} htmlFor="section-label">Label</label>
        <input
          id="section-label"
          className={styles.input}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={busy}
          placeholder="z. B. S-A"
        />

        <label className={styles.label} htmlFor="section-depth">Schnitttiefe (mm)</label>
        <input
          id="section-depth"
          className={styles.input}
          type="number"
          min={1}
          value={depthMm}
          onChange={(event) => setDepthMm(event.target.value)}
          disabled={busy}
        />

        <label className={styles.label} htmlFor="section-direction">Richtung</label>
        <select
          id="section-direction"
          className={styles.input}
          value={direction}
          onChange={(event) => setDirection(event.target.value as SectionDirection)}
          disabled={busy}
        >
          {DIRECTION_OPTIONS.map((entry) => (
            <option key={entry.value} value={entry.value}>{entry.label}</option>
          ))}
        </select>

        <label className={styles.label} htmlFor="section-scope">Level-Scope</label>
        <select
          id="section-scope"
          className={styles.input}
          value={levelScope}
          onChange={(event) => setLevelScope(event.target.value as SectionScope)}
          disabled={busy}
        >
          {SCOPE_OPTIONS.map((entry) => (
            <option key={entry.value} value={entry.value}>{entry.label}</option>
          ))}
        </select>

        <label className={styles.label} htmlFor="section-visibility">Sheet-Sichtbarkeit</label>
        <select
          id="section-visibility"
          className={styles.input}
          value={sheetVisibility}
          onChange={(event) => setSheetVisibility(event.target.value as SectionVisibility)}
          disabled={busy}
        >
          {VISIBILITY_OPTIONS.map((entry) => (
            <option key={entry.value} value={entry.value}>{entry.label}</option>
          ))}
        </select>
      </div>

      {activeLevelName && <p className={styles.hint}>Aktive Ebene: {activeLevelName}</p>}
      {!hasSelectedRoom && <p className={styles.warn}>Zum Arbeiten mit Schnitten muss ein Raum ausgewählt sein.</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={busy || !hasSelectedRoom}
          onClick={() => {
            void handleCreate()
          }}
        >
          {busy ? 'Arbeite…' : 'Anlegen'}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={busy || !selectedSectionId}
          onClick={() => {
            void handleSave()
          }}
        >
          Speichern
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          disabled={busy || !selectedSectionId}
          onClick={() => {
            void handleDelete()
          }}
        >
          Löschen
        </button>
      </div>
    </section>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import type { Macro } from '@shared/types'
import { macrosApi } from '../../api/projectFeatures.js'
import type { Placement } from '../../api/placements.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  section: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  collapseHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    '&:hover': {
      background: 'var(--surface-hover)',
    },
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.05em',
  },
  muted: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
    margin: '0 0.75rem 0.5rem',
  },
  hint: {
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground3,
    margin: '0 0 0.3rem',
  },
  error: {
    fontSize: '0.8rem',
    color: tokens.colorPaletteRedForeground1,
    margin: '0 0.75rem 0.4rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    margin: '0 0.75rem 0.5rem',
  },
  listItem: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.4rem 0.5rem',
    fontSize: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    '& strong': {
      color: tokens.colorNeutralForeground1,
      fontSize: '0.82rem',
    },
    '& span': {
      color: tokens.colorNeutralForeground3,
      fontSize: '0.75rem',
    },
  },
  deleteBtn: {
    alignSelf: 'flex-start',
    padding: '0.15rem 0.5rem',
    border: '1px solid var(--status-danger-border)',
    borderRadius: tokens.borderRadiusSmall,
    background: 'none',
    color: tokens.colorPaletteRedForeground1,
    cursor: 'pointer',
    fontSize: '0.72rem',
    '&:hover': {
      background: tokens.colorPaletteRedBackground1,
    },
  },
  saveArea: {
    margin: '0 0.75rem 0.6rem',
  },
  inlineForm: {
    display: 'flex',
    gap: '0.3rem',
    marginTop: '0.25rem',
  },
  inlineInput: {
    flex: '1',
    padding: '0.25rem 0.4rem',
    fontSize: '0.8rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    '&:focus': {
      outline: 'none',
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
    '&:disabled': {
      opacity: '0.5',
    },
  },
  btnAdd: {
    padding: '0.25rem 0.6rem',
    fontSize: '0.8rem',
    border: `1px solid ${tokens.colorBrandForeground1}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorBrandForeground1,
    color: '#fff',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
})

interface Props {
  projectId: string
  currentPlacements?: Placement[]
}

export function MacrosPanel({
projectId, currentPlacements = [] }: Props) {
  const styles = useStyles();

  const [macros, setMacros] = useState<Macro[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [newMacroName, setNewMacroName] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    macrosApi.list(projectId)
      .then(setMacros)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [projectId, open])

  async function handleSaveMacro(e: FormEvent) {
    e.preventDefault()
    if (!newMacroName.trim() || currentPlacements.length === 0) return
    setError(null)
    try {
      const macro = await macrosApi.create(projectId, {
        name: newMacroName.trim(),
        placements: currentPlacements as Macro['placements'],
      })
      setMacros((prev) => [...prev, macro])
      setNewMacroName('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    }
  }

  async function handleDelete(macroId: string) {
    if (!confirm('Makro wirklich löschen?')) return
    setError(null)
    try {
      await macrosApi.delete(projectId, macroId)
      setMacros((prev) => prev.filter((m) => m.id !== macroId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen')
    }
  }

  return (
    <div className={styles.section}>
      <button type="button" className={styles.collapseHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.sectionTitle}>Makros (Sprint 35)</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          {error && <p className={styles.error}>{error}</p>}
          {loading ? (
            <p className={styles.muted}>Lade…</p>
          ) : macros.length === 0 ? (
            <p className={styles.muted}>Keine Makros vorhanden</p>
          ) : (
            <div className={styles.list}>
              {macros.map((macro) => (
                <div key={macro.id} className={styles.listItem}>
                  <strong>{macro.name}</strong>
                  <span>{macro.placements.length} Platzierungen</span>
                  {macro.created_at && (
                    <span>{new Date(macro.created_at).toLocaleDateString('de-DE')}</span>
                  )}
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => void handleDelete(macro.id)}
                  >
                    Löschen
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.saveArea}>
            <p className={styles.hint}>
              Aktuelle Platzierungen ({currentPlacements.length}) als Makro speichern:
            </p>
            <form onSubmit={(e) => void handleSaveMacro(e)} className={styles.inlineForm}>
              <input
                type="text"
                placeholder="Makro-Name…"
                value={newMacroName}
                onChange={(e) => setNewMacroName(e.target.value)}
                className={styles.inlineInput}
                disabled={currentPlacements.length === 0}
              />
              <button
                type="submit"
                className={styles.btnAdd}
                disabled={!newMacroName.trim() || currentPlacements.length === 0}
              >
                Speichern
              </button>
            </form>
            {currentPlacements.length === 0 && (
              <p className={styles.hint}>Zuerst Elemente in diesem Raum platzieren.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

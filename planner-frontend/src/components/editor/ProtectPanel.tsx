import { useState } from 'react'
import {
  validateV2Api,
  categoryFromKey,
  type ValidateV2Result,
  type ValidateV2Violation,
  type RuleCategory,
  type RuleSeverity,
} from '../../api/validateV2.js'
import type { Placement } from '../../api/placements.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '0.75rem',
  },
  title: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: '0 0 0.5rem',
  },
  tenantInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.3rem 0.5rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
    fontFamily: 'monospace',
    background: tokens.colorNeutralBackground1,
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  btnRow: {
    display: 'flex',
    gap: '0.4rem',
    marginBottom: '0.5rem',
  },
  runBtn: {
    flex: '1',
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    border: 'none',
    borderRadius: tokens.borderRadiusCircular,
    padding: '0.35rem 0.5rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    boxShadow: tokens.shadow4,
    '&:hover': {
      background: tokens.colorBrandBackground2Hover,
    },
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  finalBtn: {
    background: 'none',
    border: `1px solid ${tokens.colorBrandForeground1}`,
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusCircular,
    padding: '0.35rem 0.6rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': {
      background: tokens.colorBrandBackground2,
    },
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  finalOk: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: '0.8rem',
    margin: '0 0 0.5rem',
    fontWeight: '600',
  },
  finalFail: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.8rem',
    margin: '0 0 0.5rem',
    fontWeight: '600',
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.8rem',
    margin: '0 0 0.5rem',
    background: tokens.colorPaletteRedBackground1,
    border: '1px solid var(--status-danger-border)',
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.3rem 0.5rem',
  },
  summary: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  sumError: {
    color: tokens.colorPaletteRedForeground1,
  },
  sumWarn: {
    color: 'var(--status-warning-text)',
  },
  sumHint: {
    color: tokens.colorNeutralForeground3,
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    marginBottom: '0.5rem',
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
  },
  chip: {
    background: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusCircular,
    padding: '0.15rem 0.5rem',
    fontSize: '0.7rem',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.4',
    '&:hover': {
      background: tokens.colorNeutralStroke1,
    },
  },
  chipActive: {
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    border: `1px solid ${tokens.colorBrandForeground1}`,
    '&:hover': {
      background: tokens.colorBrandBackground2Hover,
    },
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    fontSize: '0.8rem',
    textAlign: 'center',
    padding: '0.5rem 0',
  },
  list: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    maxHeight: '260px',
    overflowY: 'auto',
  },
  item: {
    borderLeft: `3px solid ${tokens.colorNeutralStroke2}`,
    padding: '0.3rem 0.5rem',
    borderRadius: `0 ${tokens.borderRadiusSmall} ${tokens.borderRadiusSmall} 0`,
    background: tokens.colorNeutralBackground2,
  },
  itemError: {
    borderLeftColor: tokens.colorPaletteRedForeground1,
    background: tokens.colorPaletteRedBackground1,
  },
  itemWarning: {
    borderLeftColor: 'var(--status-warning)',
    background: 'var(--status-warning-bg)',
  },
  itemHint: {
    borderLeftColor: tokens.colorNeutralForeground3,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.15rem',
  },
  ruleKey: {
    fontFamily: 'monospace',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
  },
  sevLabel: {
    fontSize: '0.65rem',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  itemMsg: {
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground1,
    margin: '0',
    lineHeight: '1.4',
  },
  itemHintText: {
    fontSize: '0.7rem',
    color: tokens.colorNeutralForeground3,
    margin: '0.1rem 0 0',
    fontStyle: 'italic',
  },
})

type CategoryFilter = 'all' | RuleCategory
type SeverityFilter = 'all' | RuleSeverity

const CATEGORY_LABELS: Record<RuleCategory, string> = {
  collision: 'Kollision',
  clearance: 'Abstand',
  ergonomics: 'Ergonomie',
  completeness: 'Vollständigkeit',
  accessory: 'Zubehör',
}

const SEVERITY_LABELS: Record<RuleSeverity, string> = {
  error: 'Fehler',
  warning: 'Warnung',
  hint: 'Hinweis',
}

interface Props {
  projectId: string
  roomId: string | null
  placements: Placement[]
  ceilingHeightMm: number
}

export function ProtectPanel({
projectId, roomId, placements, ceilingHeightMm }: Props) {
  const styles = useStyles();

  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ValidateV2Result | null>(null)
  const [finalResult, setFinalResult] = useState<'ok' | 'fail' | null>(null)
  const [finalLoading, setFinalLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')

  async function runCheck() {
    if (!tenantId.trim()) { setError('Tenant-ID fehlt.'); return }
    if (!roomId) { setError('Kein Raum ausgewählt.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await validateV2Api.run(projectId, tenantId.trim(), {
        room_id: roomId,
        placements: placements.map(p => ({
          id: p.id,
          wall_id: p.wall_id,
          offset_mm: p.offset_mm,
          width_mm: p.width_mm,
          depth_mm: p.depth_mm,
          height_mm: p.height_mm,
          type: 'base' as const,
        })),
        ceiling_height_mm: ceilingHeightMm,
      })
      setResult(res)
      setFinalResult(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Prüfung fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  async function runFinal() {
    if (!tenantId.trim()) { setError('Tenant-ID fehlt.'); return }
    setFinalLoading(true)
    setError(null)
    try {
      const history = await validateV2Api.history(projectId, tenantId.trim())
      const last = history[0]
      setFinalResult(!last || last.summary_json.errors > 0 ? 'fail' : 'ok')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Finalprüfung fehlgeschlagen.')
    } finally {
      setFinalLoading(false)
    }
  }

  const filtered: ValidateV2Violation[] = result
    ? result.violations.filter(v => {
        if (severityFilter !== 'all' && v.severity !== severityFilter) return false
        if (categoryFilter !== 'all' && categoryFromKey(v.rule_key) !== categoryFilter) return false
        return true
      })
    : []

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Protect-Prüfung</h3>

      <input
        type="text"
        className={styles.tenantInput}
        placeholder="Tenant-ID"
        value={tenantId}
        onChange={e => setTenantId(e.target.value)}
      />

      <div className={styles.btnRow}>
        <button
          type="button"
          className={styles.runBtn}
          onClick={() => { void runCheck() }}
          disabled={loading || !roomId}
        >
          {loading ? 'Prüfe…' : 'Jetzt prüfen'}
        </button>
        <button
          type="button"
          className={styles.finalBtn}
          onClick={() => { void runFinal() }}
          disabled={finalLoading}
        >
          {finalLoading ? '…' : 'Finalprüfung'}
        </button>
      </div>

      {finalResult && (
        <p className={finalResult === 'ok' ? styles.finalOk : styles.finalFail}>
          {finalResult === 'ok' ? '✓ Letzte Prüfung: keine Fehler' : '✗ Letzte Prüfung: Fehler vorhanden'}
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <>
          <div className={styles.summary}>
            <span className={styles.sumError}>{result.summary.errors} Fehler</span>
            <span className={styles.sumWarn}>{result.summary.warnings} Warn.</span>
            <span className={styles.sumHint}>{result.summary.hints} Hinw.</span>
          </div>

          <div className={styles.filters}>
            <div className={styles.filterRow}>
              {(['all', 'collision', 'clearance', 'ergonomics', 'completeness', 'accessory'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.chip} ${categoryFilter === cat ? styles.chipActive : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? 'Alle' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <div className={styles.filterRow}>
              {(['all', 'error', 'warning', 'hint'] as const).map(sev => (
                <button
                  key={sev}
                  type="button"
                  className={`${styles.chip} ${severityFilter === sev ? styles.chipActive : ''}`}
                  onClick={() => setSeverityFilter(sev)}
                >
                  {sev === 'all' ? 'Alle' : SEVERITY_LABELS[sev]}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className={styles.empty}>Keine Einträge für diesen Filter.</p>
          ) : (
            <ul className={styles.list}>
              {filtered.map(v => (
                <li
                  key={v.id}
                  className={`${styles.item} ${v.severity === 'error' ? styles.itemError : v.severity === 'warning' ? styles.itemWarning : styles.itemHint}`}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.ruleKey}>{v.rule_key}</span>
                    <span className={styles.sevLabel}>{SEVERITY_LABELS[v.severity]}</span>
                  </div>
                  <p className={styles.itemMsg}>{v.message}</p>
                  {v.hint && <p className={styles.itemHintText}>→ {v.hint}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import {
  type ValidateProjectPayload,
  type ValidateProjectResponse,
  type ValidationObject,
  validateProject,
} from '../../api/validation.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    background: tokens.colorNeutralBackground1,
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    boxShadow: tokens.shadow8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  title: {
    margin: '0',
    fontSize: '0.95rem',
    color: tokens.colorNeutralForeground1,
  },
  trigger: {
    border: `1px solid ${tokens.colorBrandForeground1}`,
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    borderRadius: tokens.borderRadiusCircular,
    padding: '0.35rem 0.65rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
    boxShadow: tokens.shadow4,
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
  meta: {
    margin: '0',
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
  },
  group: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '0.55rem',
    background: tokens.colorNeutralBackground2,
  },
  groupTitle: {
    margin: '0 0 0.35rem 0',
    fontSize: '0.82rem',
    color: tokens.colorNeutralForeground1,
  },
  list: {
    margin: '0',
    paddingLeft: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    '& li': {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.1rem',
      fontSize: '0.8rem',
    },
  },
  itemError: {
    '& strong': {
      color: tokens.colorPaletteRedForeground1,
    },
  },
  itemWarning: {
    '& strong': {
      color: 'var(--status-warning-text)',
    },
  },
  itemHint: {
    '& strong': {
      color: tokens.colorPaletteBlueForeground2,
    },
  },
  emptyState: {
    margin: '0',
    color: tokens.colorNeutralForeground3,
    fontSize: '0.8rem',
  },
  errorState: {
    margin: '0',
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.82rem',
  },
  validState: {
    margin: '0',
    color: tokens.colorPaletteGreenForeground1,
    fontSize: '0.82rem',
  },
  invalidState: {
    margin: '0',
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.82rem',
  },
})

interface Props {
  projectId: string
  payload: ValidateProjectPayload
}

function listKey(item: { code: string; message: string; affected_ids: string[] }, index: number): string {
  return `${item.code}-${item.affected_ids.join(',')}-${index}`
}

function objectsSummary(objects: ValidationObject[]): string {
  if (objects.length === 0) {
    return 'Keine Objekte im Payload'
  }

  return `${objects.length} Objekt${objects.length === 1 ? '' : 'e'} im Payload`
}

export function ValidationPanel({
projectId, payload }: Props) {
  const styles = useStyles();

  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ValidateProjectResponse | null>(null)

  const summary = useMemo(() => objectsSummary(payload.objects), [payload.objects])
  const hasResult = result !== null

  async function runValidation() {
    setRunning(true)
    setError(null)

    try {
      const next = await validateProject(projectId, payload)
      setResult(next)
    } catch (caughtError: unknown) {
      setResult(null)
      setError(caughtError instanceof Error ? caughtError.message : 'Validierung konnte nicht ausgeführt werden.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>Validierung</h3>
        <button
          type="button"
          className={styles.trigger}
          onClick={() => { void runValidation() }}
          disabled={running}
        >
          {running ? 'Prüfe…' : 'Validierung starten'}
        </button>
      </header>

      <p className={styles.meta}>{summary}</p>

      {error && <p className={styles.errorState}>{error}</p>}

      {!error && !hasResult && (
        <p className={styles.emptyState}>Noch keine Validierung ausgeführt.</p>
      )}

      {!error && hasResult && (
        <>
          <p className={result.valid ? styles.validState : styles.invalidState}>
            {result.valid ? 'Validierung erfolgreich: keine blockierenden Fehler.' : 'Validierung meldet Probleme.'}
          </p>

          <div className={styles.group}>
            <h4 className={styles.groupTitle}>Fehler ({result.errors.length})</h4>
            {result.errors.length === 0 ? (
              <p className={styles.emptyState}>Keine Fehler.</p>
            ) : (
              <ul className={styles.list}>
                {result.errors.map((entry, index) => (
                  <li key={listKey(entry, index)} className={styles.itemError}>
                    <strong>{entry.code}</strong>
                    <span>{entry.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.group}>
            <h4 className={styles.groupTitle}>Warnungen ({result.warnings.length})</h4>
            {result.warnings.length === 0 ? (
              <p className={styles.emptyState}>Keine Warnungen.</p>
            ) : (
              <ul className={styles.list}>
                {result.warnings.map((entry, index) => (
                  <li key={listKey(entry, index)} className={styles.itemWarning}>
                    <strong>{entry.code}</strong>
                    <span>{entry.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.group}>
            <h4 className={styles.groupTitle}>Hinweise ({result.hints.length})</h4>
            {result.hints.length === 0 ? (
              <p className={styles.emptyState}>Keine Hinweise.</p>
            ) : (
              <ul className={styles.list}>
                {result.hints.map((entry, index) => (
                  <li key={listKey(entry, index)} className={styles.itemHint}>
                    <strong>{entry.code}</strong>
                    <span>{entry.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}

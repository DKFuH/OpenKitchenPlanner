import { useEffect, useState } from 'react'
import {
  createQuote,
  exportQuotePdf,
  getQuote,
  type CreateQuotePayload,
  type Quote,
} from '../../api/quotes.js'
import { useLocale } from '../../hooks/useLocale.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    background: tokens.colorNeutralBackground1,
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    boxShadow: tokens.shadow8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    margin: '0',
    fontSize: '0.95rem',
    color: tokens.colorNeutralForeground1,
  },
  actions: {
    display: 'flex',
    gap: '0.45rem',
    flexWrap: 'wrap',
  },
  localeField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    color: tokens.colorNeutralForeground3,
    fontSize: '0.78rem',
    '& select': {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      borderRadius: tokens.borderRadiusCircular,
      background: tokens.colorNeutralBackground1,
      color: tokens.colorNeutralForeground1,
      fontSize: '0.82rem',
      padding: '0.35rem 0.7rem',
    },
  },
  primaryBtn: {
    borderRadius: tokens.borderRadiusCircular,
    fontSize: '0.82rem',
    padding: '0.35rem 0.7rem',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorBrandForeground1}`,
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    boxShadow: tokens.shadow4,
    '&:hover': {
      background: tokens.colorBrandBackground2Hover,
    },
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
  secondaryBtn: {
    borderRadius: tokens.borderRadiusCircular,
    fontSize: '0.82rem',
    padding: '0.35rem 0.7rem',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    '&:hover': {
      background: tokens.colorNeutralBackground2,
    },
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
  refreshBtn: {
    borderRadius: tokens.borderRadiusCircular,
    fontSize: '0.82rem',
    padding: '0.35rem 0.7rem',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    '&:hover': {
      background: tokens.colorNeutralBackground2,
    },
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
  metaList: {
    margin: '0',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '0.25rem 0.55rem',
    fontSize: '0.82rem',
    '& dt': {
      color: tokens.colorNeutralForeground3,
      fontWeight: '600',
    },
    '& dd': {
      margin: '0',
      color: tokens.colorNeutralForeground1,
    },
  },
  empty: {
    margin: '0',
    color: tokens.colorNeutralForeground3,
    fontSize: '0.82rem',
  },
  error: {
    margin: '0',
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.82rem',
  },
})

interface Props {
  projectId: string
  createPayload?: CreateQuotePayload
  buildCreatePayload?: () => Promise<CreateQuotePayload>
}

export function QuoteExportPanel({
projectId, createPayload = {}, buildCreatePayload }: Props) {
  const styles = useStyles();

  const { formatDate, locale } = useLocale()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [exportLocale, setExportLocale] = useState<'de' | 'en'>('de')
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [loadingExport, setLoadingExport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setExportLocale(locale.startsWith('en') ? 'en' : 'de')
  }, [locale])

  async function handleCreateQuote() {
    setLoadingCreate(true)
    setError(null)

    try {
      const payload = buildCreatePayload ? await buildCreatePayload() : createPayload
      const created = await createQuote(projectId, payload)
      setQuote(created)
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Angebot konnte nicht erzeugt werden.')
    } finally {
      setLoadingCreate(false)
    }
  }

  async function handleReloadQuote() {
    if (!quote) {
      return
    }

    setLoadingQuote(true)
    setError(null)

    try {
      const refreshed = await getQuote(quote.id)
      setQuote(refreshed)
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Angebot konnte nicht geladen werden.')
    } finally {
      setLoadingQuote(false)
    }
  }

  async function handleExportPdf() {
    if (!quote) {
      return
    }

    setLoadingExport(true)
    setError(null)

    try {
      await exportQuotePdf(quote.id, exportLocale)
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'PDF-Export fehlgeschlagen.')
    } finally {
      setLoadingExport(false)
    }
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>Angebot & Export</h3>
      </header>

      <div className={styles.actions}>
        <label className={styles.localeField}>
          <span>Sprache</span>
          <select
            value={exportLocale}
            onChange={(event) => setExportLocale(event.target.value === 'en' ? 'en' : 'de')}
            disabled={loadingCreate || loadingQuote || loadingExport}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </label>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => { void handleCreateQuote() }}
          disabled={loadingCreate || loadingQuote || loadingExport}
        >
          {loadingCreate ? 'Erzeuge…' : 'Angebot erzeugen'}
        </button>

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => { void handleExportPdf() }}
          disabled={!quote || loadingCreate || loadingQuote || loadingExport}
        >
          {loadingExport ? 'Exportiere…' : 'PDF exportieren'}
        </button>
      </div>

      {quote && (
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => { void handleReloadQuote() }}
          disabled={loadingCreate || loadingQuote || loadingExport}
        >
          {loadingQuote ? 'Lade…' : 'Angebot aktualisieren'}
        </button>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {!quote ? (
        <p className={styles.empty}>Noch kein Angebot erzeugt.</p>
      ) : (
        <dl className={styles.metaList}>
          <dt>Angebotsnummer</dt>
          <dd>{quote.quote_number}</dd>

          <dt>Version</dt>
          <dd>{quote.version}</dd>

          <dt>Gültig bis</dt>
          <dd>{quote.valid_until ? formatDate(new Date(quote.valid_until)) : '–'}</dd>
        </dl>
      )}
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import type { Placement } from '../api/placements.js'
import { kitchenAssistantApi, type CatalogMacro, type LayoutSuggestion } from '../api/kitchenAssistant.js'
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
  row: {
    display: 'flex',
    gap: '0.35rem',
    marginBottom: '0.4rem',
  },
  select: {
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    padding: '0.35rem 0.45rem',
    fontSize: '0.8rem',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    padding: '0.35rem 0.45rem',
    fontSize: '0.8rem',
  },
  button: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    padding: '0.3rem 0.45rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
  list: {
    margin: '0',
    padding: '0',
    listStyle: 'none',
    display: 'grid',
    gap: '0.35rem',
  },
  item: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.35rem',
    fontSize: '0.75rem',
  },
  itemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.35rem',
  },
  name: {
    margin: '0',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  meta: {
    margin: '0',
    color: tokens.colorNeutralForeground3,
    fontSize: '0.7rem',
  },
  inline: {
    display: 'flex',
    gap: '0.3rem',
    flexWrap: 'wrap',
  },
  hint: {
    margin: '0.3rem 0 0',
    color: tokens.colorNeutralForeground3,
    fontSize: '0.72rem',
  },
  error: {
    margin: '0.3rem 0 0',
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.72rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.3rem',
    marginBottom: '0.5rem',
  },
  tab: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
    padding: '0.25rem 0.45rem',
    fontSize: '0.72rem',
    cursor: 'pointer',
  },
  tabActive: {
    border: `1px solid ${tokens.colorBrandForeground1}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    padding: '0.25rem 0.45rem',
    fontSize: '0.72rem',
    cursor: 'pointer',
  },
})

interface Props {
  roomId: string | null
  placements: Placement[]
}

type AssistantTab = 'catalog' | 'assistant'

export function KitchenAssistantPanel({
roomId, placements }: Props) {
  const styles = useStyles();

  const [tab, setTab] = useState<AssistantTab>('catalog')
  const [collections, setCollections] = useState<string[]>([])
  const [families, setFamilies] = useState<string[]>([])
  const [styleTags, setStyleTags] = useState<string[]>([])
  const [collection, setCollection] = useState('')
  const [family, setFamily] = useState('')
  const [styleTag, setStyleTag] = useState('')
  const [query, setQuery] = useState('')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [articles, setArticles] = useState<Array<{ id: string; sku: string; name: string; is_favorite?: boolean }>>([])
  const [macros, setMacros] = useState<CatalogMacro[]>([])
  const [suggestions, setSuggestions] = useState<LayoutSuggestion[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    kitchenAssistantApi.getHierarchy()
      .then((response) => {
        setCollections(response.collections)
        setFamilies(response.families)
        setStyleTags(response.style_tags)
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Hierarchie konnte nicht geladen werden')
      })

    kitchenAssistantApi.listMacros()
      .then(setMacros)
      .catch(() => {
        setMacros([])
      })
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      kitchenAssistantApi.searchArticles({
        collection: collection || undefined,
        family: family || undefined,
        style_tag: styleTag || undefined,
        search: query || undefined,
        only_favorites: onlyFavorites || undefined,
        limit: 50,
      })
        .then((result) => {
          setArticles(result.articles.map((entry) => ({
            id: entry.id,
            sku: entry.sku,
            name: entry.name,
            is_favorite: entry.is_favorite,
          })))
        })
        .catch(() => {
          setArticles([])
        })
    }, 150)

    return () => window.clearTimeout(timer)
  }, [collection, family, styleTag, query, onlyFavorites])

  const familyOptions = useMemo(() => families, [families])

  async function toggleFavorite(articleId: string, favorite: boolean) {
    await kitchenAssistantApi.toggleFavorite(articleId, favorite)
    setArticles((prev) => prev.map((entry) => (
      entry.id === articleId ? { ...entry, is_favorite: favorite } : entry
    )))
  }

  async function saveMacroFromSelection() {
    const converted = placements
      .filter((placement) => placement.width_mm > 0 && placement.depth_mm > 0 && placement.height_mm > 0)
      .map((placement) => ({
        wall_id: placement.wall_id,
        offset_mm: placement.offset_mm,
        article_id: placement.catalog_article_id ?? placement.catalog_item_id,
        width_mm: placement.width_mm,
        depth_mm: placement.depth_mm,
        height_mm: placement.height_mm,
      }))

    if (converted.length === 0) {
      setError('Keine gültige Selektion für Makro vorhanden')
      return
    }

    const macro = await kitchenAssistantApi.createMacro({
      name: `Makro ${new Date().toLocaleTimeString()}`,
      positions: converted,
      created_by: 'editor-user',
    })

    setMacros((prev) => [...prev, macro].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function runSuggestLayouts() {
    if (!roomId) return
    setBusy(true)
    setError(null)
    try {
      const response = await kitchenAssistantApi.suggestLayouts(roomId)
      setSuggestions(response.suggestions)
      if (response.message) {
        setError(response.message)
      }
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Layout-Vorschläge fehlgeschlagen')
      setSuggestions([])
    } finally {
      setBusy(false)
    }
  }

  async function applySuggestion(suggestionId: string) {
    try {
      await kitchenAssistantApi.applyLayout(suggestionId)
      setSuggestions((prev) => prev.map((entry) => (
        entry.id === suggestionId ? { ...entry, applied: true } : entry
      )))
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Vorschlag konnte nicht übernommen werden')
    }
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>Assistent</h3>

      <div className={styles.tabs}>
        <button type="button" className={tab === 'catalog' ? styles.tabActive : styles.tab} onClick={() => setTab('catalog')}>Katalog</button>
        <button type="button" className={tab === 'assistant' ? styles.tabActive : styles.tab} onClick={() => setTab('assistant')}>Layout</button>
      </div>

      {tab === 'catalog' ? (
        <>
          <div className={styles.row}>
            <select
              aria-label="Kollektion"
              title="Kollektion"
              className={styles.select}
              value={collection}
              onChange={(event) => setCollection(event.target.value)}
            >
              <option value="">Kollektion</option>
              {collections.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
            <select
              aria-label="Familie"
              title="Familie"
              className={styles.select}
              value={family}
              onChange={(event) => setFamily(event.target.value)}
            >
              <option value="">Familie</option>
              {familyOptions.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
          </div>

          <div className={styles.row}>
            <select
              aria-label="Style-Tag"
              title="Style-Tag"
              className={styles.select}
              value={styleTag}
              onChange={(event) => setStyleTag(event.target.value)}
            >
              <option value="">Style-Tag</option>
              {styleTags.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
            <input className={styles.input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suche" />
          </div>

          <div className={styles.inline}>
            <button type="button" className={styles.button} onClick={() => setOnlyFavorites((prev) => !prev)}>
              {onlyFavorites ? '⭐ Favoriten an' : '⭐ Favoriten'}
            </button>
            <button type="button" className={styles.button} onClick={saveMacroFromSelection}>Aus Selektion speichern</button>
          </div>

          <ul className={styles.list}>
            {articles.slice(0, 10).map((article) => (
              <li key={article.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <p className={styles.name}>{article.name}</p>
                  <button type="button" className={styles.button} onClick={() => toggleFavorite(article.id, !article.is_favorite)}>
                    {article.is_favorite ? '❤' : '♡'}
                  </button>
                </div>
                <p className={styles.meta}>{article.sku}</p>
              </li>
            ))}
          </ul>

          <p className={styles.hint}>Makros: {macros.length}</p>
        </>
      ) : (
        <>
          <div className={styles.inline}>
            <button type="button" className={styles.button} onClick={runSuggestLayouts} disabled={!roomId || busy}>Layout vorschlagen</button>
          </div>

          <ul className={styles.list}>
            {suggestions.map((entry) => (
              <li key={entry.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <p className={styles.name}>{entry.layout_type}</p>
                  <p className={styles.meta}>Score: {(entry.score * 100).toFixed(0)}%</p>
                </div>
                <div className={styles.inline}>
                  <button
                    type="button"
                    className={styles.button}
                    disabled={entry.applied}
                    onClick={() => applySuggestion(entry.id)}
                  >
                    {entry.applied ? 'Übernommen' : 'Übernehmen'}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className={styles.hint}>Nach Übernahme ggf. Raum neu laden, um neue Platzierungen zu sehen.</p>
        </>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </section>
  )
}

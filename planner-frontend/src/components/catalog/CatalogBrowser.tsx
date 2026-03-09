import { useEffect, useMemo, useState } from 'react'
import {
  CATALOG_TYPE_LABELS,
  catalogApi,
  type CatalogItem,
  type CatalogItemType,
} from '../../api/catalog.js'
import { useLocale } from '../../hooks/useLocale.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    background: tokens.colorNeutralBackground1,
    padding: '0.75rem',
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
  filters: {
    display: 'grid',
    gridTemplateColumns: '1fr 180px',
    gap: '0.5rem',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  searchInput: {
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.85rem',
    padding: '0.45rem 0.55rem',
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  typeSelect: {
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.85rem',
    padding: '0.45rem 0.55rem',
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '0.75rem',
    minHeight: '280px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  listWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '0.6rem',
    background: tokens.colorNeutralBackground2,
  },
  details: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '0.6rem',
    background: tokens.colorNeutralBackground2,
  },
  list: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    maxHeight: '340px',
    overflow: 'auto',
  },
  itemBtn: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.2rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackground1,
    padding: '0.5rem',
    textAlign: 'left',
    cursor: 'pointer',
  },
  itemBtnActive: {
    boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
    border: `1px solid ${tokens.colorBrandForeground1}`,
  },
  itemName: {
    color: tokens.colorNeutralForeground1,
    fontSize: '0.86rem',
    fontWeight: '600',
  },
  itemMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: '0.78rem',
  },
  itemPrice: {
    color: tokens.colorNeutralForeground1,
    fontSize: '0.8rem',
  },
  detailTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.85rem',
    color: tokens.colorNeutralForeground1,
  },
  detailGrid: {
    margin: '0',
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, auto) 1fr',
    gap: '0.3rem 0.5rem',
    fontSize: '0.8rem',
    '& dt': {
      color: tokens.colorNeutralForeground3,
      fontWeight: '600',
    },
    '& dd': {
      margin: '0',
      color: tokens.colorNeutralForeground1,
      wordBreak: 'break-word',
    },
  },
  muted: {
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
  initialType?: CatalogItemType | ''
  initialQuery?: string
  pageSize?: number
}

const TYPE_OPTIONS: Array<{ value: CatalogItemType | ''; label: string }> = [
  { value: '', label: 'Alle Typen' },
  { value: 'base_cabinet', label: CATALOG_TYPE_LABELS.base_cabinet },
  { value: 'wall_cabinet', label: CATALOG_TYPE_LABELS.wall_cabinet },
  { value: 'tall_cabinet', label: CATALOG_TYPE_LABELS.tall_cabinet },
  { value: 'trim', label: CATALOG_TYPE_LABELS.trim },
  { value: 'worktop', label: CATALOG_TYPE_LABELS.worktop },
  { value: 'appliance', label: CATALOG_TYPE_LABELS.appliance },
  { value: 'accessory', label: CATALOG_TYPE_LABELS.accessory },
]

function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function CatalogBrowser({
initialType = '', initialQuery = '', pageSize = 50 }: Props) {
  const styles = useStyles();

  const [typeFilter, setTypeFilter] = useState<CatalogItemType | ''>(initialType)
  const [query, setQuery] = useState(initialQuery)
  const { locale } = useLocale()

  const [items, setItems] = useState<CatalogItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const normalizedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    let canceled = false

    const timer = window.setTimeout(() => {
      setListLoading(true)
      setListError(null)

      void catalogApi
        .list({
          type: typeFilter || undefined,
          q: normalizedQuery || undefined,
          limit: pageSize,
          offset: 0,
        })
        .then((result) => {
          if (canceled) {
            return
          }
          setItems(result)

          if (selectedId && !result.some((item) => item.id === selectedId)) {
            setSelectedId(null)
            setSelectedItem(null)
            setDetailError(null)
          }
        })
        .catch((error: unknown) => {
          if (canceled) {
            return
          }
          setItems([])
          setListError(error instanceof Error ? error.message : 'Katalogliste konnte nicht geladen werden.')
        })
        .finally(() => {
          if (canceled) {
            return
          }
          setListLoading(false)
        })
    }, 250)

    return () => {
      canceled = true
      window.clearTimeout(timer)
    }
  }, [typeFilter, normalizedQuery, pageSize, selectedId])

  async function handleSelectItem(id: string) {
    setSelectedId(id)
    setDetailLoading(true)
    setDetailError(null)

    try {
      const item = await catalogApi.getById(id)
      setSelectedItem(item)
    } catch (error: unknown) {
      setSelectedItem(null)
      setDetailError(error instanceof Error ? error.message : 'Detaildaten konnten nicht geladen werden.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>Katalog-Browser</h3>
      </header>

      <div className={styles.filters}>
        <input
          type="search"
          className={styles.searchInput}
          aria-label="Katalog durchsuchen"
          placeholder="Suche nach Name oder SKU"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select
          className={styles.typeSelect}
          aria-label="Katalogtyp filtern"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as CatalogItemType | '')}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {listError && <p className={styles.error}>{listError}</p>}

      <div className={styles.content}>
        <div className={styles.listWrap}>
          {listLoading ? (
            <p className={styles.muted}>Lade Katalog…</p>
          ) : items.length === 0 ? (
            <p className={styles.muted}>Keine Treffer.</p>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.itemBtn} ${selectedId === item.id ? styles.itemBtnActive : ''}`}
                    onClick={() => { void handleSelectItem(item.id) }}
                  >
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemMeta}>{item.sku} · {CATALOG_TYPE_LABELS[item.type]}</span>
                    <span className={styles.itemPrice}>{formatPrice(item.list_price_net, locale)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className={styles.details}>
          <h4 className={styles.detailTitle}>Details</h4>

          {detailLoading && <p className={styles.muted}>Lade Detail…</p>}
          {detailError && <p className={styles.error}>{detailError}</p>}

          {!detailLoading && !detailError && !selectedItem && (
            <p className={styles.muted}>Element auswählen, um Details zu sehen.</p>
          )}

          {!detailLoading && !detailError && selectedItem && (
            <dl className={styles.detailGrid}>
              <dt>ID</dt>
              <dd>{selectedItem.id}</dd>

              <dt>Name</dt>
              <dd>{selectedItem.name}</dd>

              <dt>SKU</dt>
              <dd>{selectedItem.sku}</dd>

              <dt>Typ</dt>
              <dd>{CATALOG_TYPE_LABELS[selectedItem.type]}</dd>

              <dt>Maße</dt>
              <dd>{selectedItem.width_mm} × {selectedItem.depth_mm} × {selectedItem.height_mm} mm</dd>

              <dt>Listenpreis (netto)</dt>
              <dd>{formatPrice(selectedItem.list_price_net, locale)}</dd>
            </dl>
          )}
        </aside>
      </div>
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  materialLibraryApi,
  type LibraryFolder,
  type LibrarySavedFilter,
  type LibrarySort,
  type MaterialCreatePayload,
  type MaterialPatchPayload,
} from '../../api/materialLibrary.js'
import {
  MATERIAL_CATEGORY_LABELS,
  type MaterialCategory,
  type MaterialLibraryItem,
} from '../../plugins/materials/index.js'
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
  subTitle: {
    margin: '0',
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: tokens.colorNeutralForeground3,
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.5rem',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  savedFilterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
    alignItems: 'center',
  },
  createForm: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '0.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    background: tokens.colorNeutralBackground2,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.5rem',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  field: {
    display: 'grid',
    gap: '0.25rem',
    fontSize: '0.78rem',
    color: tokens.colorNeutralForeground3,
  },
  checkField: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.78rem',
    color: tokens.colorNeutralForeground3,
  },
  input: {
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.83rem',
    padding: '0.45rem 0.55rem',
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  select: {
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.83rem',
    padding: '0.45rem 0.55rem',
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  actions: {
    display: 'flex',
    gap: '0.45rem',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    border: `1px solid ${tokens.colorBrandForeground1}`,
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.38rem 0.65rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.65',
      cursor: 'not-allowed',
    },
  },
  dangerBtn: {
    border: '1px solid var(--status-danger-border)',
    background: tokens.colorNeutralBackground1,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.38rem 0.65rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.65',
      cursor: 'not-allowed',
    },
  },
  secondaryBtn: {
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.36rem 0.58rem',
    fontSize: '0.78rem',
    cursor: 'pointer',
    '&:hover': {
      color: tokens.colorBrandForeground1,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  listWrap: {
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
    gap: '0.5rem',
    maxHeight: '460px',
    overflow: 'auto',
  },
  item: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackground1,
    padding: '0.55rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
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

type CategoryFilter = '' | MaterialCategory

const SORT_OPTIONS: Array<{ value: LibrarySort; label: string }> = [
  { value: 'updated', label: 'Zuletzt aktualisiert' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'favorites', label: 'Favoriten zuerst' },
]

const MATERIAL_CATEGORY_VALUES: MaterialCategory[] = ['floor', 'wall', 'front', 'worktop', 'custom']

const MATERIAL_SORT_VALUES: LibrarySort[] = ['updated', 'name', 'favorites']

interface MaterialFormState {
  name: string
  category: MaterialCategory
  favorite: boolean
  folder_id: string
  collection: string
  texture_url: string
  preview_url: string
  scale_x_mm: string
  scale_y_mm: string
  rotation_deg: string
  roughness: string
  metallic: string
}

const CATEGORY_OPTIONS: Array<{ value: CategoryFilter; label: string }> = [
  { value: '', label: 'Alle Kategorien' },
  { value: 'floor', label: MATERIAL_CATEGORY_LABELS.floor },
  { value: 'wall', label: MATERIAL_CATEGORY_LABELS.wall },
  { value: 'front', label: MATERIAL_CATEGORY_LABELS.front },
  { value: 'worktop', label: MATERIAL_CATEGORY_LABELS.worktop },
  { value: 'custom', label: MATERIAL_CATEGORY_LABELS.custom },
]

function toFormState(item?: MaterialLibraryItem): MaterialFormState {
  return {
    name: item?.name ?? '',
    category: item?.category ?? 'custom',
    favorite: item?.favorite ?? false,
    folder_id: item?.folder_id ?? '',
    collection: item?.collection ?? '',
    texture_url: item?.texture_url ?? '',
    preview_url: item?.preview_url ?? '',
    scale_x_mm: item?.scale_x_mm != null ? String(item.scale_x_mm) : '',
    scale_y_mm: item?.scale_y_mm != null ? String(item.scale_y_mm) : '',
    rotation_deg: item?.rotation_deg != null ? String(item.rotation_deg) : '0',
    roughness: item?.roughness != null ? String(item.roughness) : '',
    metallic: item?.metallic != null ? String(item.metallic) : '',
  }
}

function parseOptionalPositive(value: string): number | undefined {
  const normalized = value.trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return parsed
}

function parseOptionalRange(value: string, min: number, max: number): number | undefined {
  const normalized = value.trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return undefined
  if (parsed < min || parsed > max) return undefined
  return parsed
}

function parseOptionalRotation(value: string): number | undefined {
  const normalized = value.trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return undefined
  const normalizedDegrees = ((parsed % 360) + 360) % 360
  return normalizedDegrees
}

export function MaterialBrowser() {
  const styles = useStyles();

const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [folderFilter, setFolderFilter] = useState('')
  const [collectionFilter, setCollectionFilter] = useState('')
  const [sortBy, setSortBy] = useState<LibrarySort>('updated')
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [savedFilters, setSavedFilters] = useState<LibrarySavedFilter[]>([])
  const [selectedSavedFilterId, setSelectedSavedFilterId] = useState('')

  const [items, setItems] = useState<MaterialLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const [createForm, setCreateForm] = useState<MaterialFormState>(toFormState())
  const [creating, setCreating] = useState(false)

  const [editForms, setEditForms] = useState<Record<string, MaterialFormState>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const normalizedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    void Promise.all([
      materialLibraryApi.listFolders().then(setFolders),
      materialLibraryApi.listSavedFilters().then(setSavedFilters),
    ]).catch(() => {
      setError('Material-Metadaten konnten nicht geladen werden.')
    })
  }, [])

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(() => {
      setLoading(true)
      setError(null)

      void materialLibraryApi
        .list({
          q: normalizedQuery || undefined,
          category: categoryFilter || undefined,
          favorite_only: favoriteOnly || undefined,
          folder_id: folderFilter || undefined,
          collection: collectionFilter.trim() || undefined,
          sort: sortBy,
        })
        .then((result) => {
          if (!active) return
          setItems(result)
          setEditForms((previous) => {
            const next: Record<string, MaterialFormState> = {}
            for (const item of result) {
              next[item.id] = previous[item.id] ?? toFormState(item)
            }
            return next
          })
        })
        .catch((requestError: unknown) => {
          if (!active) return
          setItems([])
          setError(requestError instanceof Error ? requestError.message : 'Materialliste konnte nicht geladen werden.')
        })
        .finally(() => {
          if (!active) return
          setLoading(false)
        })
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [normalizedQuery, categoryFilter, favoriteOnly, folderFilter, collectionFilter, sortBy, refreshToken])

  function updateCreateForm<K extends keyof MaterialFormState>(key: K, value: MaterialFormState[K]) {
    setCreateForm((previous) => ({ ...previous, [key]: value }))
  }

  function updateEditForm<K extends keyof MaterialFormState>(id: string, key: K, value: MaterialFormState[K]) {
    setEditForms((previous) => ({
      ...previous,
      [id]: {
        ...(previous[id] ?? toFormState(items.find((item) => item.id === id))),
        [key]: value,
      },
    }))
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = createForm.name.trim()
    if (!name) {
      setError('Bitte einen Materialnamen eingeben.')
      return
    }

    const payload: MaterialCreatePayload = {
      name,
      category: createForm.category,
      favorite: createForm.favorite,
      folder_id: createForm.folder_id || null,
      collection: createForm.collection.trim() || null,
    }

    const textureUrl = createForm.texture_url.trim()
    const previewUrl = createForm.preview_url.trim()
    if (textureUrl) payload.texture_url = textureUrl
    if (previewUrl) payload.preview_url = previewUrl

    const scaleX = parseOptionalPositive(createForm.scale_x_mm)
    const scaleY = parseOptionalPositive(createForm.scale_y_mm)
    const rotation = parseOptionalRotation(createForm.rotation_deg)
    const roughness = parseOptionalRange(createForm.roughness, 0, 1)
    const metallic = parseOptionalRange(createForm.metallic, 0, 1)

    if (scaleX !== undefined) payload.scale_x_mm = scaleX
    if (scaleY !== undefined) payload.scale_y_mm = scaleY
    if (rotation !== undefined) payload.rotation_deg = rotation
    if (roughness !== undefined) payload.roughness = roughness
    if (metallic !== undefined) payload.metallic = metallic

    setCreating(true)
    setError(null)

    try {
      await materialLibraryApi.create(payload)
      setCreateForm(toFormState())
      setRefreshToken((value) => value + 1)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Material konnte nicht erstellt werden.')
    } finally {
      setCreating(false)
    }
  }

  async function handleSave(id: string) {
    const form = editForms[id]
    if (!form) return

    const name = form.name.trim()
    if (!name) {
      setError('Materialname darf nicht leer sein.')
      return
    }

    const payload: MaterialPatchPayload = {
      name,
      category: form.category,
      favorite: form.favorite,
      folder_id: form.folder_id || null,
      collection: form.collection.trim() || null,
      texture_url: form.texture_url.trim() || null,
      preview_url: form.preview_url.trim() || null,
    }

    const scaleX = parseOptionalPositive(form.scale_x_mm)
    const scaleY = parseOptionalPositive(form.scale_y_mm)
    const rotation = parseOptionalRotation(form.rotation_deg)
    const roughness = parseOptionalRange(form.roughness, 0, 1)
    const metallic = parseOptionalRange(form.metallic, 0, 1)

    payload.scale_x_mm = scaleX ?? null
    payload.scale_y_mm = scaleY ?? null
    if (rotation !== undefined) payload.rotation_deg = rotation
    payload.roughness = roughness ?? null
    payload.metallic = metallic ?? null

    setSavingId(id)
    setError(null)

    try {
      const updated = await materialLibraryApi.patch(id, payload)
      setItems((previous) => previous.map((item) => (item.id === id ? updated : item)))
      setEditForms((previous) => ({ ...previous, [id]: toFormState(updated) }))
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Material konnte nicht gespeichert werden.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)

    try {
      await materialLibraryApi.remove(id)
      setItems((previous) => previous.filter((item) => item.id !== id))
      setEditForms((previous) => {
        const next = { ...previous }
        delete next[id]
        return next
      })
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Material konnte nicht gelöscht werden.')
    } finally {
      setDeletingId(null)
    }
  }

  function applySavedFilter(filter: LibrarySavedFilter) {
    const data = filter.saved_filter_json
    const nextQuery = typeof data.q === 'string' ? data.q : ''
    const nextCategory = typeof data.category === 'string' && MATERIAL_CATEGORY_VALUES.includes(data.category as MaterialCategory)
      ? (data.category as MaterialCategory)
      : ''
    const nextFavoriteOnly = Boolean(data.favorite_only)
    const nextFolder = typeof data.folder_id === 'string' ? data.folder_id : ''
    const nextCollection = typeof data.collection === 'string' ? data.collection : ''
    const nextSort = typeof data.sort === 'string' && MATERIAL_SORT_VALUES.includes(data.sort as LibrarySort)
      ? (data.sort as LibrarySort)
      : 'updated'

    setQuery(nextQuery)
    setCategoryFilter(nextCategory)
    setFavoriteOnly(nextFavoriteOnly)
    setFolderFilter(nextFolder)
    setCollectionFilter(nextCollection)
    setSortBy(nextSort)
  }

  async function handleCreateFolder() {
    const name = window.prompt('Ordnername')?.trim()
    if (!name) return

    try {
      await materialLibraryApi.createFolder({
        name,
        parent_id: folderFilter || null,
      })
      const nextFolders = await materialLibraryApi.listFolders()
      setFolders(nextFolders)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Ordner konnte nicht erstellt werden.')
    }
  }

  async function handleSaveFilter() {
    const name = window.prompt('Name für den Filter')?.trim()
    if (!name) return

    const saved_filter_json: Record<string, unknown> = {
      favorite_only: favoriteOnly,
      sort: sortBy,
    }
    if (query.trim()) saved_filter_json.q = query.trim()
    if (categoryFilter) saved_filter_json.category = categoryFilter
    if (folderFilter) saved_filter_json.folder_id = folderFilter
    if (collectionFilter.trim()) saved_filter_json.collection = collectionFilter.trim()

    try {
      const created = await materialLibraryApi.createSavedFilter({
        name,
        saved_filter_json,
      })
      setSavedFilters((previous) => [created, ...previous])
      setSelectedSavedFilterId(created.id)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Filter konnte nicht gespeichert werden.')
    }
  }

  async function handleDeleteFilter() {
    if (!selectedSavedFilterId) return
    try {
      await materialLibraryApi.removeSavedFilter(selectedSavedFilterId)
      setSavedFilters((previous) => previous.filter((entry) => entry.id !== selectedSavedFilterId))
      setSelectedSavedFilterId('')
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Filter konnte nicht gelöscht werden.')
    }
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>Material-Browser</h3>
      </header>

      <div className={styles.filters}>
        <input
          type="search"
          className={styles.input}
          placeholder="Material suchen"
          aria-label="Material suchen"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className={styles.select}
          aria-label="Kategorie filtern"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className={styles.checkField}>
          <input
            type="checkbox"
            checked={favoriteOnly}
            onChange={(event) => setFavoriteOnly(event.target.checked)}
          />
          Nur Favoriten
        </label>
        <select
          className={styles.select}
          aria-label="Ordner filtern"
          value={folderFilter}
          onChange={(event) => setFolderFilter(event.target.value)}
        >
          <option value="">Alle Ordner</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>
        <input
          type="search"
          className={styles.input}
          placeholder="Kollektion filtern"
          aria-label="Kollektion filtern"
          value={collectionFilter}
          onChange={(event) => setCollectionFilter(event.target.value)}
        />
        <select
          className={styles.select}
          aria-label="Sortierung"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as LibrarySort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.savedFilterRow}>
        <select
          className={styles.select}
          aria-label="Gespeicherten Filter laden"
          value={selectedSavedFilterId}
          onChange={(event) => {
            const nextId = event.target.value
            setSelectedSavedFilterId(nextId)
            const selected = savedFilters.find((entry) => entry.id === nextId)
            if (selected) {
              applySavedFilter(selected)
            }
          }}
        >
          <option value="">Gespeicherte Filter…</option>
          {savedFilters.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name}</option>
          ))}
        </select>
        <button type="button" className={styles.secondaryBtn} onClick={() => { void handleSaveFilter() }}>
          Filter speichern
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={() => { void handleDeleteFilter() }}>
          Filter löschen
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={() => { void handleCreateFolder() }}>
          Ordner +
        </button>
      </div>

      <form className={styles.createForm} onSubmit={(event) => { void handleCreate(event) }}>
        <h4 className={styles.subTitle}>Neues Material</h4>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Name</span>
            <input
              className={styles.input}
              value={createForm.name}
              onChange={(event) => updateCreateForm('name', event.target.value)}
              placeholder="z. B. Eiche hell"
            />
          </label>
          <label className={styles.field}>
            <span>Kategorie</span>
            <select
              className={styles.select}
              value={createForm.category}
              onChange={(event) => updateCreateForm('category', event.target.value as MaterialCategory)}
            >
              {CATEGORY_OPTIONS.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Ordner</span>
            <select
              className={styles.select}
              value={createForm.folder_id}
              onChange={(event) => updateCreateForm('folder_id', event.target.value)}
            >
              <option value="">Ohne Ordner</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Kollektion</span>
            <input
              className={styles.input}
              value={createForm.collection}
              onChange={(event) => updateCreateForm('collection', event.target.value)}
              placeholder="z. B. Premium Fronten"
            />
          </label>
          <label className={styles.field}>
            <span>Textur-URL</span>
            <input
              className={styles.input}
              value={createForm.texture_url}
              onChange={(event) => updateCreateForm('texture_url', event.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className={styles.field}>
            <span>Preview-URL</span>
            <input
              className={styles.input}
              value={createForm.preview_url}
              onChange={(event) => updateCreateForm('preview_url', event.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={createForm.favorite}
              onChange={(event) => updateCreateForm('favorite', event.target.checked)}
            />
            Als Favorit anlegen
          </label>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={creating}>
            {creating ? 'Erstelle…' : 'Material erstellen'}
          </button>
        </div>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.listWrap}>
        {loading ? (
          <p className={styles.muted}>Lade Materialliste…</p>
        ) : items.length === 0 ? (
          <p className={styles.muted}>Keine Materialien gefunden.</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => {
              const form = editForms[item.id] ?? toFormState(item)
              const isSaving = savingId === item.id
              const isDeleting = deletingId === item.id

              return (
                <li key={item.id} className={styles.item}>
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Name</span>
                      <input
                        className={styles.input}
                        value={form.name}
                        onChange={(event) => updateEditForm(item.id, 'name', event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Kategorie</span>
                      <select
                        className={styles.select}
                        value={form.category}
                        onChange={(event) => updateEditForm(item.id, 'category', event.target.value as MaterialCategory)}
                      >
                        {CATEGORY_OPTIONS.filter((option) => option.value).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Ordner</span>
                      <select
                        className={styles.select}
                        value={form.folder_id}
                        onChange={(event) => updateEditForm(item.id, 'folder_id', event.target.value)}
                      >
                        <option value="">Ohne Ordner</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Kollektion</span>
                      <input
                        className={styles.input}
                        value={form.collection}
                        onChange={(event) => updateEditForm(item.id, 'collection', event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Textur-URL</span>
                      <input
                        className={styles.input}
                        value={form.texture_url}
                        onChange={(event) => updateEditForm(item.id, 'texture_url', event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Preview-URL</span>
                      <input
                        className={styles.input}
                        value={form.preview_url}
                        onChange={(event) => updateEditForm(item.id, 'preview_url', event.target.value)}
                      />
                    </label>
                    <label className={styles.checkField}>
                      <input
                        type="checkbox"
                        checked={form.favorite}
                        onChange={(event) => updateEditForm(item.id, 'favorite', event.target.checked)}
                      />
                      Favorit
                    </label>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={isSaving || isDeleting}
                      onClick={() => { void handleSave(item.id) }}
                    >
                      {isSaving ? 'Speichere…' : 'Speichern'}
                    </button>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      disabled={isSaving || isDeleting}
                      onClick={() => { void handleDelete(item.id) }}
                    >
                      {isDeleting ? 'Lösche…' : 'Löschen'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

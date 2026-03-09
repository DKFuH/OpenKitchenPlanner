import { useEffect, useState } from 'react'
import type { LibraryFolder } from '../../api/assetLibrary.js'
import {
  ASSET_CATEGORY_LABELS,
  type AssetLibraryItem,
} from '../../plugins/assetLibrary/index.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minHeight: '0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.4rem',
  },
  viewToggle: {
    display: 'inline-flex',
    background: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    padding: '2px',
  },
  viewBtn: {
    border: 'none',
    background: 'transparent',
    color: tokens.colorNeutralForeground3,
    fontSize: '0.65rem',
    padding: '0.12rem 0.36rem',
    borderRadius: `calc(${tokens.borderRadiusSmall} - 1px)`,
    cursor: 'pointer',
  },
  viewBtnActive: {
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    boxShadow: tokens.shadow4,
  },
  importBtn: {
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: '0.74rem',
    padding: '0.24rem 0.5rem',
    cursor: 'pointer',
    '&:hover': {
      color: tokens.colorBrandForeground1,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  state: {
    margin: '0',
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
  },
  error: {
    margin: '0',
    fontSize: '0.8rem',
    color: tokens.colorPaletteRedForeground1,
  },
  grid: {
    listStyle: 'none',
    margin: '0',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    overflowY: 'auto',
    flex: '1',
  },
  gridCompact: {
    '& .cardMain': {
      padding: '0.24rem 0.35rem',
      gap: '0.08rem',
    },
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  cardActive: {
    border: `1px solid ${tokens.colorBrandForeground1}`,
  },
  cardMain: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    padding: '0.36rem 0.4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  preview: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    minWidth: '2.2rem',
    padding: '0.1rem 0.25rem',
    borderRadius: tokens.borderRadiusCircular,
    fontSize: '0.62rem',
    color: tokens.colorNeutralForegroundInverted,
    background: tokens.colorBrandForeground1,
  },
  previewLarge: {
    minWidth: '3rem',
    fontSize: '0.72rem',
    padding: '0.2rem 0.4rem',
  },
  name: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground1,
    fontWeight: '600',
    lineHeight: '1.2',
  },
  meta: {
    fontSize: '0.72rem',
    color: tokens.colorNeutralForeground3,
  },
  badges: {
    display: 'flex',
    gap: '0.2rem',
  },
  badge: {
    fontSize: '0.62rem',
    borderRadius: tokens.borderRadiusCircular,
    padding: '0.06rem 0.3rem',
    background: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  deleteBtn: {
    width: '100%',
    border: 'none',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    background: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    fontSize: '0.72rem',
    padding: '0.22rem',
    '&:hover': {
      color: tokens.colorPaletteRedForeground1,
    },
  },
  itemActions: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    padding: '0 0.4rem 0.3rem',
  },
  favoriteBtn: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.68rem',
    padding: '0.18rem 0.36rem',
    cursor: 'pointer',
  },
  saveBtn: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.68rem',
    padding: '0.18rem 0.36rem',
    cursor: 'pointer',
  },
  folderSelect: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.68rem',
    padding: '0.16rem 0.24rem',
    minWidth: '5rem',
  },
  collectionInput: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.68rem',
    padding: '0.16rem 0.3rem',
    minWidth: '5rem',
    width: '100%',
  },
  favoriteBtnActive: {
    color: tokens.colorBrandForeground1,
    background: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandForeground1}`,
  },
})

type ViewMode = 'preview' | 'compact'

interface Props {
  assets: AssetLibraryItem[]
  folders: LibraryFolder[]
  selectedAssetId: string | null
  updatingAssetId: string | null
  loading: boolean
  error: string | null
  onOpenImport: () => void
  onSelectAsset: (asset: AssetLibraryItem) => void
  onDeleteAsset: (asset: AssetLibraryItem) => void
  onToggleFavorite: (asset: AssetLibraryItem) => void
  onMoveAssetFolder: (asset: AssetLibraryItem, folderId: string | null) => void
  onSetAssetCollection: (asset: AssetLibraryItem, collection: string | null) => void
}

export function AssetBrowser({
assets,
  folders,
  selectedAssetId,
  updatingAssetId,
  loading,
  error,
  onOpenImport,
  onSelectAsset,
  onDeleteAsset,
  onToggleFavorite,
  onMoveAssetFolder,
  onSetAssetCollection,
}: Props) {
  const styles = useStyles();

  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [collectionDrafts, setCollectionDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    setCollectionDrafts((previous) => {
      const next: Record<string, string> = {}
      for (const asset of assets) {
        next[asset.id] = previous[asset.id] ?? asset.collection ?? ''
      }
      return next
    })
  }, [assets])

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'preview' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('preview')}
          >
            Vorschau
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'compact' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('compact')}
          >
            Kompakt
          </button>
        </div>
        <button type="button" className={styles.importBtn} onClick={onOpenImport}>
          + Import
        </button>
      </div>

      {loading ? (
        <p className={styles.state}>Lade Assets…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : assets.length === 0 ? (
        <p className={styles.state}>Keine Assets gefunden</p>
      ) : (
        <ul className={`${styles.grid} ${viewMode === 'compact' ? styles.gridCompact : ''}`}>
          {assets.map((asset) => {
            const bbox = asset.bbox_json
            const active = selectedAssetId === asset.id
            const isUpdating = updatingAssetId === asset.id
            return (
              <li key={asset.id} className={`${styles.card} ${active ? styles.cardActive : ''}`}>
                <button type="button" className={styles.cardMain} onClick={() => onSelectAsset(asset)}>
                  <span className={`${styles.preview} ${viewMode === 'preview' ? styles.previewLarge : ''}`}>{asset.source_format.toUpperCase()}</span>
                  <span className={styles.name}>{asset.name}</span>
                  <span className={styles.meta}>
                    {bbox.width_mm}×{bbox.depth_mm}×{bbox.height_mm} mm
                  </span>
                  <span className={styles.badges}>
                    <span className={styles.badge}>{ASSET_CATEGORY_LABELS[asset.category]}</span>
                    {asset.collection && <span className={styles.badge}>{asset.collection}</span>}
                  </span>
                </button>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={`${styles.favoriteBtn} ${asset.favorite ? styles.favoriteBtnActive : ''}`}
                    onClick={() => onToggleFavorite(asset)}
                    disabled={isUpdating}
                    title="Favorit umschalten"
                  >
                    ★
                  </button>
                  <select
                    className={styles.folderSelect}
                    value={asset.folder_id ?? ''}
                    disabled={isUpdating}
                    onChange={(event) => onMoveAssetFolder(asset, event.target.value || null)}
                  >
                    <option value="">Ohne Ordner</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                  <input
                    className={styles.collectionInput}
                    value={collectionDrafts[asset.id] ?? ''}
                    placeholder="Kollektion"
                    disabled={isUpdating}
                    onChange={(event) => {
                      const value = event.target.value
                      setCollectionDrafts((previous) => ({ ...previous, [asset.id]: value }))
                    }}
                  />
                  <button
                    type="button"
                    className={styles.saveBtn}
                    disabled={isUpdating}
                    onClick={() => onSetAssetCollection(asset, (collectionDrafts[asset.id] ?? '').trim() || null)}
                  >
                    Setzen
                  </button>
                </div>
                <button type="button" className={styles.deleteBtn} onClick={() => onDeleteAsset(asset)} title="Asset löschen">
                  Löschen
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

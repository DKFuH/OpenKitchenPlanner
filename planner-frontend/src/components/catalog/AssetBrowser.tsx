import { useEffect, useState } from 'react'
import type { LibraryFolder } from '../../api/assetLibrary.js'
import {
  ASSET_CATEGORY_LABELS,
  type AssetLibraryItem,
} from '../../plugins/assetLibrary/index.js'
import styles from './AssetBrowser.module.css'

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

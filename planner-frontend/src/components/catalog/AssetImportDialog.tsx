import { useMemo, useState } from 'react'
import { assetLibraryApi } from '../../api/assetLibrary.js'
import {
  ASSET_CATEGORY_LABELS,
  type AssetCategory,
  type AssetLibraryItem,
} from '../../plugins/assetLibrary/index.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1200',
  },
  dialog: {
    width: 'min(420px, calc(100vw - 2rem))',
    background: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    padding: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    margin: '0',
    fontSize: '0.92rem',
    color: tokens.colorNeutralForeground1,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.78rem',
    color: tokens.colorNeutralForeground3,
    '& input': {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      background: tokens.colorNeutralBackground1,
      color: tokens.colorNeutralForeground1,
      borderRadius: tokens.borderRadiusSmall,
      fontSize: '0.82rem',
      padding: '0.38rem 0.45rem',
    },
    '& select': {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      background: tokens.colorNeutralBackground1,
      color: tokens.colorNeutralForeground1,
      borderRadius: tokens.borderRadiusSmall,
      fontSize: '0.82rem',
      padding: '0.38rem 0.45rem',
    },
    '& input:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
    '& select:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  error: {
    margin: '0',
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.78rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.4rem',
  },
  cancelBtn: {
    borderRadius: tokens.borderRadiusSmall,
    fontSize: '0.8rem',
    padding: '0.34rem 0.62rem',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
  submitBtn: {
    borderRadius: tokens.borderRadiusSmall,
    fontSize: '0.8rem',
    padding: '0.34rem 0.62rem',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorBrandForeground1}`,
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
})

interface Props {
  isOpen: boolean
  onClose: () => void
  onImported: (item: AssetLibraryItem) => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Datei konnte nicht gelesen werden'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}

export function AssetImportDialog({
isOpen, onClose, onImported }: Props) {
  const styles = useStyles();

  const [name, setName] = useState('')
  const [category, setCategory] = useState<AssetCategory>('custom')
  const [tagsInput, setTagsInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptedExtensions = useMemo(() => '.obj,.dae', [])

  if (!isOpen) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Bitte eine OBJ- oder DAE-Datei auswählen')
      return
    }

    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.obj') && !lower.endsWith('.dae')) {
      setError('Nur OBJ- und DAE-Dateien sind erlaubt')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const fileBase64 = await fileToBase64(file)
      const tags = tagsInput
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)

      const imported = await assetLibraryApi.importAsset({
        name: name.trim() || undefined,
        category,
        tags,
        file_name: file.name,
        file_base64: fileBase64,
      })

      onImported(imported)
      setName('')
      setCategory('custom')
      setTagsInput('')
      setFile(null)
      onClose()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Asset importieren">
      <form className={styles.dialog} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <h3 className={styles.title}>Asset importieren</h3>
        </header>

        <label className={styles.field}>
          Datei
          <input
            type="file"
            accept={acceptedExtensions}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label className={styles.field}>
          Name (optional)
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name aus Datei übernehmen"
          />
        </label>

        <label className={styles.field}>
          Kategorie
          <select value={category} onChange={(event) => setCategory(event.target.value as AssetCategory)}>
            {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Tags (Komma-getrennt)
          <input
            type="text"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="z. B. unterschrank, mdf"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <footer className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={busy}>Abbrechen</button>
          <button type="submit" className={styles.submitBtn} disabled={busy}>{busy ? 'Importiere…' : 'Importieren'}</button>
        </footer>
      </form>
    </div>
  )
}

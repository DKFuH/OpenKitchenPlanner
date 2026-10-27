import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Input, makeStyles, tokens } from '@fluentui/react-components'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Opening } from '../../api/openings.js'
import { OPENING_FAMILIES } from '../../editor/openingFamilies.js'

const useStyles = makeStyles({
  surface: { maxWidth: '1040px', width: 'calc(100vw - 48px)' },
  layout: { display: 'grid', gridTemplateColumns: '210px 1fr', gap: tokens.spacingHorizontalL, minHeight: '440px', '@media(max-width: 700px)': { gridTemplateColumns: '1fr' } },
  sidebar: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  preview: { width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#858585', borderRadius: tokens.borderRadiusSmall },
  results: { minWidth: '0', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  filters: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacingHorizontalM },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: tokens.spacingHorizontalS, maxHeight: '490px', overflowY: 'auto', padding: '3px' },
  card: { display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '6px', cursor: 'pointer', border: `2px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusSmall, background: tokens.colorNeutralBackground1, color: tokens.colorNeutralForeground1 },
  selected: { border: `2px solid ${tokens.colorBrandStroke1}`, background: tokens.colorBrandBackground2 },
  thumbnail: { width: '100%', aspectRatio: '1.15', objectFit: 'contain', background: '#858585' },
  name: { fontSize: '12px', fontWeight: 600, marginTop: '6px' },
  meta: { fontSize: '11px', color: tokens.colorNeutralForeground3 },
  empty: { padding: '24px', color: tokens.colorNeutralForeground3 },
  files: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalM, fontSize: '12px' },
})

const thumbnailCache = new Map<string, string>()
const FAVORITES_KEY = 'okp:opening-template-favorites'

export function OpeningLibraryDialog({ opening, open, onClose, onChoose }: {
  opening: Opening
  open: boolean
  onClose: () => void
  onChoose: (familyId: string) => void
}) {
  const styles = useStyles()
  const [category, setCategory] = useState(opening.type === 'window' ? 'window' : 'door')
  const [selectedId, setSelectedId] = useState(opening.family_id ?? '')
  const [query, setQuery] = useState('')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') } catch { return [] }
  })
  const [thumbnails, setThumbnails] = useState<Record<string, string>>(() => Object.fromEntries(thumbnailCache))
  const [error, setError] = useState('')
  const selected = OPENING_FAMILIES.find(family => family.id === selectedId)
  const filtered = useMemo(() => OPENING_FAMILIES.filter(family => family.opening.type === category
    && family.label.toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de'))
    && (!favoriteOnly || favorites.includes(family.id))), [category, favoriteOnly, favorites, query])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    let renderer: THREE.WebGLRenderer | undefined
    async function buildThumbnails() {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
        renderer.setSize(320, 300)
        const loader = new GLTFLoader()
        for (const family of OPENING_FAMILIES) {
          if (cancelled) break
          if (thumbnailCache.has(family.id)) continue
          const asset = await loader.loadAsync(family.modelUrl)
          const scene = new THREE.Scene()
          scene.background = new THREE.Color('#858585')
          scene.add(new THREE.HemisphereLight(0xffffff, 0x6b7280, 3))
          const light = new THREE.DirectionalLight(0xffffff, 3)
          light.position.set(-3, 4, 5)
          scene.add(light)
          const box = new THREE.Box3().setFromObject(asset.scene)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())
          asset.scene.position.sub(center)
          scene.add(asset.scene)
          const view = Math.max(size.y, size.x / (320 / 300)) * 1.28
          const camera = new THREE.OrthographicCamera(-view * 320 / 300 / 2, view * 320 / 300 / 2, view / 2, -view / 2, 0.01, 100)
          camera.position.set(1.2, 0.5, 6)
          camera.lookAt(0, 0, 0)
          renderer.render(scene, camera)
          const url = renderer.domElement.toDataURL('image/png')
          thumbnailCache.set(family.id, url)
          if (!cancelled) setThumbnails(previous => ({ ...previous, [family.id]: url }))
          asset.scene.traverse(object => {
            const mesh = object as THREE.Mesh
            mesh.geometry?.dispose()
            if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose())
            else mesh.material?.dispose()
          })
        }
      } catch {
        if (!cancelled) setError('Die 3D-Vorschaudateien konnten nicht geladen werden. Die Vorlagen können weiterhin ausgewählt werden.')
      } finally { renderer?.dispose() }
    }
    void buildThumbnails()
    return () => { cancelled = true }
  }, [open])

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(entry => entry !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  return (
    <Dialog open={open} onOpenChange={(_event, data) => { if (!data.open) onClose() }}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Objekt wählen</DialogTitle>
          <DialogContent>
            <div className={styles.layout}>
              <aside className={styles.sidebar}>
                <strong>{selected?.label ?? 'Vorlage auswählen'}</strong>
                {selected && thumbnails[selected.id] && <img className={styles.preview} src={thumbnails[selected.id]} alt={`Vorschau ${selected.label}`} />}
                {selected && <>
                  <span className={styles.meta}>{selected.opening.width_mm} × {selected.opening.height_mm} mm</span>
                  <label><input type="checkbox" checked={favorites.includes(selected.id)} onChange={() => toggleFavorite(selected.id)} /> Ist Favorit</label>
                  <div className={styles.files}>
                    <a href={selected.planUrl} download>DXF</a>
                    <a href={selected.modelUrl} download>glTF</a>
                    <a href={`/object-library/${selected.id}/template.json`} download>Vorlage</a>
                  </div>
                </>}
                <strong>Objekte an der Wand</strong>
                <Button appearance={category === 'window' ? 'primary' : 'subtle'} onClick={() => setCategory('window')}>Fenster</Button>
                <Button appearance={category === 'door' ? 'primary' : 'subtle'} onClick={() => setCategory('door')}>Türen</Button>
              </aside>
              <div className={styles.results}>
                <div className={styles.filters}>
                  <Input aria-label="Objektbibliothek durchsuchen" placeholder="Vorlage suchen…" value={query} onChange={(_event, data) => setQuery(data.value)} />
                  <label><input type="checkbox" checked={favoriteOnly} onChange={event => setFavoriteOnly(event.target.checked)} /> Nur Favoriten</label>
                </div>
                {error && <p role="status">{error}</p>}
                <div className={styles.grid}>
                  {filtered.map(family => (
                    <button type="button" key={family.id} className={`${styles.card} ${selectedId === family.id ? styles.selected : ''}`} aria-pressed={selectedId === family.id} onClick={() => setSelectedId(family.id)} onDoubleClick={() => { onChoose(family.id); onClose() }}>
                      {thumbnails[family.id] ? <img className={styles.thumbnail} src={thumbnails[family.id]} alt="" /> : <span className={styles.empty}>Vorschau laden…</span>}
                      <span className={styles.name}>{family.label}</span>
                      <span className={styles.meta}>{family.opening.width_mm} × {family.opening.height_mm} mm</span>
                    </button>
                  ))}
                </div>
                {filtered.length === 0 && <p>Keine passenden Vorlagen gefunden.</p>}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Abbrechen</Button>
            <Button appearance="primary" disabled={!selected} onClick={() => { if (selected) { onChoose(selected.id); onClose() } }}>Übernehmen</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

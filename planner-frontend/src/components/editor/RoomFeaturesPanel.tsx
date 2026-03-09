import { useEffect, useState } from 'react'
import type {
  MeasureLine,
  Comment,
  WorktopSchema,
  RoomColoring,
  RoomSurfaceColor,
  DecoObject,
  LightingProfile,
  LightSource,
} from '@shared/types'
import { annotationsApi, worktopsApi, roomDecorationApi, lightingApi } from '../../api/rooms.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  section: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  collapseHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: tokens.colorNeutralForeground1,
    '&:hover': {
      background: 'var(--surface-hover)',
    },
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.05em',
  },
  subTitle: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    margin: '0.4rem 0.75rem 0.3rem',
    letterSpacing: '0.04em',
  },
  muted: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
    margin: '0 0.75rem 0.5rem',
  },
  error: {
    fontSize: '0.8rem',
    color: tokens.colorPaletteRedForeground1,
    margin: '0 0.75rem 0.4rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    margin: '0 0.75rem 0.5rem',
  },
  listItem: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.4rem 0.5rem',
    fontSize: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    '& strong': {
      color: tokens.colorNeutralForeground1,
      fontSize: '0.82rem',
    },
  },
  dim: {
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground3,
  },
  addBtn: {
    width: 'calc(100% - 1.5rem)',
    margin: '0 0.75rem 0.6rem',
    background: 'none',
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.3rem',
    fontSize: '0.78rem',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    '&:hover': {
      color: tokens.colorBrandForeground1,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  deleteBtn: {
    alignSelf: 'flex-start',
    marginTop: '0.15rem',
    padding: '0.15rem 0.5rem',
    border: '1px solid var(--status-danger-border)',
    borderRadius: tokens.borderRadiusSmall,
    background: 'none',
    color: tokens.colorPaletteRedForeground1,
    cursor: 'pointer',
    fontSize: '0.72rem',
    '&:hover': {
      background: tokens.colorPaletteRedBackground1,
    },
  },
  colorGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    margin: '0 0.75rem 0.5rem',
  },
  colorRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground1,
  },
  colorInput: {
    width: '2rem',
    height: '1.4rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    padding: '0',
  },
  lightDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  lightChip: {
    fontSize: '0.72rem',
    color: tokens.colorNeutralForeground3,
    background: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.1rem 0.3rem',
  },
  inlineForm: {
    display: 'flex',
    gap: '0.3rem',
    margin: '0.3rem 0.75rem 0.6rem',
  },
  inlineInput: {
    flex: '1',
    padding: '0.25rem 0.4rem',
    fontSize: '0.8rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    '&:focus': {
      outline: 'none',
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  btnAdd: {
    padding: '0.25rem 0.6rem',
    fontSize: '0.85rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    '&:hover': {
      background: tokens.colorBrandForeground1,
      color: '#fff',
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  subTitleSpaced: {
    marginTop: '0.75rem',
  },
})

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const SURFACE_LABELS: Record<RoomSurfaceColor['surface'], string> = {
  floor: 'Boden',
  ceiling: 'Decke',
  wall_north: 'Wand Nord',
  wall_south: 'Wand Süd',
  wall_east: 'Wand Ost',
  wall_west: 'Wand West',
}

const SURFACE_KEYS: RoomSurfaceColor['surface'][] = [
  'floor', 'ceiling', 'wall_north', 'wall_south', 'wall_east', 'wall_west',
]

// ─── Haupt-Komponente ────────────────────────────────────────────────────────

interface Props {
  roomId: string
}

export function RoomFeaturesPanel({
roomId }: Props) {
  return (
    <>
      <WorktopsSection roomId={roomId} />
      <AnnotationsSection roomId={roomId} />
      <RoomDecorationSection roomId={roomId} />
      <LightingSection roomId={roomId} />
    </>
  )
}

// ─── Arbeitsflächen (Sprint 36) ──────────────────────────────────────────────

function WorktopsSection({ roomId }: { roomId: string }) {
  const styles = useStyles();

  const [worktops, setWorktops] = useState<WorktopSchema[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    worktopsApi.list(roomId)
      .then(setWorktops)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [roomId, open])

  async function handleAdd() {
    setError(null)
    try {
      const created = await worktopsApi.create(roomId, {
        polygon: [
          { x_mm: 0, y_mm: 0 },
          { x_mm: 600, y_mm: 0 },
          { x_mm: 600, y_mm: 600 },
          { x_mm: 0, y_mm: 600 },
        ],
        edges: [],
        thickness_mm: 38,
        overhang_mm: 20,
      })
      setWorktops((prev) => [...prev, created])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  async function handleDelete(schemaId: string) {
    setError(null)
    try {
      await worktopsApi.delete(roomId, schemaId)
      setWorktops((prev) => prev.filter((w) => w.id !== schemaId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  return (
    <div className={styles.section}>
      <button type="button" className={styles.collapseHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.sectionTitle}>Arbeitsflächen</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          {error && <p className={styles.error}>{error}</p>}
          {loading ? (
            <p className={styles.muted}>Lade…</p>
          ) : worktops.length === 0 ? (
            <p className={styles.muted}>Keine Arbeitsflächen</p>
          ) : (
            <div className={styles.list}>
              {worktops.map((w) => (
                <div key={w.id} className={styles.listItem}>
                  <span>{w.article_number ?? 'Ohne Artikelnummer'}</span>
                  <span className={styles.dim}>{w.thickness_mm ?? '–'} mm Stärke · {w.polygon.length} Eckpunkte</span>
                  <button type="button" className={styles.deleteBtn} onClick={() => void handleDelete(w.id)}>
                    Löschen
                  </button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className={styles.addBtn} onClick={() => void handleAdd()}>
            + Arbeitsfläche hinzufügen
          </button>
        </>
      )}
    </div>
  )
}

// ─── Annotationen (Sprint 37) ────────────────────────────────────────────────

function AnnotationsSection({ roomId }: { roomId: string }) {
  const styles = useStyles();

  const [measureLines, setMeasureLines] = useState<MeasureLine[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      annotationsApi.listMeasureLines(roomId),
      annotationsApi.listComments(roomId),
    ])
      .then(([lines, comms]) => {
        setMeasureLines(lines)
        setComments(comms)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [roomId, open])

  async function handleAddMeasureLine() {
    setError(null)
    try {
      const line = await annotationsApi.createMeasureLine(roomId, {
        points: [{ x_mm: 0, y_mm: 0 }, { x_mm: 1000, y_mm: 0 }],
        label: 'Maßlinie',
        is_chain: false,
      })
      setMeasureLines((prev) => [...prev, line])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  async function handleDeleteMeasureLine(lineId: string) {
    setError(null)
    try {
      await annotationsApi.deleteMeasureLine(roomId, lineId)
      setMeasureLines((prev) => prev.filter((l) => l.id !== lineId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setError(null)
    try {
      const comment = await annotationsApi.createComment(roomId, {
        position: { x_mm: 500, y_mm: 500 },
        text: newComment.trim(),
        show_in_plan: true,
        show_in_perspective: true,
      })
      setComments((prev) => [...prev, comment])
      setNewComment('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  async function handleDeleteComment(commentId: string) {
    setError(null)
    try {
      await annotationsApi.deleteComment(roomId, commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  return (
    <div className={styles.section}>
      <button type="button" className={styles.collapseHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.sectionTitle}>Annotationen</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          {error && <p className={styles.error}>{error}</p>}
          {loading ? (
            <p className={styles.muted}>Lade…</p>
          ) : (
            <>
              <p className={styles.subTitle}>Maßlinien ({measureLines.length})</p>
              {measureLines.length === 0 ? (
                <p className={styles.muted}>Keine Maßlinien</p>
              ) : (
                <div className={styles.list}>
                  {measureLines.map((line) => (
                    <div key={line.id} className={styles.listItem}>
                      <span>{line.label ?? 'Maßlinie'} · {line.points.length} Punkte</span>
                      <button type="button" className={styles.deleteBtn} onClick={() => void handleDeleteMeasureLine(line.id)}>
                        Löschen
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className={styles.addBtn} onClick={() => void handleAddMeasureLine()}>
                + Maßlinie hinzufügen
              </button>

              <p className={`${styles.subTitle} ${styles.subTitleSpaced}`}>Kommentare ({comments.length})</p>
              {comments.length === 0 ? (
                <p className={styles.muted}>Keine Kommentare</p>
              ) : (
                <div className={styles.list}>
                  {comments.map((c) => (
                    <div key={c.id} className={styles.listItem}>
                      <span>{c.text}</span>
                      <button type="button" className={styles.deleteBtn} onClick={() => void handleDeleteComment(c.id)}>
                        Löschen
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={(e) => void handleAddComment(e)} className={styles.inlineForm}>
                <input
                  type="text"
                  placeholder="Kommentar…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={styles.inlineInput}
                />
                <button type="submit" className={styles.btnAdd}>+</button>
              </form>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Raumgestaltung (Sprint 38) ──────────────────────────────────────────────

function RoomDecorationSection({ roomId }: { roomId: string }) {
  const styles = useStyles();

  const [coloring, setColoring] = useState<RoomColoring | null>(null)
  const [decoObjects, setDecoObjects] = useState<DecoObject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      roomDecorationApi.getColoring(roomId),
      roomDecorationApi.listDecoObjects(roomId),
    ])
      .then(([c, d]) => {
        setColoring(c)
        setDecoObjects(d)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [roomId, open])

  async function handleColorChange(surface: RoomSurfaceColor['surface'], colorHex: string) {
    setError(null)
    const currentSurfaces = coloring?.surfaces ?? []
    const existingEntry = currentSurfaces.find((s) => s.surface === surface)
    const mergedEntry: RoomSurfaceColor = existingEntry
      ? { ...existingEntry, surface, color_hex: colorHex }
      : { surface, color_hex: colorHex }
    const nextSurfaces: RoomSurfaceColor[] = [
      ...currentSurfaces.filter((s) => s.surface !== surface),
      mergedEntry,
    ]
    try {
      await roomDecorationApi.updateColoring(roomId, { surfaces: nextSurfaces })
      setColoring((prev) => prev ? { ...prev, surfaces: nextSurfaces } : { id: '', room_id: roomId, surfaces: nextSurfaces })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    }
  }

  async function handleDeleteDeco(decoId: string) {
    setError(null)
    try {
      await roomDecorationApi.deleteDecoObject(roomId, decoId)
      setDecoObjects((prev) => prev.filter((d) => d.id !== decoId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  return (
    <div className={styles.section}>
      <button type="button" className={styles.collapseHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.sectionTitle}>Raumgestaltung</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          {error && <p className={styles.error}>{error}</p>}
          {loading ? (
            <p className={styles.muted}>Lade…</p>
          ) : (
            <>
              <p className={styles.subTitle}>Oberflächen</p>
              <div className={styles.colorGrid}>
                {SURFACE_KEYS.map((surfaceKey) => {
                  const entry = coloring?.surfaces.find((s) => s.surface === surfaceKey)
                  return (
                    <label key={surfaceKey} className={styles.colorRow}>
                      <span>{SURFACE_LABELS[surfaceKey]}</span>
                      <input
                        type="color"
                        value={entry?.color_hex ?? '#ffffff'}
                        onChange={(e) => void handleColorChange(surfaceKey, e.target.value)}
                        className={styles.colorInput}
                      />
                    </label>
                  )
                })}
              </div>

              <p className={`${styles.subTitle} ${styles.subTitleSpaced}`}>Dekoobjekte ({decoObjects.length})</p>
              {decoObjects.length === 0 ? (
                <p className={styles.muted}>Keine Dekoobjekte</p>
              ) : (
                <div className={styles.list}>
                  {decoObjects.map((d) => (
                    <div key={d.id} className={styles.listItem}>
                      <span>{d.catalog_item_id.slice(0, 8)}…</span>
                      <span className={styles.dim}>
                        X: {Math.round(d.position.x_mm)} · Y: {Math.round(d.position.y_mm)} · {d.rotation_deg}°
                      </span>
                      <button type="button" className={styles.deleteBtn} onClick={() => void handleDeleteDeco(d.id)}>
                        Löschen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Beleuchtung (Sprint 39) ─────────────────────────────────────────────────

function LightingSection({ roomId }: { roomId: string }) {
  const styles = useStyles();

  const [profiles, setProfiles] = useState<LightingProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    lightingApi.listProfiles(roomId)
      .then(setProfiles)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [roomId, open])

  async function handleAddProfile() {
    setError(null)
    const defaultLight: LightSource = {
      id: crypto.randomUUID(),
      type: 'general',
      position: { x_mm: 0, y_mm: 0, z_mm: 2400 },
      intensity: 1000,
      color_temp_k: 3000,
    }
    try {
      const profile = await lightingApi.createProfile(roomId, {
        name: 'Beleuchtungsprofil',
        lights: [defaultLight],
      })
      setProfiles((prev) => [...prev, profile])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  async function handleDeleteProfile(profileId: string) {
    setError(null)
    try {
      await lightingApi.deleteProfile(roomId, profileId)
      setProfiles((prev) => prev.filter((p) => p.id !== profileId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  return (
    <div className={styles.section}>
      <button type="button" className={styles.collapseHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.sectionTitle}>Beleuchtung</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          {error && <p className={styles.error}>{error}</p>}
          {loading ? (
            <p className={styles.muted}>Lade…</p>
          ) : profiles.length === 0 ? (
            <p className={styles.muted}>Keine Beleuchtungsprofile</p>
          ) : (
            <div className={styles.list}>
              {profiles.map((profile) => (
                <div key={profile.id} className={styles.listItem}>
                  <strong>{profile.name}</strong>
                  <span className={styles.dim}>{profile.lights.length} Lichtquellen</span>
                  <div className={styles.lightDetails}>
                    {profile.lights.map((light) => (
                      <span key={light.id} className={styles.lightChip}>
                        {light.type} · {light.intensity} lm
                        {light.color_temp_k != null ? ` · ${light.color_temp_k}K` : ''}
                      </span>
                    ))}
                  </div>
                  <button type="button" className={styles.deleteBtn} onClick={() => void handleDeleteProfile(profile.id)}>
                    Profil löschen
                  </button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className={styles.addBtn} onClick={() => void handleAddProfile()}>
            + Beleuchtungsprofil hinzufügen
          </button>
        </>
      )}
    </div>
  )
}

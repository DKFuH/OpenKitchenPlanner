import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { checklistsApi, siteSurveysApi, type InstallationChecklist, type SiteSurvey } from '../api/siteSurveys.js'
import { projectsApi, type Project } from '../api/projects.js'
import styles from './SiteSurveyPage.module.css'

type Tab = 'surveys' | 'checklists'

type RoomMeasurement = {
  name: string
  width_mm: number
  depth_mm: number
  height_mm?: number
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '–'
  return new Date(value).toLocaleString('de-DE')
}

function getRooms(measurements: Record<string, unknown>): RoomMeasurement[] {
  const maybeRooms = measurements.rooms
  if (!Array.isArray(maybeRooms)) {
    return []
  }

  return maybeRooms
    .filter((room): room is RoomMeasurement => {
      if (!room || typeof room !== 'object') return false
      const candidate = room as Record<string, unknown>
      return (
        typeof candidate.name === 'string'
        && typeof candidate.width_mm === 'number'
        && typeof candidate.depth_mm === 'number'
        && (candidate.height_mm === undefined || typeof candidate.height_mm === 'number')
      )
    })
}

export function SiteSurveyPage() {
  const navigate = useNavigate()

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [surveys, setSurveys] = useState<SiteSurvey[]>([])
  const [checklists, setChecklists] = useState<InstallationChecklist[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('surveys')
  const [createdBy, setCreatedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      setSurveys([])
      setChecklists([])
      setSelectedSurveyId(null)
      setSelectedChecklistId(null)
      return
    }

    setBusy(true)
    setError(null)

    Promise.all([
      siteSurveysApi.list(selectedProjectId),
      checklistsApi.list(selectedProjectId),
    ])
      .then(([surveyData, checklistData]) => {
        setSurveys(surveyData)
        setChecklists(checklistData)
        setSelectedSurveyId(surveyData[0]?.id ?? null)
        setSelectedChecklistId(checklistData[0]?.id ?? null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusy(false))
  }, [selectedProjectId])

  const selectedSurvey = useMemo(
    () => surveys.find((survey) => survey.id === selectedSurveyId) ?? null,
    [surveys, selectedSurveyId],
  )

  const selectedChecklist = useMemo(
    () => checklists.find((checklist) => checklist.id === selectedChecklistId) ?? null,
    [checklists, selectedChecklistId],
  )

  const checklistDoneCount = selectedChecklist?.items.filter((item) => item.checked).length ?? 0
  const checklistTotalCount = selectedChecklist?.items.length ?? 0

  async function handleCreateSurvey(event: FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !createdBy.trim()) return

    setBusy(true)
    setError(null)

    try {
      const created = await siteSurveysApi.create(selectedProjectId, {
        created_by: createdBy.trim(),
        notes: notes.trim() || null,
      })
      setSurveys((prev) => [created, ...prev])
      setSelectedSurveyId(created.id)
      setCreatedBy('')
      setNotes('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen')
    } finally {
      setBusy(false)
    }
  }

  async function handleChecklistItemToggle(checklistId: string, itemId: string, checked: boolean) {
    try {
      const updated = await checklistsApi.updateItem(checklistId, itemId, { checked })
      setChecklists((prev) => prev.map((checklist) => (
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.map((item) => (item.id === itemId ? { ...item, checked: updated.checked } : item)),
            }
          : checklist
      )))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren')
    }
  }

  async function handleChecklistItemNote(checklistId: string, itemId: string, noteValue: string) {
    try {
      const updated = await checklistsApi.updateItem(checklistId, itemId, { note: noteValue })
      setChecklists((prev) => prev.map((checklist) => (
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.map((item) => (item.id === itemId ? { ...item, note: updated.note } : item)),
            }
          : checklist
      )))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren')
    }
  }

  const rooms = selectedSurvey ? getRooms(selectedSurvey.measurements) : []

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/')}>← Projekte</button>
        <h1 className={styles.title}>Mobile Aufmaße & Baustellenprotokoll</h1>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <label className={styles.label} htmlFor="site-survey-project-select">Projekt</label>
          <select
            id="site-survey-project-select"
            className={styles.select}
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            <option value="">Projekt auswählen …</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'surveys' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('surveys')}
            >
              Aufmaße
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'checklists' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('checklists')}
            >
              Checklisten
            </button>
          </div>

          {tab === 'surveys' && (
            <div className={styles.list}>
              {surveys.map((survey) => (
                <button
                  key={survey.id}
                  type="button"
                  className={`${styles.listItem} ${selectedSurveyId === survey.id ? styles.listItemActive : ''}`}
                  onClick={() => setSelectedSurveyId(survey.id)}
                >
                  <span>{survey.created_by}</span>
                  <small>{formatDate(survey.created_at)}</small>
                </button>
              ))}
              {!busy && surveys.length === 0 && selectedProjectId && <p className={styles.hint}>Keine Aufmaße vorhanden.</p>}
            </div>
          )}

          {tab === 'checklists' && (
            <div className={styles.list}>
              {checklists.map((checklist) => (
                <button
                  key={checklist.id}
                  type="button"
                  className={`${styles.listItem} ${selectedChecklistId === checklist.id ? styles.listItemActive : ''}`}
                  onClick={() => setSelectedChecklistId(checklist.id)}
                >
                  <span>{checklist.title}</span>
                  <small>{checklist.items.filter((item) => item.checked).length}/{checklist.items.length} erledigt</small>
                </button>
              ))}
              {!busy && checklists.length === 0 && selectedProjectId && <p className={styles.hint}>Keine Checklisten vorhanden.</p>}
            </div>
          )}
        </aside>

        <main className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}
          {busy && <p className={styles.hint}>Laden …</p>}

          {!selectedProjectId && <p className={styles.hint}>Bitte Projekt auswählen.</p>}

          {selectedProjectId && tab === 'surveys' && (
            <>
              <section className={styles.card}>
                <h2>Neues Aufmaß</h2>
                <form className={styles.form} onSubmit={handleCreateSurvey}>
                  <input
                    className={styles.input}
                    placeholder="Erfasst von"
                    value={createdBy}
                    onChange={(event) => setCreatedBy(event.target.value)}
                  />
                  <textarea
                    className={styles.textarea}
                    placeholder="Notizen"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                  <button type="submit" className={styles.primaryBtn} disabled={busy || !createdBy.trim()}>Aufmaß anlegen</button>
                </form>
              </section>

              <section className={styles.card}>
                <h2>Detailansicht</h2>
                {!selectedSurvey && <p className={styles.hint}>Aufmaß auswählen.</p>}
                {selectedSurvey && (
                  <>
                    <p className={styles.meta}>Erfasst von: {selectedSurvey.created_by} · {formatDate(selectedSurvey.created_at)}</p>

                    <h3>Messungen</h3>
                    {rooms.length > 0 ? (
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Raum</th>
                            <th>Breite (mm)</th>
                            <th>Tiefe (mm)</th>
                            <th>Höhe (mm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rooms.map((room, index) => (
                            <tr key={`${room.name}-${index}`}>
                              <td>{room.name}</td>
                              <td>{room.width_mm}</td>
                              <td>{room.depth_mm}</td>
                              <td>{room.height_mm ?? '–'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <pre className={styles.jsonBlock}>{JSON.stringify(selectedSurvey.measurements, null, 2)}</pre>
                    )}

                    <h3>Fotos</h3>
                    <div className={styles.photoGrid}>
                      {selectedSurvey.photos.length === 0 && <p className={styles.hint}>Keine Fotos.</p>}
                      {selectedSurvey.photos.map((photo, index) => (
                        <div key={`${photo.url}-${index}`} className={styles.photoCard}>
                          <img src={photo.url} alt={photo.caption ?? 'Foto'} className={styles.photo} />
                          <small>{photo.caption ?? 'Ohne Beschriftung'}</small>
                        </div>
                      ))}
                    </div>

                    <h3>Notizen</h3>
                    <p>{selectedSurvey.notes ?? '–'}</p>
                  </>
                )}
              </section>
            </>
          )}

          {selectedProjectId && tab === 'checklists' && (
            <section className={styles.card}>
              <h2>Checklisten-Tab</h2>
              {!selectedChecklist && <p className={styles.hint}>Checkliste auswählen.</p>}
              {selectedChecklist && (
                <>
                  <p className={styles.meta}>
                    Fortschritt: {checklistDoneCount}/{checklistTotalCount} erledigt
                  </p>
                  <div className={styles.checklistItems}>
                    {selectedChecklist.items.map((item) => (
                      <div key={item.id} className={styles.checklistItem}>
                        <label className={styles.checkLabel}>
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(event) => {
                              void handleChecklistItemToggle(selectedChecklist.id, item.id, event.target.checked)
                            }}
                          />
                          <span>{item.label}</span>
                        </label>
                        <input
                          className={styles.input}
                          placeholder="Notiz"
                          onBlur={(event) => {
                            if ((item.note ?? '') !== event.target.value) {
                              void handleChecklistItemNote(selectedChecklist.id, item.id, event.target.value)
                            }
                          }}
                          defaultValue={item.note ?? ''}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

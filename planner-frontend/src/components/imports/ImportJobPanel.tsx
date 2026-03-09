import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createCadImportJob,
  createSkpImportJob,
  getImportJob,
  type ImportJob,
  type ImportProtocolEntry,
} from '../../api/imports.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0.75rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    background: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  title: {
    margin: '0',
    fontSize: '0.95rem',
    color: tokens.colorNeutralForeground1,
  },
  status: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
  },
  controls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fileInput: {
    fontSize: '0.82rem',
  },
  uploadBtn: {
    border: `1px solid ${tokens.colorBrandForeground1}`,
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    borderRadius: tokens.borderRadiusCircular,
    padding: '0.35rem 0.7rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
    boxShadow: tokens.shadow4,
    '&:disabled': {
      opacity: '0.55',
      cursor: 'not-allowed',
    },
  },
  meta: {
    margin: '0',
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
  },
  error: {
    margin: '0',
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.82rem',
  },
  protocol: {
    margin: '0',
    paddingLeft: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  protocolItem: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground1,
  },
  protocolTag: {
    display: 'inline-block',
    marginRight: '0.35rem',
    minWidth: '5.2rem',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
})

interface Props {
  projectId: string
  pollIntervalMs?: number
  onJobUpdated?: (job: ImportJob) => void
}

function fileExtension(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
  return ext ?? ''
}

function normalizeProtocol(protocol: ImportJob['protocol']): ImportProtocolEntry[] {
  if (!Array.isArray(protocol)) {
    return []
  }

  return protocol.filter((entry): entry is ImportProtocolEntry => (
    typeof entry === 'object'
    && entry !== null
    && 'status' in entry
    && 'reason' in entry
  )) as ImportProtocolEntry[]
}

export function ImportJobPanel({
projectId, pollIntervalMs = 1500, onJobUpdated }: Props) {
  const styles = useStyles();

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const selectedFileName = selectedFile?.name ?? null
  const status = activeJob?.status ?? 'idle'
  const protocol = useMemo(() => normalizeProtocol(activeJob?.protocol ?? []), [activeJob?.protocol])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  async function pollJob(jobId: string) {
    const job = await getImportJob(jobId)
    setActiveJob(job)
    onJobUpdated?.(job)

    if (job.status === 'done' || job.status === 'failed') {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      setLoading(false)
      if (job.status === 'failed') {
        setError(job.error_message ?? 'Import fehlgeschlagen')
      }
    }
  }

  async function startUpload() {
    if (!selectedFile) {
      setError('Bitte zuerst eine Datei auswählen.')
      return
    }

    const ext = fileExtension(selectedFile.name)
    if (!['dxf', 'dwg', 'skp'].includes(ext)) {
      setError('Nur .dxf, .dwg oder .skp sind erlaubt.')
      return
    }

    setError(null)
    setLoading(true)

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      const createdJob = ext === 'skp'
        ? await createSkpImportJob({ project_id: projectId, file: selectedFile })
        : await createCadImportJob({ project_id: projectId, file: selectedFile })

      setActiveJob(createdJob)
      onJobUpdated?.(createdJob)

      if (createdJob.status === 'done' || createdJob.status === 'failed') {
        setLoading(false)
        if (createdJob.status === 'failed') {
          setError(createdJob.error_message ?? 'Import fehlgeschlagen')
        }
        return
      }

      timerRef.current = window.setInterval(() => {
        void pollJob(createdJob.id).catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : 'Import-Status konnte nicht geladen werden.'
          setError(msg)
          setLoading(false)
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
          }
        })
      }, pollIntervalMs)

      await pollJob(createdJob.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload fehlgeschlagen')
      setLoading(false)
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Import Job</h3>
        <span className={styles.status}>Status: {status}</span>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.fileInput}
          type="file"
          aria-label="Importdatei auswählen"
          accept=".dxf,.dwg,.skp"
          onChange={(event) => {
            setError(null)
            setSelectedFile(event.target.files?.[0] ?? null)
          }}
        />
        <button
          type="button"
          className={styles.uploadBtn}
          onClick={() => { void startUpload() }}
          disabled={loading || !selectedFile}
        >
          {loading ? 'Läuft…' : 'Upload starten'}
        </button>
      </div>

      <p className={styles.meta}>Datei: {selectedFileName ?? '—'}</p>
      {activeJob?.id && <p className={styles.meta}>Job-ID: {activeJob.id}</p>}

      {error && <p className={styles.error}>{error}</p>}

      {activeJob?.error_message && <p className={styles.error}>{activeJob.error_message}</p>}

      <ul className={styles.protocol}>
        {protocol.map((entry, index) => (
          <li key={`${entry.entity_id ?? 'null'}-${index}`} className={styles.protocolItem}>
            <span className={styles.protocolTag}>{entry.status}</span>
            {entry.reason}
          </li>
        ))}
      </ul>
    </section>
  )
}

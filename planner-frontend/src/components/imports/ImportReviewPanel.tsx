import { useEffect, useMemo, useState } from 'react'
import {
  getImportJob,
  type ImportAsset,
  type ImportJob,
  type ImportProtocolEntry,
  type MappingState,
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
  jobId: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
  },
  meta: {
    margin: '0',
    fontSize: '0.82rem',
    color: tokens.colorNeutralForeground3,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.4rem 0.75rem',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  metaItem: {
    margin: '0',
    fontSize: '0.82rem',
    color: tokens.colorNeutralForeground1,
  },
  error: {
    margin: '0',
    color: tokens.colorPaletteRedForeground1,
    fontSize: '0.82rem',
  },
  groups: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.6rem',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  group: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '0.45rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    minHeight: '120px',
  },
  groupTitle: {
    margin: '0',
    fontSize: '0.82rem',
    color: tokens.colorNeutralForeground1,
  },
  empty: {
    margin: '0',
    fontSize: '0.78rem',
    color: tokens.colorNeutralForeground3,
  },
  protocolList: {
    listStyle: 'none',
    margin: '0',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  protocolItem: {
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '0.35rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    fontSize: '0.78rem',
  },
  protocolReason: {
    color: tokens.colorNeutralForeground1,
  },
  protocolMeta: {
    color: tokens.colorNeutralForeground3,
  },
  imported: {
    background: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  ignored: {
    background: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  needsReview: {
    background: 'var(--status-warning-bg)',
    border: '1px solid var(--status-warning-border)',
  },
  mappingSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  mappingList: {
    listStyle: 'none',
    margin: '0',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  mappingItem: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '0.35rem',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '0.25rem 0.5rem',
    alignItems: 'center',
  },
  mappingKey: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground1,
  },
  mappingValue: {
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground1,
    fontWeight: '600',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '0.15rem 0.35rem',
  },
  mappingReason: {
    gridColumn: '1 / -1',
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground3,
  },
})

interface Props {
  jobId: string
}

interface ProtocolGroups {
  imported: ImportProtocolEntry[]
  ignored: ImportProtocolEntry[]
  needs_review: ImportProtocolEntry[]
}

function isImportProtocolEntry(value: unknown): value is ImportProtocolEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<ImportProtocolEntry>
  return (
    (candidate.status === 'imported' || candidate.status === 'ignored' || candidate.status === 'needs_review')
    && typeof candidate.reason === 'string'
  )
}

function normalizeProtocol(job: ImportJob | null): ImportProtocolEntry[] {
  const topLevelProtocol = Array.isArray(job?.protocol)
    ? job?.protocol.filter(isImportProtocolEntry)
    : []

  if (topLevelProtocol.length > 0) {
    return topLevelProtocol
  }

  const assetProtocol = Array.isArray(job?.import_asset?.protocol)
    ? job?.import_asset?.protocol.filter(isImportProtocolEntry)
    : []

  return assetProtocol
}

function groupProtocolEntries(entries: ImportProtocolEntry[]): ProtocolGroups {
  return entries.reduce<ProtocolGroups>((acc, entry) => {
    acc[entry.status].push(entry)
    return acc
  }, {
    imported: [],
    ignored: [],
    needs_review: [],
  })
}

function getMappingState(job: ImportJob | null, importAsset: ImportAsset | null): MappingState | null {
  return job?.mapping_state ?? importAsset?.mapping_state ?? null
}

function statusClassName(status: ImportProtocolEntry['status'], styles: ReturnType<typeof useStyles>): string {
  if (status === 'needs_review') {
    return styles.needsReview
  }
  if (status === 'ignored') {
    return styles.ignored
  }
  return styles.imported
}

function renderProtocolGroup(
  title: string,
  status: ImportProtocolEntry['status'],
  entries: ImportProtocolEntry[],
  styles: ReturnType<typeof useStyles>,
) {
  return (
    <section className={styles.group}>
      <h4 className={styles.groupTitle}>
        {title} ({entries.length})
      </h4>
      {entries.length === 0 ? (
        <p className={styles.empty}>Keine Einträge</p>
      ) : (
        <ul className={styles.protocolList}>
          {entries.map((entry, index) => (
            <li key={`${entry.entity_id ?? 'null'}-${index}`} className={`${styles.protocolItem} ${statusClassName(status, styles)}`}>
              <span className={styles.protocolReason}>{entry.reason}</span>
              {entry.entity_id && <span className={styles.protocolMeta}>Entity: {entry.entity_id}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function ImportReviewPanel({ jobId }: Props) {
  const styles = useStyles();

  const [job, setJob] = useState<ImportJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadJob() {
      if (!jobId) {
        setJob(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await getImportJob(jobId)
        if (!cancelled) {
          setJob(response)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Import-Job konnte nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadJob()

    return () => {
      cancelled = true
    }
  }, [jobId])

  const importAsset = job?.import_asset ?? null
  const protocol = useMemo(() => normalizeProtocol(job), [job])
  const grouped = useMemo(() => groupProtocolEntries(protocol), [protocol])
  const mappingState = useMemo(() => getMappingState(job, importAsset), [job, importAsset])

  return (
    <section className={styles.panel} aria-live="polite">
      <div className={styles.header}>
        <h3 className={styles.title}>Import Review</h3>
        <span className={styles.jobId}>Job: {jobId}</span>
      </div>

      {loading && <p className={styles.meta}>Lade Import-Job…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {job && (
        <>
          <div className={styles.metaGrid}>
            <p className={styles.metaItem}><strong>Datei:</strong> {job.source_filename}</p>
            <p className={styles.metaItem}><strong>Format:</strong> {job.source_format}</p>
            <p className={styles.metaItem}><strong>Status:</strong> {job.status}</p>
            <p className={styles.metaItem}><strong>Units:</strong> {importAsset?.units ?? '—'}</p>
          </div>

          {job.error_message && <p className={styles.error}>{job.error_message}</p>}

          <div className={styles.groups}>
            {renderProtocolGroup('Imported', 'imported', grouped.imported, styles)}
            {renderProtocolGroup('Ignored', 'ignored', grouped.ignored, styles)}
            {renderProtocolGroup('Needs review', 'needs_review', grouped.needs_review, styles)}
          </div>

          {mappingState?.layers && (
            <section className={styles.mappingSection}>
              <h4 className={styles.groupTitle}>Layer-Mapping</h4>
              <ul className={styles.mappingList}>
                {Object.entries(mappingState.layers).map(([layerName, mapping]) => (
                  <li key={layerName} className={styles.mappingItem}>
                    <span className={styles.mappingKey}>{layerName}</span>
                    <span className={`${styles.mappingValue} ${statusClassName(mapping.action, styles)}`}>{mapping.action}</span>
                    {mapping.reason && <span className={styles.mappingReason}>{mapping.reason}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {mappingState?.components && (
            <section className={styles.mappingSection}>
              <h4 className={styles.groupTitle}>Komponenten-Mapping</h4>
              <ul className={styles.mappingList}>
                {Object.entries(mappingState.components).map(([componentId, mapping]) => (
                  <li key={componentId} className={styles.mappingItem}>
                    <span className={styles.mappingKey}>{componentId}</span>
                    <span className={styles.mappingValue}>{mapping.target_type}</span>
                    {mapping.label && <span className={styles.mappingReason}>{mapping.label}</span>}
                    {mapping.catalog_item_id && <span className={styles.mappingReason}>Catalog: {mapping.catalog_item_id}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  )
}

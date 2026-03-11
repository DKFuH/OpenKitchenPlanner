import { makeStyles, tokens } from '@fluentui/react-components'
import { useEffect, useMemo } from 'react'
import { useEditorDispatch } from '../state/EditorStateCore.js'

interface WallElevationEntry {
  wall_id: string
  wall_index: number
  wall_length_mm: number
  room_name: string
}

interface WallElevationPanelProps {
  selectedRoomId: string | null
  selectedRoomName: string | null
  selectedWallId: string | null
  selectedElevationWallIndex: number
  elevations: WallElevationEntry[]
  elevationLoading: boolean
  elevationSvg: string
  onSelectWallIndex: (index: number) => void
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr',
    flex: '1',
    minWidth: '0',
    minHeight: '0',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'grid',
    gap: tokens.spacingVerticalXS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: '1px solid ' + tokens.colorNeutralStroke1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  title: {
    margin: 0,
    fontSize: '0.82rem',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  meta: {
    fontSize: '0.72rem',
    color: tokens.colorNeutralForeground3,
  },
  contextBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalS}`,
    borderBottom: '1px solid ' + tokens.colorNeutralStroke2,
  },
  pill: {
    padding: `2px ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: '0.72rem',
    color: tokens.colorNeutralForeground2,
  },
  field: {
    display: 'grid',
    gap: '4px',
    fontSize: '0.72rem',
    color: tokens.colorNeutralForeground2,
  },
  select: {
    minWidth: '0',
    border: '1px solid ' + tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    padding: '6px 8px',
    fontSize: '0.78rem',
  },
  body: {
    minHeight: '0',
    overflow: 'auto',
    padding: tokens.spacingVerticalS,
  },
  hint: {
    margin: 0,
    fontSize: '0.78rem',
    color: tokens.colorNeutralForeground3,
  },
  svgViewport: {
    minHeight: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalS,
    overflow: 'auto',
    '& svg': {
      display: 'block',
      width: '100%',
      height: 'auto',
      maxWidth: '100%',
    },
  },
})

export function WallElevationPanel({
  selectedRoomId,
  selectedRoomName,
  selectedWallId,
  selectedElevationWallIndex,
  elevations,
  elevationLoading,
  elevationSvg,
  onSelectWallIndex,
}: WallElevationPanelProps) {
  const styles = useStyles()
  const dispatch = useEditorDispatch()
  const activeEntry = useMemo(() => (
    elevations.find((entry) => entry.wall_id === selectedWallId)
      ?? elevations.find((entry) => entry.wall_index === selectedElevationWallIndex)
      ?? elevations[0]
      ?? null
  ), [elevations, selectedElevationWallIndex, selectedWallId])

  const formatWallLabel = (entry: WallElevationEntry) => {
    const hasPlausibleLength = Number.isFinite(entry.wall_length_mm) && entry.wall_length_mm >= 10
    return hasPlausibleLength
      ? `${entry.room_name} | Wand ${entry.wall_index + 1} (${Math.round(entry.wall_length_mm)} mm)`
      : `${entry.room_name} | Wand ${entry.wall_index + 1}`
  }

  useEffect(() => {
    if (!selectedRoomId || !activeEntry) {
      return
    }

    if (selectedElevationWallIndex !== activeEntry.wall_index) {
      onSelectWallIndex(activeEntry.wall_index)
    }

    if (selectedWallId !== activeEntry.wall_id) {
      dispatch({ id: 'select.wall', roomId: selectedRoomId, wallId: activeEntry.wall_id })
    }
  }, [activeEntry, dispatch, onSelectWallIndex, selectedElevationWallIndex, selectedRoomId, selectedWallId])

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Wandansicht</h3>
          <span className={styles.meta}>{elevations.length} Waende</span>
        </div>
        <label className={styles.field}>
          Gewaehlte Wand
          <select
            className={styles.select}
            value={selectedElevationWallIndex}
            onChange={(event) => {
              const wallIndex = Number(event.target.value)
              const nextEntry = elevations.find((entry) => entry.wall_index === wallIndex) ?? null
              onSelectWallIndex(wallIndex)
              if (selectedRoomId && nextEntry) {
                dispatch({ id: 'select.wall', roomId: selectedRoomId, wallId: nextEntry.wall_id })
              }
            }}
            disabled={elevations.length === 0}
          >
            {elevations.map((entry) => (
              <option key={entry.wall_id} value={entry.wall_index}>
                {formatWallLabel(entry)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.contextBar}>
        <span className={styles.pill}>Raum: {selectedRoomName ?? '-'}</span>
        <span className={styles.pill}>Wand-ID: {selectedWallId ?? '-'}</span>
        <span className={styles.pill}>
          Aktiv: {activeEntry ? `Wand ${activeEntry.wall_index + 1}` : '-'}
        </span>
      </div>

      <div className={styles.body}>
        {!selectedRoomId && <p className={styles.hint}>Bitte zuerst einen Raum auswaehlen.</p>}
        {selectedRoomId && elevations.length === 0 && (
          <p className={styles.hint}>Keine Wanddaten fuer die aktuelle Ansicht verfuegbar.</p>
        )}
        {selectedRoomId && elevationLoading && (
          <p className={styles.hint}>Elevation wird geladen...</p>
        )}
        {selectedRoomId && !elevationLoading && elevations.length > 0 && elevationSvg.length === 0 && (
          <p className={styles.hint}>Wandansicht konnte fuer die aktuelle Wand nicht geladen werden.</p>
        )}
        {selectedRoomId && !elevationLoading && elevationSvg.length > 0 && (
          <div className={styles.svgViewport} dangerouslySetInnerHTML={{ __html: elevationSvg }} />
        )}
      </div>
    </section>
  )
}

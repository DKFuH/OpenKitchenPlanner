import type { ProjectDetail, Room } from '../../api/projects.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0 1rem',
    height: '32px',
    background: tokens.colorNeutralForeground1,
    color: tokens.colorNeutralForegroundInverted,
    fontSize: '0.8rem',
    flexShrink: '0',
  },
  right: {
    marginLeft: 'auto',
  },
})

interface Props {
  project: ProjectDetail
  selectedRoom: Room | null
}

export function StatusBar({
project, selectedRoom }: Props) {
  const styles = useStyles();

  const totalRooms = project.rooms.length
  const totalPlacements = project.rooms.reduce(
    (sum, r) => sum + (r.placements as unknown[]).length,
    0,
  )

  return (
    <footer className={styles.bar}>
      <span>{totalRooms} Räume · {totalPlacements} Möbel</span>
      {selectedRoom && (
        <span>Aktiv: <strong>{selectedRoom.name}</strong></span>
      )}
      <span className={styles.right}>Gesamtpreis: — (Sprint 12)</span>
    </footer>
  )
}

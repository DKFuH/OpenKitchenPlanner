import { Button, Input, Popover, PopoverSurface, PopoverTrigger, makeStyles, tokens } from '@fluentui/react-components'
import { useState, type FormEvent } from 'react'
import type { BuildingLevel } from '../../api/levels.js'
import type { Room } from '../../api/projects.js'
import { LevelsPanel } from '../../components/editor/LevelsPanel.js'

const useStyles = makeStyles({
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  trigger: {
    minWidth: 'unset',
  },
  meta: {
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
  },
  surface: {
    width: '420px',
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: '70vh',
    overflowY: 'auto',
    padding: 0,
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    '@media (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
  rooms: {
    padding: '0.75rem',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    '@media (max-width: 720px)': {
      borderLeft: 'none',
      borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    },
  },
  title: {
    margin: '0 0 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.05em',
  },
  roomList: {
    display: 'grid',
    gap: '0.35rem',
    marginBottom: '0.5rem',
  },
  roomButton: {
    justifyContent: 'flex-start',
  },
  addForm: {
    display: 'grid',
    gap: tokens.spacingVerticalXS,
  },
  addActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
})

interface EditorStructurePopoverProps {
  levels: BuildingLevel[]
  activeLevelId: string | null
  onSelectLevel: (id: string) => void
  onToggleLevelVisibility: (level: BuildingLevel) => void
  onCreateLevel: (payload: { name: string; elevation_mm: number }) => void
  rooms: Room[]
  selectedRoomId: string | null
  onSelectRoom: (id: string) => void
  onAddRoom: (name: string) => void
}

export function EditorStructurePopover({
  levels,
  activeLevelId,
  onSelectLevel,
  onToggleLevelVisibility,
  onCreateLevel,
  rooms,
  selectedRoomId,
  onSelectRoom,
  onAddRoom,
}: EditorStructurePopoverProps) {
  const styles = useStyles()
  const [newRoomName, setNewRoomName] = useState('')

  return (
    <div className={styles.bar}>
      <Popover positioning='below-start'>
        <PopoverTrigger disableButtonEnhancement>
          <Button appearance='subtle' size='small' className={styles.trigger}>
            Struktur
          </Button>
        </PopoverTrigger>
        <PopoverSurface className={styles.surface}>
          <div className={styles.content}>
            <LevelsPanel
              levels={levels}
              activeLevelId={activeLevelId}
              onSelectLevel={onSelectLevel}
              onToggleVisibility={onToggleLevelVisibility}
              onCreateLevel={onCreateLevel}
            />
            <section className={styles.rooms}>
              <h3 className={styles.title}>Raeume</h3>
              <div className={styles.roomList}>
                {rooms.map((room) => (
                  <Button
                    key={room.id}
                    appearance={room.id === selectedRoomId ? 'primary' : 'subtle'}
                    size='small'
                    className={styles.roomButton}
                    onClick={() => onSelectRoom(room.id)}
                  >
                    {room.name}
                  </Button>
                ))}
              </div>
              <form
                className={styles.addForm}
                onSubmit={(event: FormEvent) => {
                  event.preventDefault()
                  const trimmed = newRoomName.trim()
                  if (!trimmed) {
                    return
                  }
                  onAddRoom(trimmed)
                  setNewRoomName('')
                }}
              >
                <Input
                  size='small'
                  placeholder='Neuer Raum'
                  value={newRoomName}
                  onChange={(_event, data) => setNewRoomName(data.value)}
                />
                <div className={styles.addActions}>
                  <Button type='submit' appearance='primary' size='small'>
                    Raum anlegen
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </PopoverSurface>
      </Popover>
      <span className={styles.meta}>
        {levels.length} Ebenen | {rooms.length} Raeume
      </span>
    </div>
  )
}

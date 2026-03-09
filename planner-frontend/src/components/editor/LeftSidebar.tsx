import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Room } from '../../api/projects.js'
import type { PluginSlotEntry } from '../../plugins/pluginUiContract.js'
import { McpQuickActions } from '../mcp/McpQuickActions.js'
import { makeStyles, tokens } from '@fluentui/react-components'

interface Props {
  levelsPanel?: ReactNode
  projectId: string | null
  rooms: Room[]
  selectedRoomId: string | null
  onSelectRoom: (id: string) => void
  onAddRoom: (name: string) => void
  pluginSlotEntries?: PluginSlotEntry[]
  onNavigateToPath?: (path: string) => void
}

const useStyles = makeStyles({
  sidebar: {
    width: '220px',
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: '1px solid ' + tokens.colorNeutralStroke1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    padding: tokens.spacingVerticalS,
    borderBottom: '1px solid ' + tokens.colorNeutralStroke2,
  },
  sectionTitle: {
    margin: '0',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.05em',
  },
  list: {
    listStyle: 'none',
    margin: '0 0 4px',
    padding: '0',
  },
  item: {
    padding: '4px 8px',
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: tokens.colorNeutralForeground1,
  },
  active: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: '600',
  },
  pluginSlotList: {
    listStyle: 'none',
    margin: '0',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  pluginSlotButton: {
    width: '100%',
    textAlign: 'left',
    border: '1px solid ' + tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.76rem',
    padding: '4px 6px',
    cursor: 'pointer',
  },
  mcpPanel: {
    marginTop: tokens.spacingVerticalS,
    display: 'grid',
    gap: tokens.spacingVerticalXS,
  },
  empty: {
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
    margin: '0 0 4px',
  },
  addBtn: {
    width: '100%',
    background: 'none',
    border: '1px dashed ' + tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalXS,
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
  },
  addRoomForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalXXS,
  },
  addRoomInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '2px 8px',
    border: '1px solid ' + tokens.colorBrandStroke1,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: '0.85rem',
    backgroundColor: tokens.colorNeutralBackground1,
    outline: 'none',
  },
  addRoomActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid ' + tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusSmall,
    padding: '2px 8px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground3,
  },
})

export function LeftSidebar({
  levelsPanel,
  projectId,
  rooms,
  selectedRoomId,
  onSelectRoom,
  onAddRoom,
  pluginSlotEntries = [],
  onNavigateToPath,
}: Props) {
  const styles = useStyles()
  const { t } = useTranslation()
  const [addingRoom, setAddingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  return (
    <aside className={styles.sidebar}>
      {levelsPanel}

      {(pluginSlotEntries.length > 0 || onNavigateToPath) && (
        <div className={styles.section}>
          {pluginSlotEntries.length > 0 && (
            <>
              <h3 className={styles.sectionTitle}>Plugin-Slots</h3>
              <ul className={styles.pluginSlotList}>
                {pluginSlotEntries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={styles.pluginSlotButton}
                      data-testid={`sidebar-plugin-slot-${entry.pluginId ?? entry.id}`}
                      disabled={!entry.enabled}
                      title={entry.reasonIfDisabled ? t(entry.reasonIfDisabled) : undefined}
                      onClick={() => {
                        if (!entry.enabled || !onNavigateToPath) {
                          return
                        }
                        onNavigateToPath(entry.path)
                      }}
                    >
                      {entry.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {onNavigateToPath && (
            <div className={styles.mcpPanel}>
              <h3 className={styles.sectionTitle}>MCP</h3>
              <McpQuickActions
                projectId={projectId}
                onNavigate={onNavigateToPath}
                variant='panel'
                testIdPrefix='sidebar'
              />
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Raume</h3>
        {rooms.length === 0 ? (
          <p className={styles.empty}>Noch kein Raum</p>
        ) : (
          <ul className={styles.list}>
            {rooms.map(r => (
              <li
                key={r.id}
                className={`${styles.item} ${r.id === selectedRoomId ? styles.active : ''}`}
                onClick={() => onSelectRoom(r.id)}
              >
                {r.name}
              </li>
            ))}
          </ul>
        )}

        {addingRoom ? (
          <form
            className={styles.addRoomForm}
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              const name = newRoomName.trim()
              if (!name) return
              onAddRoom(name)
              setNewRoomName('')
              setAddingRoom(false)
            }}
          >
            <input
              autoFocus
              type="text"
              className={styles.addRoomInput}
              placeholder="Raumname"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
            />
            <div className={styles.addRoomActions}>
              <button type="submit" className={styles.addBtn}>Anlegen</button>
              <button type="button" className={styles.cancelBtn} onClick={() => { setAddingRoom(false); setNewRoomName('') }}>x</button>
            </div>
          </form>
        ) : (
          <button type="button" className={styles.addBtn} onClick={() => setAddingRoom(true)}>+ Raum hinzufugen</button>
        )}
      </div>
    </aside>
  )
}

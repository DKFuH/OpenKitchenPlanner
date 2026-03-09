import { useMemo, useState } from 'react'
import type {
  DrawingGroup,
  DrawingGroupConfigPatch,
  DrawingGroupKind,
  DrawingGroupMember,
} from '../../api/drawingGroups.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  section: {
    padding: '0.75rem',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  sectionTitle: {
    margin: '0 0 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.05em',
  },
  empty: {
    margin: '0',
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground3,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    marginBottom: '0.5rem',
  },
  fieldLabel: {
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground3,
  },
  fieldInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.3rem 0.5rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: '0.85rem',
    background: tokens.colorNeutralBackground1,
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  select: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.3rem 0.5rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: '0.85rem',
    background: tokens.colorNeutralBackground1,
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorStrokeFocus2}`,
      border: `1px solid ${tokens.colorBrandForeground1}`,
    },
  },
  row: {
    display: 'flex',
    gap: '0.35rem',
    '& > *': {
      flex: '1',
    },
  },
  primaryBtn: {
    width: '100%',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorBrandForeground1}`,
    background: tokens.colorBrandBackground2,
    color: tokens.colorNeutralForeground1,
    padding: '0.34rem 0.5rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  ghostBtn: {
    width: '100%',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    padding: '0.34rem 0.5rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  dangerBtn: {
    width: '100%',
    borderRadius: tokens.borderRadiusSmall,
    border: '1px solid var(--status-danger-border)',
    background: tokens.colorNeutralBackground1,
    color: tokens.colorPaletteRedForeground1,
    padding: '0.34rem 0.5rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  list: {
    margin: '0.6rem 0 0',
    padding: '0',
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  item: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0.35rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  itemActive: {
    background: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandForeground1}`,
  },
  itemMeta: {
    flex: '1',
    minWidth: '0',
  },
  itemName: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemHint: {
    display: 'block',
    fontSize: '0.7rem',
    color: tokens.colorNeutralForeground3,
  },
  subTitle: {
    margin: '0.75rem 0 0.5rem',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground3,
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: tokens.colorNeutralForeground1,
    marginBottom: '0.4rem',
  },
})

type Props = {
  groups: DrawingGroup[]
  selectedGroupId: string | null
  selectionMembers: DrawingGroupMember[]
  onSelectGroup: (groupId: string | null) => void
  onCreateGroup: (payload: {
    name: string
    kind: DrawingGroupKind
    members_json: DrawingGroupMember[]
  }) => void
  onDeleteGroup: (groupId: string) => void
  onApplyTransform: (groupId: string, payload: {
    translate?: { x_mm: number; y_mm: number }
    rotation_deg?: number
  }) => void
  onSyncConfig: (groupId: string, config: DrawingGroupConfigPatch) => void
}

export function GroupsPanel({
groups,
  selectedGroupId,
  selectionMembers,
  onSelectGroup,
  onCreateGroup,
  onDeleteGroup,
  onApplyTransform,
  onSyncConfig,
}: Props) {
  const styles = useStyles();

  const [groupName, setGroupName] = useState('Neue Gruppe')
  const [groupKind, setGroupKind] = useState<DrawingGroupKind>('selection_set')
  const [dx, setDx] = useState('0')
  const [dy, setDy] = useState('0')
  const [rotationDeg, setRotationDeg] = useState('0')
  const [visible, setVisible] = useState(true)
  const [locked, setLocked] = useState(false)

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  )

  const canCreate = selectionMembers.length > 0 && groupName.trim().length > 0

  const handleCreate = () => {
    if (!canCreate) {
      return
    }

    onCreateGroup({
      name: groupName.trim(),
      kind: groupKind,
      members_json: selectionMembers,
    })
  }

  const handleApplyTransform = () => {
    if (!selectedGroup) {
      return
    }

    const translateX = Number(dx)
    const translateY = Number(dy)
    const rotate = Number(rotationDeg)

    const payload: { translate?: { x_mm: number; y_mm: number }; rotation_deg?: number } = {}
    if (Number.isFinite(translateX) || Number.isFinite(translateY)) {
      payload.translate = {
        x_mm: Number.isFinite(translateX) ? translateX : 0,
        y_mm: Number.isFinite(translateY) ? translateY : 0,
      }
    }
    if (Number.isFinite(rotate)) {
      payload.rotation_deg = rotate
    }

    onApplyTransform(selectedGroup.id, payload)
  }

  const handleSyncConfig = () => {
    if (!selectedGroup) {
      return
    }

    onSyncConfig(selectedGroup.id, {
      visible,
      locked,
      lock_scope: locked ? 'manual' : null,
    })
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Gruppen & Auswahlsets</h3>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="group-name">Name</label>
        <input
          id="group-name"
          className={styles.fieldInput}
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="group-kind">Typ</label>
        <select
          id="group-kind"
          className={styles.select}
          value={groupKind}
          onChange={(event) => setGroupKind(event.target.value as DrawingGroupKind)}
        >
          <option value="selection_set">Auswahlset</option>
          <option value="drawing_group">Zeichnungsgruppe</option>
          <option value="component">Komponente</option>
          <option value="annotation_group">Annotationsgruppe</option>
        </select>
      </div>

      <button
        type="button"
        className={styles.primaryBtn}
        onClick={handleCreate}
        disabled={!canCreate}
      >
        Auswahl speichern ({selectionMembers.length})
      </button>

      {groups.length === 0 ? (
        <p className={styles.empty}>Noch keine Gruppen vorhanden.</p>
      ) : (
        <ul className={styles.list}>
          {groups.map((group) => {
            const isActive = group.id === selectedGroupId
            const members = Array.isArray(group.members_json) ? group.members_json.length : 0

            return (
              <li key={group.id} className={`${styles.item} ${isActive ? styles.itemActive : ''}`}>
                <input
                  type="radio"
                  checked={isActive}
                  onChange={() => onSelectGroup(group.id)}
                  aria-label={`Gruppe ${group.name} auswählen`}
                />
                <div className={styles.itemMeta}>
                  <span className={styles.itemName}>{group.name}</span>
                  <span className={styles.itemHint}>{group.kind} · {members} Mitglieder</span>
                </div>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={() => onDeleteGroup(group.id)}
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {selectedGroup && (
        <>
          <h4 className={styles.subTitle}>Transformieren</h4>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="group-dx">ΔX mm</label>
              <input
                id="group-dx"
                className={styles.fieldInput}
                value={dx}
                onChange={(event) => setDx(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="group-dy">ΔY mm</label>
              <input
                id="group-dy"
                className={styles.fieldInput}
                value={dy}
                onChange={(event) => setDy(event.target.value)}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="group-rot">Rotation °</label>
            <input
              id="group-rot"
              className={styles.fieldInput}
              value={rotationDeg}
              onChange={(event) => setRotationDeg(event.target.value)}
            />
          </div>
          <button type="button" className={styles.ghostBtn} onClick={handleApplyTransform}>
            Transform anwenden
          </button>

          <h4 className={styles.subTitle}>Lock / Visibility</h4>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
            />
            Sichtbar
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={locked}
              onChange={(event) => setLocked(event.target.checked)}
            />
            Gesperrt
          </label>
          <button type="button" className={styles.ghostBtn} onClick={handleSyncConfig}>
            Auf Mitglieder anwenden
          </button>

          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => onSelectGroup(selectedGroup.id)}
          >
            Auswahl wiederherstellen
          </button>
        </>
      )}
    </section>
  )
}

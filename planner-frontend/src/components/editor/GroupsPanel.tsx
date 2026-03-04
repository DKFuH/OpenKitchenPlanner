import { useMemo, useState } from 'react'
import type {
  DrawingGroup,
  DrawingGroupConfigPatch,
  DrawingGroupKind,
  DrawingGroupMember,
} from '../../api/drawingGroups.js'
import styles from './GroupsPanel.module.css'

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

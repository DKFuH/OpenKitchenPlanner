import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, makeStyles, tokens } from '@fluentui/react-components'
import type { Opening } from '../../api/openings.js'

const useStyles = makeStyles({
  surface: { maxWidth: '720px', width: 'calc(100vw - 48px)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', '& th': { textAlign: 'left', padding: '10px', borderBottom: `1px solid ${tokens.colorNeutralStroke1}` }, '& td': { padding: '10px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` } },
  color: { width: '52px', height: '30px', padding: '2px', cursor: 'pointer', border: `1px solid ${tokens.colorNeutralStroke1}`, background: tokens.colorNeutralBackground1 },
  meta: { color: tokens.colorNeutralForeground3, fontSize: '12px' },
})

const SLOTS = [
  { key: 'frame_color', label: 'Rahmen / Zarge', color: '#f1f5f9' },
  { key: 'leaf_color', label: 'Türblatt / Füllung', color: '#decbaa' },
  { key: 'glass_color', label: 'Verglasung', color: '#b9dce8' },
] as const

export function OpeningMaterialsDialog({ opening, onApply, onClose }: {
  opening: Opening
  onApply: (materials: NonNullable<Opening['materials']>) => void
  onClose: () => void
}) {
  const styles = useStyles()
  const [draft, setDraft] = useState(opening.materials ?? {})
  return (
    <Dialog open onOpenChange={(_event, data) => { if (!data.open) onClose() }}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Material der Oberfläche zuordnen</DialogTitle>
          <DialogContent>
            <p>{opening.type === 'window' ? 'Fenster' : 'Tür'} · {opening.variant ?? 'Freie Vorlage'}</p>
            <table className={styles.table}>
              <thead><tr><th>Oberfläche</th><th>Material</th><th>Farbe</th><th>Status</th></tr></thead>
              <tbody>{SLOTS.filter(slot => opening.type !== 'window' || slot.key !== 'leaf_color').map(slot => (
                <tr key={slot.key}>
                  <td>{slot.label}</td><td>Reine Farbe</td>
                  <td>
                    <input aria-label={`Farbe ${slot.label}`} type="color" className={styles.color} value={draft[slot.key] ?? slot.color} onChange={event => setDraft(previous => ({ ...previous, [slot.key]: event.target.value }))} />
                    <input aria-label={`Farbwert ${slot.label}`} value={draft[slot.key] ?? slot.color} maxLength={7} onChange={event => { if (/^#[0-9a-fA-F]{6}$/.test(event.target.value)) setDraft(previous => ({ ...previous, [slot.key]: event.target.value })) }} />
                  </td>
                  <td>{draft[slot.key] ? 'Benutzerdefiniert' : 'Standard'}</td>
                </tr>
              ))}</tbody>
            </table>
            <p className={styles.meta}>Die Zuordnung wird mit dem Objekt gespeichert und in der 3D-Ansicht angewendet.</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDraft({})}>Standard</Button>
            <Button onClick={onClose}>Abbrechen</Button>
            <Button appearance="primary" onClick={() => { onApply(draft); onClose() }}>Übernehmen</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

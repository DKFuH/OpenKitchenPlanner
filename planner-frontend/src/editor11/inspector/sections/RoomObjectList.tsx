import { Button, makeStyles, tokens } from '@fluentui/react-components'
import type { Opening } from '../../../api/openings.js'
import type { Placement } from '../../../api/placements.js'
import { useEditorStateCore } from '../../state/EditorStateCore.js'

const useStyles = makeStyles({
  list: { display: 'grid', gap: tokens.spacingVerticalXS },
  item: { justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', fontSize: '0.75rem' },
})

export function RoomObjectList({ roomId, openings, placements }: {
  roomId: string | null
  openings: Opening[]
  placements: Placement[]
}) {
  const styles = useStyles()
  const { snapshot, dispatch } = useEditorStateCore()
  if (!roomId || openings.length + placements.length === 0) return null

  return (
    <div className={styles.list} aria-label="Objekte im Raum">
      {placements.map((placement) => (
        <Button
          key={placement.id}
          className={styles.item}
          appearance={snapshot.selection.kind === 'placement' && snapshot.selection.placementId === placement.id ? 'primary' : 'subtle'}
          onClick={() => dispatch({ id: 'select.placement', roomId, placementId: placement.id })}
        >
          {placement.description ?? 'Möbel'} · {placement.width_mm} × {placement.depth_mm} mm
        </Button>
      ))}
      {openings.map((opening) => (
        <Button
          key={opening.id}
          className={styles.item}
          appearance={snapshot.selection.kind === 'opening' && snapshot.selection.openingId === opening.id ? 'primary' : 'subtle'}
          onClick={() => dispatch({ id: 'select.opening', roomId, openingId: opening.id })}
        >
          {opening.type === 'window' ? 'Fenster' : opening.type === 'door' ? 'Tür' : 'Öffnung'} · {opening.variant ?? 'Frei'} · {opening.width_mm} mm
        </Button>
      ))}
    </div>
  )
}

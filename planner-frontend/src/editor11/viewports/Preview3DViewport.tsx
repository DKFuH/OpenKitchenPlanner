import { makeStyles, tokens } from '@fluentui/react-components'
import type { ReactNode } from 'react'
import { useEditor3DOverlays } from '../plugins/EditorPluginHost.js'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    flex: '1',
    minWidth: '0',
    minHeight: '0',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  content: {
    display: 'flex',
    flex: '1',
    minWidth: '0',
    minHeight: '0',
  },
  overlayLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  overlayEntry: {
    position: 'absolute',
    inset: 0,
  },
})

export function Preview3DViewport({ children }: { children: ReactNode }) {
  const styles = useStyles()
  const overlays = useEditor3DOverlays()

  return (
    <div className={styles.root}>
      <div className={styles.content}>{children}</div>
      {overlays.length > 0 && (
        <div className={styles.overlayLayer}>
          {overlays.map((entry) => (
            <div key={entry.id} className={styles.overlayEntry}>
              {entry.render()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

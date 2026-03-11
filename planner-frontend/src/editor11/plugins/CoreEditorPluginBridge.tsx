import { makeStyles, tokens } from '@fluentui/react-components'
import { useEditorSnapshot } from '../state/EditorStateCore.js'
import type { EditorPluginDefinition } from './EditorPluginContract.js'

const useStyles = makeStyles({
  viewportBadge: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    left: tokens.spacingHorizontalS,
    display: 'inline-flex',
    alignItems: 'center',
    padding: `2px ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    color: tokens.colorNeutralForegroundInverted,
    fontSize: '0.68rem',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    maxWidth: 'calc(100% - 16px)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
})

function ViewportStatusOverlay({ title }: { title: string }) {
  const styles = useStyles()
  useEditorSnapshot()

  return (
    <div className={styles.viewportBadge}>
      {title}
    </div>
  )
}

export const coreEditorPlugin: EditorPluginDefinition = {
  id: 'core.workspace',
  title: 'Core Workspace',
  activate: (host) => {
    const disposers = [
      host.overlays2d.register({
        id: 'core-plan-overlay',
        render: () => <ViewportStatusOverlay title='2D' />,
      }),
      host.overlays3d.register({
        id: 'core-3d-overlay',
        render: () => <ViewportStatusOverlay title='3D' />,
      }),
      host.wallOverlays.register({
        id: 'core-wall-overlay',
        render: () => <ViewportStatusOverlay title='Wandansicht' />,
      }),
    ]

    return () => {
      disposers.forEach((dispose) => dispose())
    }
  },
}

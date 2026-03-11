import { makeStyles, tokens } from '@fluentui/react-components'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useEditorToolbarActions } from '../plugins/EditorPluginHost.js'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    flex: '1',
    width: '100%',
    minHeight: '0',
    overflow: 'hidden',
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM}`,
    borderBottom: '1px solid ' + tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '36px',
    overflow: 'hidden',
  },
  body: {
    position: 'relative',
    display: 'flex',
    flex: '1',
    minWidth: '0',
    minHeight: '0',
    overflow: 'hidden',
  },
  bodyWithInspector: {
    paddingRight: '232px',
  },
  toolbarTitle: {
    flex: '0 0 auto',
    fontSize: '0.67rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: tokens.colorNeutralForeground3,
  },
  toolbarScroller: {
    display: 'flex',
    flex: '1 1 auto',
    minWidth: '0',
    overflowX: 'auto',
    overflowY: 'hidden',
    justifyContent: 'flex-end',
    scrollbarWidth: 'thin',
  },
  toolbarActions: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: '4px',
    whiteSpace: 'nowrap',
    paddingBottom: '1px',
  },
  toolbarButton: {
    border: '1px solid ' + tokens.colorNeutralStroke1,
    borderRadius: '999px',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '0.7rem',
    lineHeight: '1.1',
    padding: '3px 7px',
    cursor: 'pointer',
    flex: '0 0 auto',
  },
  center: {
    display: 'flex',
    flex: '1',
    minWidth: '0',
    minHeight: '0',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralStroke2,
  },
  inspectorDock: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    minHeight: '0',
  },
  singleFocusLayout: {
    display: 'flex',
    flex: '1',
    minWidth: '0',
    minHeight: '0',
  },
  focusPane: {
    display: 'flex',
    flex: '1',
    minWidth: '0',
    minHeight: '0',
  },
  tripleLayout: {
    display: 'flex',
    flex: '1',
    minWidth: '0',
    minHeight: '0',
  },
  planPane: {
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
    flex: '0 0 auto',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minWidth: '0',
    minHeight: '0',
  },
  previewPane: {
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
    flex: '0 0 auto',
  },
  wallPane: {
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
    flex: '1 1 auto',
  },
  dividerVertical: {
    width: '8px',
    cursor: 'col-resize',
    flex: '0 0 8px',
    backgroundImage:
      'linear-gradient(to right, transparent 0, transparent 3px, '
      + tokens.colorNeutralStroke1
      + ' 3px, '
      + tokens.colorNeutralStroke1
      + ' 5px, transparent 5px, transparent 100%)',
    ':hover': {
      backgroundImage:
        'linear-gradient(to right, transparent 0, transparent 2px, '
        + tokens.colorBrandBackground
        + ' 2px, '
        + tokens.colorBrandBackground
        + ' 6px, transparent 6px, transparent 100%)',
    },
  },
  dividerHorizontal: {
    height: '8px',
    cursor: 'row-resize',
    flex: '0 0 8px',
    backgroundImage:
      'linear-gradient(to bottom, transparent 0, transparent 3px, '
      + tokens.colorNeutralStroke1
      + ' 3px, '
      + tokens.colorNeutralStroke1
      + ' 5px, transparent 5px, transparent 100%)',
    ':hover': {
      backgroundImage:
        'linear-gradient(to bottom, transparent 0, transparent 2px, '
        + tokens.colorBrandBackground
        + ' 2px, '
        + tokens.colorBrandBackground
        + ' 6px, transparent 6px, transparent 100%)',
    },
  },
})

interface EditorShellProps {
  leftSidebar?: ReactNode
  plan2d: ReactNode
  preview3d: ReactNode
  wallView: ReactNode
  layout: 'triple' | 'focus-2d' | 'focus-3d' | 'focus-wall'
  inspector?: ReactNode
  inspectorOpen: boolean
  primaryRatio: number
  secondaryRatio: number
  onPrimaryRatioChange: (ratio: number) => void
  onSecondaryRatioChange: (ratio: number) => void
}

type DragMode = 'primary' | 'secondary' | null

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function EditorShell({
  leftSidebar,
  plan2d,
  preview3d,
  wallView,
  layout,
  inspector,
  inspectorOpen,
  primaryRatio,
  secondaryRatio,
  onPrimaryRatioChange,
  onSecondaryRatioChange,
}: EditorShellProps) {
  const styles = useStyles()
  const toolbarActions = useEditorToolbarActions()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rightColumnRef = useRef<HTMLDivElement | null>(null)
  const [dragMode, setDragMode] = useState<DragMode>(null)

  useEffect(() => {
    if (!dragMode) {
      return
    }

    const handlePointerMove = (event: MouseEvent) => {
      if (dragMode === 'primary') {
        const host = hostRef.current
        if (!host) {
          return
        }
        const rect = host.getBoundingClientRect()
        onPrimaryRatioChange(clamp(((event.clientX - rect.left) / rect.width) * 100, 35, 72))
        return
      }

      const rightColumn = rightColumnRef.current
      if (!rightColumn) {
        return
      }
      const rect = rightColumn.getBoundingClientRect()
      onSecondaryRatioChange(clamp(((event.clientY - rect.top) / rect.height) * 100, 25, 75))
    }

    const handlePointerUp = () => setDragMode(null)

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
    }
  }, [dragMode, onPrimaryRatioChange, onSecondaryRatioChange])

  const workspace =
    layout === 'focus-2d' ? (
      <div className={styles.singleFocusLayout}>
        <div className={styles.focusPane}>{plan2d}</div>
      </div>
    ) : layout === 'focus-3d' ? (
      <div className={styles.singleFocusLayout}>
        <div className={styles.focusPane}>{preview3d}</div>
      </div>
    ) : layout === 'focus-wall' ? (
      <div className={styles.singleFocusLayout}>
        <div className={styles.focusPane}>{wallView}</div>
      </div>
    ) : (
      <div className={styles.tripleLayout}>
        <div className={styles.planPane} style={{ flexBasis: `calc(${primaryRatio}% - 4px)` }}>
          {plan2d}
        </div>
        <div
          className={styles.dividerVertical}
          role='separator'
          aria-orientation='vertical'
          aria-label='Editor-Arbeitsflaechen horizontal verschieben'
          onMouseDown={() => setDragMode('primary')}
        />
        <div className={styles.rightColumn} ref={rightColumnRef}>
          <div className={styles.previewPane} style={{ flexBasis: `calc(${secondaryRatio}% - 4px)` }}>
            {preview3d}
          </div>
          <div
            className={styles.dividerHorizontal}
            role='separator'
            aria-orientation='horizontal'
            aria-label='3D und Wandansicht vertikal verschieben'
            onMouseDown={() => setDragMode('secondary')}
          />
          <div className={styles.wallPane}>{wallView}</div>
        </div>
      </div>
    )

  return (
    <section className={styles.root}>
      {toolbarActions.length > 0 ? (
        <div className={styles.toolbarRow}>
          <span className={styles.toolbarTitle}>Ansicht</span>
          <div className={styles.toolbarScroller}>
            <div className={styles.toolbarActions}>
              {toolbarActions.map((action) => (
                <button
                  key={action.id}
                  type='button'
                  className={styles.toolbarButton}
                  onClick={action.run}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <div className={`${styles.body} ${inspectorOpen ? styles.bodyWithInspector : ''}`}>
        {leftSidebar}
        <div className={styles.center} ref={hostRef}>
          {workspace}
        </div>
        {inspectorOpen ? <div className={styles.inspectorDock}>{inspector}</div> : null}
      </div>
    </section>
  )
}

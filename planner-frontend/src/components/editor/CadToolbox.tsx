import {
  Badge,
  Body1Strong,
  Button,
  Switch,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import type { EditorActionStates, ResolvedActionState } from '../../editor/actionStateResolver.js'
import type { EditorMode } from '../../editor/editorModeStore.js'
import type { EditorSettings } from '../../editor/usePolygonEditor.js'
import type { WorkflowStep } from '../../editor/workflowStateStore.js'

interface CadToolboxProps {
  mode: EditorMode
  onSetMode: (mode: EditorMode) => void
  workflowStep: WorkflowStep
  onSetWorkflowStep: (step: WorkflowStep) => void
  deleteVertexAction: ResolvedActionState
  selectedVertexIndex: number | null
  selectedEdgeIndex: number | null
  canAddPlacement: boolean
  onAddOpeningForSelectedEdge: () => void
  onAddPlacementForSelectedEdge: () => void
  onDeleteSelectedVertex: () => void
  safeEditMode: boolean
  onSetSafeEditMode: (next: boolean) => void
  editorSettings: Pick<EditorSettings, 'magnetismEnabled' | 'axisMagnetismEnabled' | 'angleSnap'>
  onUpdateEditorSettings: (settings: Partial<EditorSettings>) => void
  showAreasPanel: boolean
  onSetShowAreasPanel: (next: boolean) => void
  actionStates: Pick<EditorActionStates, 'toggleAreasPanel'>
}

const useStyles = makeStyles({
  root: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'thin',
    '@media (max-width: 900px)': {
      padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    },
  },
  row: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'nowrap',
    alignItems: 'center',
    minWidth: 'max-content',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalM,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    flex: '0 0 auto',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flex: '0 0 auto',
  },
  groupTitle: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: '4px',
    alignItems: 'center',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'nowrap',
  },
  compactButton: {
    minWidth: 'unset',
    whiteSpace: 'nowrap',
  },
  compactSwitch: {
    whiteSpace: 'nowrap',
  },
  disabledWrapper: {
    display: 'inline-flex',
  },
})

function ReasonedButton({
  label,
  active,
  action,
  onClick,
}: {
  label: string
  active?: boolean
  action: ResolvedActionState
  onClick: () => void
}) {
  const styles = useStyles()
  const button = (
    <Button
      size='small'
      appearance={active ? 'primary' : 'subtle'}
      className={styles.compactButton}
      disabled={!action.enabled}
      onClick={onClick}
    >
      {label}
    </Button>
  )

  if (action.enabled) {
    return button
  }

  return (
    <Tooltip content={action.reasonIfDisabled ?? 'Aktion nicht verfuegbar'} relationship='label'>
      <span className={styles.disabledWrapper}>{button}</span>
    </Tooltip>
  )
}

export function CadToolbox({
  mode,
  onSetMode,
  workflowStep,
  onSetWorkflowStep,
  deleteVertexAction,
  selectedVertexIndex,
  selectedEdgeIndex,
  onDeleteSelectedVertex,
  safeEditMode,
  onSetSafeEditMode,
}: CadToolboxProps) {
  const styles = useStyles()

  return (
    <section className={styles.root} aria-label='CAD Toolbox'>
      <div className={styles.row}>
        <div className={styles.group}>
          <div className={styles.groupHeader}>
            <Body1Strong className={styles.groupTitle}>Zeichnen</Body1Strong>
            <Badge appearance='tint'>{workflowStep}</Badge>
          </div>
          <div className={styles.buttonRow}>
            <Button className={styles.compactButton} size='small' appearance={workflowStep === 'walls' ? 'primary' : 'subtle'} onClick={() => onSetWorkflowStep('walls')}>Waende</Button>
            <Button className={styles.compactButton} size='small' appearance={workflowStep === 'openings' ? 'primary' : 'subtle'} onClick={() => onSetWorkflowStep('openings')}>Oeffnungen</Button>
            <Button className={styles.compactButton} size='small' appearance={workflowStep === 'furniture' ? 'primary' : 'subtle'} onClick={() => onSetWorkflowStep('furniture')}>Moebel</Button>
            <Button className={styles.compactButton} size='small' appearance={mode === 'wallCreate' ? 'primary' : 'subtle'} onClick={() => onSetMode('wallCreate')}>Wand</Button>
            <Button className={styles.compactButton} size='small' appearance={mode === 'roomCreate' ? 'primary' : 'subtle'} onClick={() => onSetMode('roomCreate')}>Raum</Button>
            <Button className={styles.compactButton} size='small' appearance={mode === 'polylineCreate' ? 'primary' : 'subtle'} onClick={() => onSetMode('polylineCreate')}>Polyline</Button>
            <Button className={styles.compactButton} size='small' appearance={mode === 'dimCreate' ? 'primary' : 'subtle'} onClick={() => onSetMode('dimCreate')}>Bemassung</Button>
            <Button className={styles.compactButton} size='small' appearance={mode === 'labelCreate' ? 'primary' : 'subtle'} onClick={() => onSetMode('labelCreate')}>Label</Button>
          </div>
        </div>

        <div className={styles.group}>
          <div className={styles.groupHeader}>
            <Body1Strong className={styles.groupTitle}>Bearbeiten</Body1Strong>
            <Badge appearance='outline'>
              {selectedVertexIndex !== null ? 'Punkt aktiv' : selectedEdgeIndex !== null ? 'Kante aktiv' : 'Keine Auswahl'}
            </Badge>
          </div>
          <div className={styles.buttonRow}>
            <Button className={styles.compactButton} size='small' appearance={mode === 'selection' ? 'primary' : 'subtle'} onClick={() => onSetMode('selection')}>Auswahl</Button>
            <Button className={styles.compactButton} size='small' appearance={mode === 'pan' ? 'primary' : 'subtle'} onClick={() => onSetMode('pan')}>Pan</Button>
            <Button className={styles.compactButton} size='small' appearance={mode === 'calibrate' ? 'primary' : 'subtle'} onClick={() => onSetMode('calibrate')}>Kalibrieren</Button>
            <ReasonedButton label='Punkt loeschen' action={deleteVertexAction} onClick={onDeleteSelectedVertex} />
            <Switch
              className={styles.compactSwitch}
              checked={safeEditMode}
              label='Safe Edit'
              onChange={(_event, data) => onSetSafeEditMode(Boolean(data.checked))}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

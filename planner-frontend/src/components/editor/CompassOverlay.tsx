import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  overlayWrap: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: 'rgba(255, 255, 255, 0.92)',
    boxShadow: tokens.shadow4,
    zIndex: '6',
    pointerEvents: 'none',
  },
  inlineWrap: {
    position: 'relative',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    flexShrink: 0,
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  ring: {
    fill: 'transparent',
    stroke: tokens.colorNeutralStroke2,
    strokeWidth: '1',
  },
  arrowLine: {
    stroke: tokens.colorNeutralForeground1,
    strokeWidth: '2.5',
    strokeLinecap: 'round',
  },
  arrowHead: {
    fill: tokens.colorNeutralForeground1,
  },
  label: {
    fontSize: '10px',
    fontWeight: '700',
    fill: tokens.colorNeutralForeground1,
  },
  overlayDeg: {
    position: 'absolute',
    bottom: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '9px',
    color: tokens.colorNeutralForeground3,
  },
  inlineDeg: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    minWidth: '36px',
    textAlign: 'right',
  },
  inlineMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
})

interface Props {
  northAngleDeg: number
  mode?: 'overlay' | 'inline'
}

export function CompassOverlay({ northAngleDeg, mode = 'overlay' }: Props) {
  const styles = useStyles()
  const normalized = ((northAngleDeg % 360) + 360) % 360

  const compassSvg = (
    <svg className={styles.svg} viewBox='0 0 84 84' role='presentation'>
      <circle cx='42' cy='42' r='40' className={styles.ring} />
      <g transform={`rotate(${normalized} 42 42)`}>
        <line x1='42' y1='56' x2='42' y2='20' className={styles.arrowLine} />
        <polygon points='42,12 35,24 49,24' className={styles.arrowHead} />
      </g>
      <text x='42' y='16' textAnchor='middle' className={styles.label}>N</text>
    </svg>
  )

  if (mode === 'inline') {
    return (
      <div className={styles.inlineMeta} aria-hidden='true' data-testid='compass-inline'>
        <div className={styles.inlineWrap}>
          {compassSvg}
        </div>
        <div className={styles.inlineDeg}>{Math.round(normalized)} deg</div>
      </div>
    )
  }

  return (
    <div className={styles.overlayWrap} aria-hidden='true' data-testid='compass-overlay'>
      {compassSvg}
      <div className={styles.overlayDeg}>{Math.round(normalized)} deg</div>
    </div>
  )
}

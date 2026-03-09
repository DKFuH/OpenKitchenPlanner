import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  wrap: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    zIndex: '6',
    pointerEvents: 'none',
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
    strokeWidth: '2',
    strokeLinecap: 'round',
  },
  arrowHead: {
    fill: tokens.colorNeutralForeground1,
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    fill: tokens.colorNeutralForeground1,
  },
  deg: {
    position: 'absolute',
    bottom: '7px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '10px',
    color: tokens.colorNeutralForeground3,
  },
})

interface Props {
  northAngleDeg: number
}

export function CompassOverlay({
northAngleDeg }: Props) {
  const styles = useStyles();

  const normalized = ((northAngleDeg % 360) + 360) % 360

  return (
    <div className={styles.wrap} aria-hidden='true'>
      <svg className={styles.svg} viewBox='0 0 84 84' role='presentation'>
        <circle cx='42' cy='42' r='40' className={styles.ring} />
        <g transform={`rotate(${normalized} 42 42)`}>
          <line x1='42' y1='56' x2='42' y2='20' className={styles.arrowLine} />
          <polygon points='42,12 35,24 49,24' className={styles.arrowHead} />
        </g>
        <text x='42' y='16' textAnchor='middle' className={styles.label}>N</text>
      </svg>
      <div className={styles.deg}>{Math.round(normalized)}°</div>
    </div>
  )
}

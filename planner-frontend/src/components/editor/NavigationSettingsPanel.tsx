import {
  defaultsForNavigationProfile,
  type NavigationProfile,
  type NavigationSettings,
} from './navigationSettings.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  panel: {
    position: 'absolute',
    top: '52px',
    right: '12px',
    width: '320px',
    maxWidth: 'calc(100vw - 24px)',
    background: 'var(--editor-surface)',
    border: '1px solid var(--editor-border)',
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    zIndex: '90',
    padding: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  title: {
    margin: '0',
    fontSize: '0.9rem',
    color: 'var(--editor-text)',
  },
  hint: {
    margin: '0',
    fontSize: '0.75rem',
    color: 'var(--editor-text-muted)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.6rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: 'var(--editor-text-muted)',
    '& select': {
      border: '1px solid var(--editor-border)',
      borderRadius: tokens.borderRadiusSmall,
      background: 'var(--editor-surface-alt)',
      color: 'var(--editor-text)',
      padding: '0.35rem 0.45rem',
      fontSize: '0.82rem',
    },
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: 'var(--editor-text)',
    fontSize: '0.8rem',
  },
})

interface Props {
  settings: NavigationSettings
  onChange: (settings: NavigationSettings) => void
}

export function NavigationSettingsPanel({
settings, onChange }: Props) {
  const styles = useStyles();

  function handleProfileChange(profile: NavigationProfile) {
    onChange(defaultsForNavigationProfile(profile))
  }

  return (
    <section className={styles.panel} aria-label='Navigationseinstellungen'>
      <h3 className={styles.title}>Navigation & Input</h3>
      <p className={styles.hint}>Shortcuts: `1` = 2D · `2` = Split · `3` = 3D</p>

      <div className={styles.grid}>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Profil</span>
          <select
            value={settings.navigation_profile}
            onChange={(event) => handleProfileChange(event.target.value as NavigationProfile)}
          >
            <option value='cad'>CAD</option>
            <option value='presentation'>Presentation</option>
            <option value='trackpad'>Trackpad</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Touchpad-Modus</span>
          <select
            value={settings.touchpad_mode}
            onChange={(event) => {
              onChange({
                ...settings,
                touchpad_mode: event.target.value === 'trackpad' ? 'trackpad' : 'cad',
              })
            }}
          >
            <option value='cad'>CAD (Wheel = Zoom)</option>
            <option value='trackpad'>Trackpad (Scroll = Pan)</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Zoom-Richtung</span>
          <select
            value={settings.zoom_direction}
            onChange={(event) => {
              onChange({
                ...settings,
                zoom_direction: event.target.value === 'inverted' ? 'inverted' : 'natural',
              })
            }}
          >
            <option value='natural'>Natürlich</option>
            <option value='inverted'>Invertiert</option>
          </select>
        </label>

        <label className={`${styles.toggle} ${styles.fieldFull}`}>
          <input
            type='checkbox'
            checked={settings.middle_mouse_pan}
            onChange={(event) => {
              onChange({
                ...settings,
                middle_mouse_pan: event.target.checked,
              })
            }}
          />
          Middle-Mouse-Pan aktivieren
        </label>

        <label className={`${styles.toggle} ${styles.fieldFull}`}>
          <input
            type='checkbox'
            checked={settings.invert_y_axis}
            onChange={(event) => {
              onChange({
                ...settings,
                invert_y_axis: event.target.checked,
              })
            }}
          />
          Orbit-Achse invertieren (Y)
        </label>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    inset: '0',
    zIndex: '20000',
    background: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizard: {
    width: 'min(28rem, 95vw)',
    background: tokens.colorNeutralBackground1,
    borderRadius: '1.5rem',
    padding: '2rem 2.25rem',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.85rem',
    textAlign: 'center',
  },
  stepIndicator: {
    display: 'flex',
    gap: '0.4rem',
    marginBottom: '0.5rem',
  },
  dot: {
    display: 'inline-block',
    width: '0.55rem',
    height: '0.55rem',
    borderRadius: '999px',
    background: tokens.colorNeutralStroke2,
  },
  dotActive: {
    background: tokens.colorBrandForeground1,
  },
  icon: {
    fontSize: '3rem',
    lineHeight: '1',
  },
  title: {
    margin: '0',
    fontSize: '1.4rem',
  },
  description: {
    margin: '0',
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.5',
    maxWidth: '22rem',
  },
  ctaButton: {
    marginTop: '0.25rem',
    padding: '0.5rem 1.25rem',
    border: `1px solid ${tokens.colorBrandForeground1}`,
    borderRadius: tokens.borderRadiusCircular,
    background: `color-mix(in srgb, ${tokens.colorBrandForeground1} 12%, transparent)`,
    color: tokens.colorBrandForeground1,
    cursor: 'pointer',
    fontSize: '0.95rem',
    '&:hover': {
      background: `color-mix(in srgb, ${tokens.colorBrandForeground1} 20%, transparent)`,
    },
  },
  actions: {
    display: 'flex',
    gap: '0.6rem',
    marginTop: '0.5rem',
  },
  btnPrimary: {
    padding: '0.55rem 1.2rem',
    borderRadius: tokens.borderRadiusCircular,
    cursor: 'pointer',
    fontSize: '0.95rem',
    border: 'none',
    background: tokens.colorBrandForeground1,
    color: tokens.colorNeutralForegroundInverted,
    '&:hover': {
      background: tokens.colorBrandBackground2Hover,
    },
  },
  btnSecondary: {
    padding: '0.55rem 1.2rem',
    borderRadius: tokens.borderRadiusCircular,
    cursor: 'pointer',
    fontSize: '0.95rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
    '&:hover': {
      background: tokens.colorNeutralBackground2,
    },
  },
})

const STEPS = [
  {
    id: 'welcome',
    title: 'Willkommen bei OKP',
    description: 'Dieser Assistent führt dich durch die wichtigsten Einrichtungsschritte. Du kannst den Assistenten jederzeit überspringen.',
    icon: '🏠',
  },
  {
    id: 'catalog',
    title: 'Erster Katalog',
    description: 'Importiere deinen ersten Hersteller-Katalog, um Artikel in Planungen verwenden zu können.',
    icon: '📦',
    cta: '/catalog',
    ctaLabel: 'Zum Katalog',
  },
  {
    id: 'project',
    title: 'Testprojekt anlegen',
    description: 'Lege ein erstes Testprojekt an, um den Planungsworkflow kennenzulernen.',
    icon: '📐',
    cta: '/',
    ctaLabel: 'Projektboard',
  },
  {
    id: 'contacts',
    title: 'Kontakte einrichten',
    description: 'Pflege deine Kundendaten im CRM-Bereich. Verknüpfe Kontakte mit Projekten.',
    icon: '👥',
    cta: '/contacts',
    ctaLabel: 'Zu Kontakten',
  },
  {
    id: 'done',
    title: 'Einrichtung abgeschlossen!',
    description: 'Du hast alle Grundschritte durchlaufen. Viel Erfolg bei der Planung.',
    icon: '✅',
  },
]

const STORAGE_KEY = 'okp_onboarding_done'

interface Props {
  onDismiss: () => void
}

export function OnboardingWizard({
onDismiss }: Props) {
  const styles = useStyles();

  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  function handleDone() {
    localStorage.setItem(STORAGE_KEY, 'true')
    onDismiss()
  }

  function handleSkip() {
    localStorage.setItem(STORAGE_KEY, 'true')
    onDismiss()
  }

  const isLast = stepIndex === STEPS.length - 1

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className={styles.wizard}>
        <div className={styles.stepIndicator}>
          {STEPS.map((s, i) => (
            <span key={s.id} className={`${styles.dot} ${i <= stepIndex ? styles.dotActive : ''}`} />
          ))}
        </div>

        <div className={styles.icon}>{step?.icon}</div>
        <h2 id="onboarding-title" className={styles.title}>{step?.title}</h2>
        <p className={styles.description}>{step?.description}</p>

        {step && 'cta' in step && step.cta && (
          <button
            className={styles.ctaButton}
            onClick={() => {
              navigate(step.cta!)
              handleDone()
            }}
          >
            {step.ctaLabel}
          </button>
        )}

        <div className={styles.actions}>
          {!isLast && (
            <button className={styles.btnSecondary} onClick={handleSkip}>Überspringen</button>
          )}
          {!isLast && (
            <button className={styles.btnPrimary} onClick={() => setStepIndex((i) => i + 1)}>Weiter</button>
          )}
          {isLast && (
            <button className={styles.btnPrimary} onClick={handleDone}>Starten</button>
          )}
        </div>
      </div>
    </div>
  )
}

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(STORAGE_KEY)
}

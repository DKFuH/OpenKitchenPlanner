export const fluentTokens = {
  color: {
    surface: '#ffffff',
    surfaceSubtle: '#f4f7f6',
    text: '#2c3e50',
    textMuted: '#64748b',
    border: '#d7e0e5',
    accent: '#218d8d',
    accentHover: '#1d7480',
    statusDanger: '#dc3545',
    statusSuccess: '#10b981',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  radius: {
    control: '8px',
    panel: '12px',
    overlay: '16px',
  },
  typography: {
    title: '600 18px/24px var(--font-sans)',
    section: '600 14px/20px var(--font-sans)',
    body: '400 14px/20px var(--font-sans)',
    caption: '500 12px/16px var(--font-sans)',
  },
  elevation: {
    shell: '0 2px 10px rgba(15, 23, 42, 0.08)',
    panel: '0 8px 24px rgba(15, 23, 42, 0.08)',
    overlay: '0 12px 32px rgba(15, 23, 42, 0.16)',
    dialog: '0 24px 56px rgba(15, 23, 42, 0.24)',
  },
} as const

export type FluentTokenSet = typeof fluentTokens

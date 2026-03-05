import { makeStyles, tokens } from '@fluentui/react-components'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppShellState } from '../../editor/appShellState.js'
import { AppHeader } from './AppHeader.js'

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  content: {
    minHeight: 0,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    '@media (max-width: 900px)': {
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    },
  },
})

export function AppShell() {
  const styles = useStyles()
  const location = useLocation()
  const shellState = useAppShellState({
    pathname: location.pathname,
  })

  return (
    <div className={styles.root}>
      <AppHeader shellState={shellState} />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}

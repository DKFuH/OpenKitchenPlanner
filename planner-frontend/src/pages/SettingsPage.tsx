import { useLocation, useNavigate } from 'react-router-dom'
import { Body1, Button, Subtitle2, Title2, makeStyles, tokens } from '@fluentui/react-components'
import { useLocale } from '../hooks/useLocale.js'
import { LanguageSwitcher } from '../components/LanguageSwitcher.js'
import { projectIdFromRouteContext, withProjectContext } from '../routing/projectContext.js'

const useStyles = makeStyles({
  page: { display: 'grid', rowGap: tokens.spacingVerticalXL },
  section: { display: 'grid', rowGap: tokens.spacingVerticalM },
  actions: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalM },
})

export function SettingsPage() {
  const styles = useStyles()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLocale()
  const projectId = projectIdFromRouteContext(location.pathname, location.search)

  return (
    <div className={styles.page}>
      <div>
        <Title2>{t('settings.title')}</Title2>
        <Body1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
          {t('settings.subtitle')}
        </Body1>
      </div>

      <section className={styles.section}>
        <Subtitle2>{t('settings.sections')}</Subtitle2>
        <div className={styles.actions}>
          <Button appearance="primary" onClick={() => navigate(withProjectContext('/settings/company', projectId))}>
            {t('settings.companyProfile')}
          </Button>
          <Button appearance="secondary" onClick={() => navigate(withProjectContext('/settings/project-defaults', projectId))}>
            Projekt-Defaults
          </Button>
          <Button appearance="secondary" onClick={() => navigate(withProjectContext('/settings/plugins', projectId))}>
            {t('settings.plugins')}
          </Button>
          <Button appearance="secondary" onClick={() => navigate(withProjectContext('/settings/layout-styles', projectId))}>
            {t('settings.layoutStyles')}
          </Button>
          <Button appearance="secondary" onClick={() => navigate(withProjectContext('/settings/language-packs', projectId))}>
            {t('settings.languagePacks')}
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <Subtitle2>{t('settings.languageSection')}</Subtitle2>
        <Body1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
          {t('settings.languageHint')}
        </Body1>
        <LanguageSwitcher />
      </section>
    </div>
  )
}

import { expect, test } from '@playwright/test'

const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROJECT_ID = 'nav-project'

test.beforeEach(async ({ page }) => {
  await page.addInitScript((tenantId: string) => {
    ;(window as Window & { __OKP_RUNTIME_CONTEXT__?: { tenantId?: string } }).__OKP_RUNTIME_CONTEXT__ = { tenantId }
    window.localStorage.setItem('okp_onboarding_done', 'true')
    window.localStorage.setItem('okp-demo-mode', 'true')
  }, TENANT_ID)

  await page.route('**/api/v1/language-packs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  await page.route('**/api/v1/tenant/plugins**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        available: [
          { id: 'presentation', name: 'Praesentation' },
          { id: 'viewer-export', name: 'Viewer Export' },
        ],
        enabled: ['presentation', 'viewer-export'],
      }),
    })
  })

  await page.route(`**/api/v1/projects/${PROJECT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: PROJECT_ID,
        name: 'Navigation Project',
        status: 'active',
        project_status: 'planning',
        created_at: '2026-03-11T10:00:00.000Z',
        updated_at: '2026-03-11T10:00:00.000Z',
        rooms: [],
        quotes: [],
      }),
    })
  })

  await page.route(`**/api/v1/projects/${PROJECT_ID}/lock-state`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project_id: PROJECT_ID,
        locked: false,
        alternative_id: null,
        locked_by_user: null,
        locked_by_host: null,
        locked_at: null,
      }),
    })
  })

  await page.route(`**/api/v1/projects/${PROJECT_ID}/levels`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
})

test('project-scoped shell keeps return paths across plugin settings and project list', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_ID}/__e2e/s109-shell`)

  await expect(page.getByTestId('shell-back-to-projects')).toBeVisible()

  await page.getByTestId('ribbon-tab-plugins').click()
  await page.getByTestId('ribbon-cmd-cmd-plugin-settings').click()

  await expect(page).toHaveURL(new RegExp(`/settings/plugins\\?projectId=${PROJECT_ID}$`))
  await expect(page.getByTestId('shell-project-scope-badge')).toContainText(/Projektgebunden|Project scoped/i)
  await expect(page.getByTestId('shell-back-to-editor')).toBeVisible()

  await page.getByTestId('shell-back-to-editor').click()
  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_ID}$`))
  await expect(page.getByTestId('shell-back-to-projects')).toBeVisible()

  await page.getByTestId('shell-back-to-projects').click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByTestId('shell-project-scope-badge')).toContainText(/Global/i)
})

test('settings subroutes keep project context and return to settings root', async ({ page }) => {
  await page.goto(`/settings?projectId=${PROJECT_ID}`)

  await expect(page.getByTestId('shell-project-scope-badge')).toContainText(/Projektgebunden|Project scoped/i)

  await page.getByRole('button', { name: /Firmenprofil|Company Profile/i }).click()
  await expect(page).toHaveURL(new RegExp(`/settings/company\\?projectId=${PROJECT_ID}$`))
  await expect(page.getByTestId('shell-back-to-editor')).toBeVisible()

  await page.getByRole('button', { name: /Zurueck|Zurück/i }).click()
  await expect(page).toHaveURL(new RegExp(`/settings\\?projectId=${PROJECT_ID}$`))

  await page.getByRole('button', { name: /Projekt-Defaults/i }).click()
  await expect(page).toHaveURL(new RegExp(`/settings/project-defaults\\?projectId=${PROJECT_ID}$`))

  await page.getByRole('button', { name: /Zurueck|Zurück/i }).click()
  await expect(page).toHaveURL(new RegExp(`/settings\\?projectId=${PROJECT_ID}$`))
})

import { expect, test } from '@playwright/test'

const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROJECT_ID = 's109-smoke-project'

test.beforeEach(async ({ page }) => {
  await page.addInitScript((tenantId: string) => {
    ;(window as Window & { __OKP_RUNTIME_CONTEXT__?: { tenantId?: string } }).__OKP_RUNTIME_CONTEXT__ = { tenantId }
  }, TENANT_ID)

  await page.route('**/api/v1/language-packs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
})

test('smoke: header backend/plugins/mcp menus and sidebar slots in one flow', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_ID}/__e2e/s109-shell`)

  await expect(page.getByTestId('s109-shell-harness')).toBeVisible()
  await expect(page.getByTestId('harness-project-id')).toContainText(PROJECT_ID)

  await page.getByTestId('ribbon-tab-daten').click()
  await expect(page.getByTestId('ribbon-cmd-cmd-quote-lines')).toBeVisible()
  await expect(page.getByTestId('ribbon-cmd-backend-panel-camera')).toBeVisible()

  await page.getByTestId('ribbon-tab-plugins').click()
  await expect(page.getByTestId('ribbon-cmd-cmd-plugin-settings')).toBeVisible()
  await expect(page.getByTestId('ribbon-cmd-plugin-presentation')).toBeVisible()

  await page.getByTestId('ribbon-cmd-mcp-menu').click()
  await expect(page.getByTestId('ribbon-subcmd-mcp-ribbon-mcp-hub')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByTestId('sidebar-plugin-slot-presentation').click()
  await expect(page.getByTestId('harness-last-sidebar-path')).toContainText(`/projects/${PROJECT_ID}/presentation`)

  await page.getByTestId('sidebar-panel-action-mcp-hub').click()
  await expect(page.getByTestId('harness-last-sidebar-path')).toContainText('/settings/mcp')

  await page.getByTestId('sidebar-panel-action-mcp-hub-project-context').click()
  await expect(page.getByTestId('harness-last-sidebar-path')).toContainText(`/settings/mcp?projectId=${PROJECT_ID}`)
})

test('hardening: global context keeps project-scoped actions disabled', async ({ page }) => {
  await page.goto('/__e2e/s109-shell')

  await expect(page.getByTestId('s109-shell-harness')).toBeVisible()
  await expect(page.getByTestId('harness-project-id')).toContainText('global-context')

  await page.getByTestId('ribbon-tab-daten').click()
  await expect(page.getByTestId('ribbon-cmd-backend-panel-camera')).toBeDisabled()
  await expect(page.getByTestId('ribbon-cmd-backend-panel-camera')).toHaveAttribute(
    'title',
    /Projektkontext fehlt|Project context missing/,
  )

  await page.getByTestId('ribbon-tab-plugins').click()
  await expect(page.getByTestId('ribbon-cmd-plugin-presentation')).toBeDisabled()
  await expect(page.getByTestId('ribbon-cmd-plugin-presentation')).toHaveAttribute(
    'title',
    /Projektkontext fehlt|Project context missing/,
  )

  await expect(page.getByTestId('sidebar-plugin-slot-presentation')).toBeDisabled()
  await expect(page.getByTestId('sidebar-plugin-slot-asset-library')).toBeEnabled()
  await page.getByTestId('sidebar-plugin-slot-asset-library').click()
  await expect(page.getByTestId('harness-last-sidebar-path')).toContainText('/catalog')

  await expect(page.getByTestId('sidebar-panel-action-mcp-hub-project-context')).toBeDisabled()
})

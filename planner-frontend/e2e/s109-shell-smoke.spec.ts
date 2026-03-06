import { expect, test } from '@playwright/test'

const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROJECT_ID = 's109-smoke-project'

test.beforeEach(async ({ page }) => {
  await page.addInitScript((tenantId: string) => {
    ;(window as Window & { __YAKDS_RUNTIME_CONTEXT__?: { tenantId?: string } }).__YAKDS_RUNTIME_CONTEXT__ = { tenantId }
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

  const backendButton = page.getByRole('button', { name: /Backend-Features|Backend features/i })
  await backendButton.click()
  await expect(page.getByRole('menuitem', { name: /Angebotspositionen|Quote lines/i })).toBeVisible()
  await page.keyboard.press('Escape')

  const pluginsButton = page.getByRole('button', { name: /^Plugins$/i }).first()
  await pluginsButton.click()
  await expect(page.getByRole('menuitem', { name: /Plugin-Einstellungen|Plugin settings/i })).toBeVisible()
  await page.keyboard.press('Escape')

  const mcpButton = page.getByRole('button', { name: /^MCP$/i }).first()
  await mcpButton.click()
  await expect(page.getByRole('menuitem', { name: /MCP-Hub oeffnen|Open MCP hub/i })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Praesentation' }).first().click()
  await expect(page.getByTestId('harness-last-sidebar-path')).toContainText(`/projects/${PROJECT_ID}/presentation`)

  await page.getByRole('button', { name: /MCP-Hub oeffnen|Open MCP hub/i }).last().click()
  await expect(page.getByTestId('harness-last-sidebar-path')).toContainText('/settings/mcp')

  await page.getByRole('button', { name: /Projektkontext im MCP-Hub|Open project context in MCP hub/i }).click()
  await expect(page.getByTestId('harness-last-sidebar-path')).toContainText(`/settings/mcp?projectId=${PROJECT_ID}`)
})

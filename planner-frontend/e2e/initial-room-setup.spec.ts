import { expect, test } from '@playwright/test'

const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROJECT_ID = 'empty-project'
const LEVEL_ID = 'level-ground'
const ROOM_ID = 'room-1'

test.beforeEach(async ({ page }) => {
  await page.addInitScript((tenantId: string) => {
    ;(window as Window & { __OKP_RUNTIME_CONTEXT__?: { tenantId?: string } }).__OKP_RUNTIME_CONTEXT__ = { tenantId }
    window.localStorage.setItem('okp_onboarding_done', 'true')
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
        available: [],
        enabled: [],
      }),
    })
  })

  await page.route(`**/api/v1/projects/${PROJECT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: PROJECT_ID,
        name: 'Leeres Projekt',
        status: 'active',
        project_status: 'planning',
        description: null,
        deadline: null,
        priority: 'medium',
        assigned_to: null,
        advisor: null,
        sales_rep: null,
        progress_pct: 0,
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
      body: JSON.stringify([{
        id: LEVEL_ID,
        tenant_id: TENANT_ID,
        project_id: PROJECT_ID,
        name: 'EG',
        elevation_mm: 0,
        height_mm: 2500,
        order_index: 0,
        visible: true,
        locked: false,
        lock_scope: null,
        config_json: {},
        created_at: '2026-03-11T10:00:00.000Z',
        updated_at: '2026-03-11T10:00:00.000Z',
      }]),
    })
  })

  await page.route('**/api/v1/rooms', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    const payload = route.request().postDataJSON() as {
      project_id: string
      level_id?: string
      name: string
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: ROOM_ID,
        project_id: payload.project_id,
        level_id: payload.level_id ?? LEVEL_ID,
        name: payload.name,
        ceiling_height_mm: 2500,
        boundary: { vertices: [], wall_segments: [] },
        ceiling_constraints: [],
        openings: [],
        placements: [],
        reference_image: null,
        created_at: '2026-03-11T10:05:00.000Z',
        updated_at: '2026-03-11T10:05:00.000Z',
      }),
    })
  })

  await page.route(`**/api/v1/rooms/${ROOM_ID}/dimensions`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  await page.route(`**/api/v1/rooms/${ROOM_ID}/centerlines`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  await page.route(`**/api/v1/rooms/${ROOM_ID}/elevation/*`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'text/plain',
      body: '',
    })
  })
})

test('empty projects require first room setup before editor workspace is shown', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_ID}`)

  await expect(page.getByTestId('initial-room-setup')).toBeVisible()
  await expect(page.getByText(/Ersten Raum anlegen/i)).toBeVisible()
  await expect(page.getByText(/Kein Raum ausgew/i)).toHaveCount(0)

  await page.getByTestId('initial-room-name').fill('Kueche')
  await page.getByTestId('initial-room-submit').click()

  await expect(page.getByTestId('initial-room-setup')).toHaveCount(0)
  await expect(page.getByText(/1 Ebenen \| 1 Raeume/i)).toBeVisible()
  await expect(page.getByText(/Raum: Kueche/i)).toBeVisible()
  await expect(page.getByText(/Kein Raum ausgew/i)).toHaveCount(0)
})

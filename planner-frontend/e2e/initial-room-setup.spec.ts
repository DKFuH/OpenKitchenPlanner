import { expect, test } from '@playwright/test'

const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROJECT_ID = 'empty-project'
const LEVEL_ID = 'level-ground'
const ROOM_ID = 'room-1'

test.beforeEach(async ({ page }) => {
  let roomBoundary: {
    vertices: Array<{ id: string; x_mm: number; y_mm: number; index: number }>
    wall_segments: Array<{ id: string; index: number; start_vertex_id: string; end_vertex_id: string }>
  } = { vertices: [], wall_segments: [] }

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

  await page.route(`**/api/v1/rooms/${ROOM_ID}`, async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.fallback()
      return
    }

    const payload = route.request().postDataJSON() as { boundary?: typeof roomBoundary }
    roomBoundary = payload.boundary ?? roomBoundary
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: ROOM_ID,
        project_id: PROJECT_ID,
        level_id: LEVEL_ID,
        name: 'Kueche',
        ceiling_height_mm: 2500,
        boundary: roomBoundary,
        ceiling_constraints: [],
        openings: [],
        placements: [],
        reference_image: null,
        created_at: '2026-03-11T10:05:00.000Z',
        updated_at: '2026-03-11T10:06:00.000Z',
      }),
    })
  })

  await page.route(`**/api/v1/projects/${PROJECT_ID}/elevations`, async (route) => {
    const verticesById = new Map(roomBoundary.vertices.map((vertex) => [vertex.id, vertex]))
    const elevations = roomBoundary.wall_segments.map((wall) => {
      const start = verticesById.get(wall.start_vertex_id)
      const end = verticesById.get(wall.end_vertex_id)
      const wallLength = start && end ? Math.hypot(end.x_mm - start.x_mm, end.y_mm - start.y_mm) : 0
      return {
        room_id: ROOM_ID,
        room_name: 'Kueche',
        wall_id: wall.id,
        wall_index: wall.index,
        wall_length_mm: wallLength,
        room_height_mm: 2500,
        preview_url: `/api/v1/rooms/${ROOM_ID}/elevation/${wall.index}`,
      }
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ project_id: PROJECT_ID, total: elevations.length, elevations }),
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

test('saved room geometry refreshes the wall elevation viewport', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_ID}`)
  await page.getByTestId('initial-room-submit').click()

  const canvas = page.locator('.konvajs-content canvas').first()
  await expect(canvas).toBeVisible()
  await canvas.click({ position: { x: 120, y: 120 } })
  await canvas.click({ position: { x: 420, y: 120 } })
  await canvas.click({ position: { x: 420, y: 320 } })
  await canvas.click({ position: { x: 120, y: 320 } })
  const closePolygon = page.getByRole('button', { name: 'Polygon schließen' })
  if (await closePolygon.isVisible()) {
    await closePolygon.click()
  }
  await page.getByRole('button', { name: 'Speichern', exact: true }).last().click()

  await expect(page.getByText(/4 Waende/i)).toBeVisible()
  await expect(page.getByText(/Aktiv: Wand 1/i)).toBeVisible()
})

test('object selection stays active beside the wall view and window families can be changed', async ({ page }) => {
  const opening = { id: 'opening-1', wall_id: 'wall-1', type: 'window', offset_mm: 900, width_mm: 1000, height_mm: 1200, sill_height_mm: 900, source: 'manual' }
  const room = {
    id: ROOM_ID, project_id: PROJECT_ID, level_id: LEVEL_ID, name: 'Kueche', ceiling_height_mm: 2500,
    boundary: {
      vertices: [
        { id: 'v1', x_mm: 0, y_mm: 0, index: 0 }, { id: 'v2', x_mm: 3000, y_mm: 0, index: 1 },
        { id: 'v3', x_mm: 3000, y_mm: 2000, index: 2 }, { id: 'v4', x_mm: 0, y_mm: 2000, index: 3 },
      ],
      wall_segments: [
        { id: 'wall-1', index: 0, start_vertex_id: 'v1', end_vertex_id: 'v2' },
        { id: 'wall-2', index: 1, start_vertex_id: 'v2', end_vertex_id: 'v3' },
        { id: 'wall-3', index: 2, start_vertex_id: 'v3', end_vertex_id: 'v4' },
        { id: 'wall-4', index: 3, start_vertex_id: 'v4', end_vertex_id: 'v1' },
      ],
    },
    ceiling_constraints: [], openings: [opening],
    placements: [{ id: 'placement-1', catalog_item_id: 'cabinet-1', description: 'Unterschrank 60 cm', wall_id: 'wall-3', offset_mm: 1200, width_mm: 600, depth_mm: 560, height_mm: 720 }],
  }
  await page.route(`**/api/v1/projects/${PROJECT_ID}`, route => route.fulfill({
    json: { id: PROJECT_ID, name: 'Katalogplanung', rooms: [room], quotes: [] },
  }))
  await page.route(`**/api/v1/projects/${PROJECT_ID}/elevations`, route => route.fulfill({
    json: { project_id: PROJECT_ID, total: 4, elevations: room.boundary.wall_segments.map((wall) => ({
      room_id: ROOM_ID, room_name: room.name, wall_id: wall.id, wall_index: wall.index,
      wall_length_mm: wall.index % 2 ? 2000 : 3000, room_height_mm: 2500,
    })) },
  }))
  await page.route(`**/api/v1/rooms/${ROOM_ID}/openings`, async route => {
    const body = route.request().postDataJSON() as { openings: unknown[] }
    await route.fulfill({ json: body.openings })
  })

  await page.goto(`/projects/${PROJECT_ID}`)
  await page.getByRole('button', { name: 'Unterschrank 60 cm · 600 × 560 mm', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Möbel|Platzierung/ })).toBeVisible()
  await expect(page.getByText(/Aktiv: Wand 3/i)).toBeVisible()
  await page.getByRole('button', { name: 'Fenster · Frei · 1000 mm', exact: true }).click()
  await expect(page.getByLabel('Bauteilfamilie')).toBeVisible()
  await expect(page.getByText(/Aktiv: Wand 1/i)).toBeVisible()
  const saved = page.waitForRequest(request => request.url().endsWith(`/rooms/${ROOM_ID}/openings`) && request.method() === 'PUT')
  await page.getByLabel('Bauteilfamilie').selectOption('window-tilt-turn-double')
  const payload = (await saved).postDataJSON()
  expect(payload.openings[0]).toMatchObject({ family_id: 'window-tilt-turn-double', leaf_count: 2, width_mm: 1400, height_mm: 1200, sill_height_mm: 900 })
  await expect(page.getByLabel('Öffnungsbreite in mm')).toHaveValue('1400')
  await expect(page.getByLabel('Flügelanzahl')).toHaveValue('2')

  await page.getByRole('button', { name: 'Objektbibliothek öffnen', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Objekt wählen' })).toBeVisible()
  await expect(dialog.getByRole('img', { name: /Vorschau Dreh-Kipp-Fenster, 2-flügelig/ })).toBeVisible()
  await expect(dialog.locator('button img')).toHaveCount(8)
  await dialog.screenshot({ path: 'test-results/object-library.png' })
  await dialog.getByLabel('Objektbibliothek durchsuchen').fill('3-flügelig')
  await dialog.getByRole('button', { name: /Fenster, 3-flügelig/ }).click()
  await expect(dialog.getByRole('link', { name: 'DXF', exact: true })).toHaveAttribute('href', '/object-library/window-triple/plan.dxf')
  const librarySave = page.waitForRequest(request => request.url().endsWith(`/rooms/${ROOM_ID}/openings`) && request.method() === 'PUT')
  await dialog.getByRole('button', { name: 'Übernehmen', exact: true }).click()
  expect((await librarySave).postDataJSON().openings[0]).toMatchObject({ family_id: 'window-triple', leaf_count: 3, width_mm: 2100 })
  await expect(page.getByLabel('Flügelanzahl')).toHaveValue('3')
})

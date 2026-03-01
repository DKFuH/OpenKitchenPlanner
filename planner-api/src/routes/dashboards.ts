import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'

const DashboardParamsSchema = z.object({
  userId: z.string().uuid(),
})

const WidgetIdValues = ['sales_chart', 'current_projects', 'current_contacts', 'kpi_cards', 'project_pipeline'] as const

const DashboardPayloadSchema = z.object({
  widgets: z.array(z.object({
    id: z.enum(WidgetIdValues),
    title: z.string().min(1).max(120).optional(),
    config: z.record(z.unknown()).optional(),
  })).min(1).max(20),
  layout: z.object({
    columns: z.number().int().min(1).max(12),
    items: z.array(z.object({
      widget_id: z.enum(WidgetIdValues),
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      w: z.number().int().min(1).max(12),
      h: z.number().int().min(1).max(12),
    })).max(50),
  }),
})

const SalesChartQuerySchema = z.object({
  period: z.enum(['month', 'last_month', 'year']).default('month'),
})

type TenantAwareRequest = {
  tenantId?: string | null
  headers?: Record<string, string | string[] | undefined>
}

function getTenantId(request: TenantAwareRequest): string | null {
  if (request.tenantId) {
    return request.tenantId
  }
  const header = request.headers?.['x-tenant-id']
  if (!header) {
    return null
  }
  return Array.isArray(header) ? (header[0] ?? null) : header
}

function createDefaultDashboard(userId: string, tenantId: string) {
  return {
    id: null,
    user_id: userId,
    tenant_id: tenantId,
    widgets: [
      { id: 'sales_chart' },
      { id: 'kpi_cards' },
      { id: 'current_projects' },
      { id: 'current_contacts' },
      { id: 'project_pipeline' },
    ],
    layout: {
      columns: 12,
      items: [
        { widget_id: 'sales_chart', x: 0, y: 0, w: 8, h: 4 },
        { widget_id: 'kpi_cards', x: 8, y: 0, w: 4, h: 4 },
        { widget_id: 'current_projects', x: 0, y: 4, w: 6, h: 4 },
        { widget_id: 'current_contacts', x: 6, y: 4, w: 6, h: 4 },
        { widget_id: 'project_pipeline', x: 0, y: 8, w: 12, h: 4 },
      ],
    },
  }
}

function resolveRange(period: 'month' | 'last_month' | 'year') {
  const now = new Date()

  if (period === 'year') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
    return { from, to: now, bucket: 'month' as const }
  }

  if (period === 'last_month') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))
    return { from, to, bucket: 'day' as const }
  }

  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
  return { from, to: now, bucket: 'day' as const }
}

const prismaDashboardConfig = (prisma as unknown as Record<string, {
  findUnique: (args: unknown) => Promise<unknown>
  upsert: (args: unknown) => Promise<unknown>
}>).dashboardConfig

export async function dashboardRoutes(app: FastifyInstance) {
  app.get<{ Params: { userId: string } }>('/dashboards/:userId', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = DashboardParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid user id')
    }

    const user = await prisma.user.findFirst({
      where: { id: params.data.userId, tenant_id: tenantId },
      select: { id: true, tenant_id: true },
    })

    if (!user) {
      return sendNotFound(reply, 'User not found in tenant scope')
    }

    const config = await prismaDashboardConfig.findUnique({
      where: { user_id: params.data.userId },
      select: {
        id: true,
        user_id: true,
        tenant_id: true,
        widgets: true,
        layout: true,
        created_at: true,
        updated_at: true,
      },
    }) as {
      id: string
      user_id: string
      tenant_id: string
      widgets: unknown
      layout: unknown
      created_at: Date
      updated_at: Date
    } | null

    if (!config) {
      return reply.send(createDefaultDashboard(params.data.userId, tenantId))
    }

    if (config.tenant_id !== tenantId) {
      return sendForbidden(reply, 'Cross-tenant dashboard access is not allowed')
    }

    return reply.send(config)
  })

  app.put<{ Params: { userId: string } }>('/dashboards/:userId', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = DashboardParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid user id')
    }

    const parsedBody = DashboardPayloadSchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Invalid payload')
    }

    const user = await prisma.user.findFirst({
      where: { id: params.data.userId, tenant_id: tenantId },
      select: { id: true, tenant_id: true },
    })

    if (!user) {
      return sendNotFound(reply, 'User not found in tenant scope')
    }

    const config = await prismaDashboardConfig.upsert({
      where: { user_id: params.data.userId },
      create: {
        user_id: params.data.userId,
        tenant_id: tenantId,
        widgets: parsedBody.data.widgets as Prisma.InputJsonValue,
        layout: parsedBody.data.layout as Prisma.InputJsonValue,
      },
      update: {
        tenant_id: tenantId,
        widgets: parsedBody.data.widgets as Prisma.InputJsonValue,
        layout: parsedBody.data.layout as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        user_id: true,
        tenant_id: true,
        widgets: true,
        layout: true,
        created_at: true,
        updated_at: true,
      },
    })

    return reply.send(config)
  })

  app.get('/kpis/sales-chart', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const parsedQuery = SalesChartQuerySchema.safeParse(request.query)
    if (!parsedQuery.success) {
      return sendBadRequest(reply, parsedQuery.error.errors[0]?.message ?? 'Invalid query')
    }

    const range = resolveRange(parsedQuery.data.period)

    const quotes = await prisma.quote.findMany({
      where: {
        project: { tenant_id: tenantId },
        created_at: { gte: range.from, lte: range.to },
      },
      select: {
        created_at: true,
        items: { select: { line_net: true } },
      },
      orderBy: { created_at: 'asc' },
    })

    const buckets = new Map<string, { value_net: number; quotes: number }>()
    for (const quote of quotes) {
      const date = new Date(quote.created_at)
      const key = range.bucket === 'month'
        ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
        : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`

      const current = buckets.get(key) ?? { value_net: 0, quotes: 0 }
      current.value_net += quote.items.reduce((sum, item) => sum + item.line_net, 0)
      current.quotes += 1
      buckets.set(key, current)
    }

    const points = Array.from(buckets.entries()).map(([date, value]) => ({
      date,
      value_net: Math.round(value.value_net * 100) / 100,
      quotes: value.quotes,
    }))

    const totalNet = points.reduce((sum, point) => sum + point.value_net, 0)

    return reply.send({
      tenant_id: tenantId,
      period: parsedQuery.data.period,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      points,
      total_net: Math.round(totalNet * 100) / 100,
    })
  })
}

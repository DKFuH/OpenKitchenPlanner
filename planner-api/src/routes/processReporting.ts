import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'
import {
  buildProcessCsvExport,
  buildProcessPdfSummary,
  computeBottlenecks,
  computeProcessKpis,
} from '../services/processReportingService.js'

type TenantAwareRequest = {
  tenantId?: string | null
  headers?: Record<string, string | string[] | undefined>
}

const DateRangeQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

const TimelineParamsSchema = z.object({
  entityId: z.string().uuid(),
})

const TimelineQuerySchema = z.object({
  entity_type: z.enum(['production_order', 'project']).default('production_order'),
})

const ProcessExportSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(['csv', 'pdf']).default('csv'),
})

function headerValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null
  }
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function getTenantId(request: TenantAwareRequest): string | null {
  return request.tenantId ?? headerValue(request.headers?.['x-tenant-id'])
}

function resolveRange(from?: string, to?: string) {
  const toDate = to ? new Date(to) : new Date()
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 90 * 24 * 60 * 60 * 1000)
  return { fromDate, toDate }
}

export async function processReportingRoutes(app: FastifyInstance) {
  app.get('/reports/process/kpis', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const query = DateRangeQuerySchema.safeParse(request.query)
    if (!query.success) {
      return sendBadRequest(reply, query.error.errors[0]?.message ?? 'Invalid query')
    }

    const { fromDate, toDate } = resolveRange(query.data.from, query.data.to)

    const [projects, orders] = await Promise.all([
      prisma.project.findMany({
        where: {
          tenant_id: tenantId,
          created_at: { lte: toDate },
        },
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          project_status: true,
        },
      }),
      prisma.productionOrder.findMany({
        where: {
          tenant_id: tenantId,
          created_at: { gte: fromDate, lte: toDate },
        },
        include: {
          events: {
            orderBy: { created_at: 'asc' },
            select: {
              from_status: true,
              to_status: true,
              note: true,
              created_at: true,
            },
          },
        },
      }),
    ])

    const kpis = computeProcessKpis(projects, orders)

    return reply.send({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      kpis,
    })
  })

  app.get('/reports/process/bottlenecks', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const query = DateRangeQuerySchema.safeParse(request.query)
    if (!query.success) {
      return sendBadRequest(reply, query.error.errors[0]?.message ?? 'Invalid query')
    }

    const { fromDate, toDate } = resolveRange(query.data.from, query.data.to)

    const orders = await prisma.productionOrder.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: fromDate, lte: toDate },
      },
      include: {
        events: {
          orderBy: { created_at: 'asc' },
          select: {
            from_status: true,
            to_status: true,
            note: true,
            created_at: true,
          },
        },
      },
    })

    const bottlenecks = computeBottlenecks(orders)

    return reply.send({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      bottlenecks,
    })
  })

  app.get<{ Params: { entityId: string } }>('/reports/process/timeline/:entityId', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = TimelineParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid entity id')
    }

    const query = TimelineQuerySchema.safeParse(request.query)
    if (!query.success) {
      return sendBadRequest(reply, query.error.errors[0]?.message ?? 'Invalid query')
    }

    if (query.data.entity_type === 'production_order') {
      const order = await prisma.productionOrder.findFirst({
        where: {
          id: params.data.entityId,
          tenant_id: tenantId,
        },
        select: {
          id: true,
          created_at: true,
          events: {
            orderBy: { created_at: 'asc' },
            select: {
              from_status: true,
              to_status: true,
              note: true,
              user_id: true,
              created_at: true,
            },
          },
        },
      })

      if (!order) {
        return sendNotFound(reply, 'Production order not found in tenant scope')
      }

      return reply.send({
        entity_type: 'production_order',
        entity_id: order.id,
        events: [
          {
            type: 'order_created',
            created_at: order.created_at,
          },
          ...order.events.map((event) => ({
            type: 'order_status_event',
            created_at: event.created_at,
            from_status: event.from_status,
            to_status: event.to_status,
            note: event.note,
            user_id: event.user_id,
          })),
        ],
      })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.data.entityId,
        tenant_id: tenantId,
      },
      select: { id: true, created_at: true },
    })

    if (!project) {
      return sendNotFound(reply, 'Project not found in tenant scope')
    }

    const [instances, projectOrders] = await Promise.all([
      prisma.workflowInstance.findMany({
        where: {
          tenant_id: tenantId,
          entity_type: 'project',
          entity_id: project.id,
        },
        select: { id: true },
      }),
      prisma.productionOrder.findMany({
        where: {
          tenant_id: tenantId,
          project_id: project.id,
        },
        select: {
          id: true,
          created_at: true,
          events: {
            select: {
              from_status: true,
              to_status: true,
              note: true,
              user_id: true,
              created_at: true,
            },
          },
        },
      }),
    ])

    const workflowEvents = instances.length > 0
      ? await prisma.workflowEvent.findMany({
          where: {
            tenant_id: tenantId,
            instance_id: { in: instances.map((item) => item.id) },
          },
          orderBy: { created_at: 'asc' },
        })
      : []

    const productionEvents = projectOrders.flatMap((order) => [
      {
        type: 'order_created',
        order_id: order.id,
        created_at: order.created_at,
      },
      ...order.events.map((event) => ({
        type: 'order_status_event',
        order_id: order.id,
        created_at: event.created_at,
        from_status: event.from_status,
        to_status: event.to_status,
        note: event.note,
        user_id: event.user_id,
      })),
    ])

    const combined = [
      {
        type: 'project_created',
        created_at: project.created_at,
      },
      ...workflowEvents.map((event) => ({
        type: 'workflow_event',
        created_at: event.created_at,
        from_node_id: event.from_node_id,
        to_node_id: event.to_node_id,
        transition_label: event.transition_label,
        reason: event.reason,
      })),
      ...productionEvents,
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return reply.send({
      entity_type: 'project',
      entity_id: project.id,
      events: combined,
    })
  })

  app.get('/dashboards/process/overview', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const query = DateRangeQuerySchema.safeParse(request.query)
    if (!query.success) {
      return sendBadRequest(reply, query.error.errors[0]?.message ?? 'Invalid query')
    }

    const { fromDate, toDate } = resolveRange(query.data.from, query.data.to)

    const [projects, orders] = await Promise.all([
      prisma.project.findMany({
        where: { tenant_id: tenantId, created_at: { lte: toDate } },
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          project_status: true,
        },
      }),
      prisma.productionOrder.findMany({
        where: { tenant_id: tenantId, created_at: { gte: fromDate, lte: toDate } },
        include: {
          events: {
            orderBy: { created_at: 'asc' },
            select: {
              from_status: true,
              to_status: true,
              note: true,
              created_at: true,
            },
          },
        },
      }),
    ])

    const kpis = computeProcessKpis(projects, orders)
    const bottlenecks = computeBottlenecks(orders)

    const delayedOrders = orders
      .filter((order) => order.status !== 'installed')
      .map((order) => ({
        id: order.id,
        status: order.status,
        age_days: Math.round((Date.now() - new Date(order.updated_at).getTime()) / (1000 * 60 * 60 * 24) * 100) / 100,
      }))
      .sort((a, b) => b.age_days - a.age_days)
      .slice(0, 5)

    return reply.send({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      kpis,
      bottlenecks,
      delayed_orders: delayedOrders,
    })
  })

  app.post('/reports/process/export', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const body = ProcessExportSchema.safeParse(request.body)
    if (!body.success) {
      return sendBadRequest(reply, body.error.errors[0]?.message ?? 'Invalid payload')
    }

    const { fromDate, toDate } = resolveRange(body.data.from, body.data.to)

    const [projects, orders] = await Promise.all([
      prisma.project.findMany({
        where: {
          tenant_id: tenantId,
          created_at: { lte: toDate },
        },
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          project_status: true,
        },
      }),
      prisma.productionOrder.findMany({
        where: {
          tenant_id: tenantId,
          created_at: { gte: fromDate, lte: toDate },
        },
        include: {
          events: {
            orderBy: { created_at: 'asc' },
            select: {
              from_status: true,
              to_status: true,
              note: true,
              created_at: true,
            },
          },
        },
      }),
    ])

    const kpis = computeProcessKpis(projects, orders)
    const bottlenecks = computeBottlenecks(orders)

    const generatedAt = new Date().toISOString()

    if (body.data.format === 'csv') {
      const csv = buildProcessCsvExport(kpis, bottlenecks)
      return reply.send({
        format: 'csv',
        mime_type: 'text/csv',
        file_name: `process-report-${generatedAt.slice(0, 10)}.csv`,
        generated_at: generatedAt,
        content_base64: Buffer.from(csv, 'utf8').toString('base64'),
      })
    }

    const summary = buildProcessPdfSummary(kpis, bottlenecks)
    return reply.send({
      format: 'pdf',
      mime_type: 'application/pdf',
      file_name: `process-report-${generatedAt.slice(0, 10)}.pdf`,
      generated_at: generatedAt,
      content_base64: Buffer.from(summary, 'utf8').toString('base64'),
    })
  })
}

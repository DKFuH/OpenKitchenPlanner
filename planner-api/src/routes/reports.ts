import type { FastifyInstance, FastifyReply } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendConflict, sendForbidden, sendNotFound } from '../errors.js'

type TenantAwareRequest = {
  tenantId?: string | null
  headers?: Record<string, string | string[] | undefined>
}

type ReportDefinitionRecord = {
  id: string
  tenant_id: string
  name: string
  description: string | null
  dimensions: unknown
  metrics: unknown
  filters: unknown
  created_by: string
  created_at: Date
  updated_at: Date
}

type ReportScheduleRecord = {
  id: string
  report_definition_id: string
  cron_expression: string
  recipients: unknown
  format: 'pdf' | 'excel' | 'csv'
  enabled: boolean
  last_run_at: Date | null
  created_at: Date
  updated_at: Date
}

type ReportRunRecord = {
  id: string
  schedule_id: string | null
  tenant_id: string
  report_name: string
  generated_at: Date
  file_url: string | null
  status: 'pending' | 'running' | 'done' | 'failed'
  error: string | null
}

const CreateReportSchema = z.object({
  tenant_id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  dimensions: z.array(z.string()).default([]),
  metrics: z.array(z.string()).default([]),
  filters: z.record(z.unknown()).default({}),
  created_by: z.string().min(1).max(200).default('system'),
})

const UpdateReportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  dimensions: z.array(z.string()).optional(),
  metrics: z.array(z.string()).optional(),
  filters: z.record(z.unknown()).optional(),
})

const ReportIdParamsSchema = z.object({
  id: z.string().uuid(),
})

const BuiltinRevenueQuerySchema = z.object({
  tenantId: z.string().optional(),
  period: z.enum(['last_30_days', 'last_90_days', 'this_year']).default('last_30_days'),
})

const BuiltinTenantQuerySchema = z.object({
  tenantId: z.string().optional(),
})

const TopCategoriesQuerySchema = z.object({
  tenantId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

const RunsQuerySchema = z.object({
  tenantId: z.string().optional(),
})

const CreateScheduleSchema = z.object({
  cron_expression: z.string().min(9).max(100),
  recipients: z.array(z.string().email()).default([]),
  format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
  enabled: z.boolean().default(true),
})

const UpdateScheduleSchema = z.object({
  cron_expression: z.string().min(9).max(100).optional(),
  recipients: z.array(z.string().email()).optional(),
  format: z.enum(['pdf', 'excel', 'csv']).optional(),
  enabled: z.boolean().optional(),
})

const ScheduleParamsSchema = z.object({
  reportId: z.string().uuid(),
  scheduleId: z.string().uuid(),
})

const ReportScheduleListParamsSchema = z.object({
  id: z.string().uuid(),
})

const prismaReportDefinition = (prisma as unknown as Record<string, {
  create: (args: unknown) => Promise<unknown>
  findMany: (args: unknown) => Promise<unknown>
  findUnique: (args: unknown) => Promise<unknown>
  update: (args: unknown) => Promise<unknown>
  delete: (args: unknown) => Promise<unknown>
}>).reportDefinition

const prismaReportSchedule = (prisma as unknown as Record<string, {
  create: (args: unknown) => Promise<unknown>
  findMany: (args: unknown) => Promise<unknown>
  findUnique: (args: unknown) => Promise<unknown>
  update: (args: unknown) => Promise<unknown>
  delete: (args: unknown) => Promise<unknown>
}>).reportSchedule

const prismaReportRun = (prisma as unknown as Record<string, {
  create: (args: unknown) => Promise<unknown>
  findMany: (args: unknown) => Promise<unknown>
}>).reportRun

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

function enforceTenantScope(request: TenantAwareRequest, reply: FastifyReply, queryTenantId?: string): string | FastifyReply {
  const tenantId = getTenantId(request)
  if (!tenantId) {
    return sendForbidden(reply, 'Tenant scope is required')
  }

  if (queryTenantId && queryTenantId !== tenantId) {
    return sendForbidden(reply, 'Cross-tenant query is not allowed')
  }

  return tenantId
}

function resolveStartDate(period: 'last_30_days' | 'last_90_days' | 'this_year'): Date {
  const now = new Date()
  if (period === 'this_year') {
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
  }

  const days = period === 'last_90_days' ? 90 : 30
  const date = new Date(now)
  date.setUTCDate(date.getUTCDate() - days)
  return date
}

function dayDiff(from: Date, to: Date): number {
  const diffMs = Math.max(0, to.getTime() - from.getTime())
  return Math.round((diffMs / (1000 * 60 * 60 * 24)) * 100) / 100
}

async function getReportInTenant(reportId: string, tenantId: string): Promise<(ReportDefinitionRecord & { schedules?: ReportScheduleRecord[] }) | null> {
  const report = await prismaReportDefinition.findUnique({
    where: { id: reportId },
    include: { schedules: true },
  }) as (ReportDefinitionRecord & { schedules?: ReportScheduleRecord[] }) | null

  if (!report || report.tenant_id !== tenantId) {
    return null
  }

  return report
}

export async function reportRoutes(app: FastifyInstance) {
  app.post('/reports', async (request, reply) => {
    const parsed = CreateReportSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const tenantScoped = enforceTenantScope(request, reply, parsed.data.tenant_id)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const report = await prismaReportDefinition.create({
      data: {
        tenant_id: parsed.data.tenant_id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        dimensions: parsed.data.dimensions as Prisma.InputJsonValue,
        metrics: parsed.data.metrics as Prisma.InputJsonValue,
        filters: parsed.data.filters as Prisma.InputJsonValue,
        created_by: parsed.data.created_by,
      },
    })

    return reply.status(201).send(report)
  })

  app.get('/reports', async (request, reply) => {
    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const reports = await prismaReportDefinition.findMany({
      where: { tenant_id: tenantScoped },
      orderBy: { created_at: 'desc' },
    })

    return reply.send(reports)
  })

  app.get('/reports/runs', async (request, reply) => {
    const parsed = RunsQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid query')
    }

    const tenantScoped = enforceTenantScope(request, reply, parsed.data.tenantId)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const runs = await prismaReportRun.findMany({
      where: { tenant_id: tenantScoped },
      orderBy: { generated_at: 'desc' },
      take: 50,
    })

    return reply.send(runs)
  })

  app.get('/reports/builtin/revenue-by-period', async (request, reply) => {
    const parsed = BuiltinRevenueQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid query')
    }

    const tenantScoped = enforceTenantScope(request, reply, parsed.data.tenantId)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const fromDate = resolveStartDate(parsed.data.period)
    const projects = await prisma.project.findMany({
      where: {
        tenant_id: tenantScoped,
        created_at: { gte: fromDate },
      },
      select: {
        created_at: true,
        quote_value: true,
      },
    })

    const rowsMap = new Map<string, { revenue: number; count: number }>()
    for (const project of projects) {
      const date = new Date(project.created_at)
      const period = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      const current = rowsMap.get(period) ?? { revenue: 0, count: 0 }
      current.revenue += project.quote_value ?? 0
      current.count += 1
      rowsMap.set(period, current)
    }

    const rows = Array.from(rowsMap.entries())
      .map(([period, data]) => ({
        period,
        revenue: Math.round(data.revenue * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    return reply.send({ rows })
  })

  app.get('/reports/builtin/lead-funnel', async (request, reply) => {
    const parsed = BuiltinTenantQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid query')
    }

    const tenantScoped = enforceTenantScope(request, reply, parsed.data.tenantId)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const projects = await prisma.project.findMany({
      where: { tenant_id: tenantScoped },
      select: { project_status: true },
    })

    const statuses = ['lead', 'planning', 'quoted', 'contract', 'production', 'installed'] as const
    const stageCount = new Map<string, number>()
    for (const status of statuses) {
      stageCount.set(status, 0)
    }

    for (const project of projects) {
      stageCount.set(project.project_status, (stageCount.get(project.project_status) ?? 0) + 1)
    }

    const stages = statuses.map((status) => ({
      status,
      count: stageCount.get(status) ?? 0,
    }))

    return reply.send({ stages })
  })

  app.get('/reports/builtin/throughput', async (request, reply) => {
    const parsed = BuiltinTenantQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid query')
    }

    const tenantScoped = enforceTenantScope(request, reply, parsed.data.tenantId)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const projects = await prisma.project.findMany({
      where: { tenant_id: tenantScoped },
      select: {
        project_status: true,
        created_at: true,
        updated_at: true,
      },
    })

    const leadToContractSamples: number[] = []
    const contractToInstalledSamples: number[] = []

    for (const project of projects) {
      const spanDays = dayDiff(new Date(project.created_at), new Date(project.updated_at))
      if (['contract', 'production', 'installed'].includes(project.project_status)) {
        leadToContractSamples.push(spanDays)
      }
      if (project.project_status === 'installed') {
        contractToInstalledSamples.push(spanDays)
      }
    }

    const avgLeadToContractDays = leadToContractSamples.length > 0
      ? Math.round((leadToContractSamples.reduce((sum, value) => sum + value, 0) / leadToContractSamples.length) * 100) / 100
      : 0

    const avgContractToInstalledDays = contractToInstalledSamples.length > 0
      ? Math.round((contractToInstalledSamples.reduce((sum, value) => sum + value, 0) / contractToInstalledSamples.length) * 100) / 100
      : 0

    return reply.send({
      avg_lead_to_contract_days: avgLeadToContractDays,
      avg_contract_to_installed_days: avgContractToInstalledDays,
      sample_size: {
        lead_to_contract: leadToContractSamples.length,
        contract_to_installed: contractToInstalledSamples.length,
      },
      note: 'Approximation based on project.created_at and project.updated_at',
    })
  })

  app.get('/reports/builtin/top-categories', async (request, reply) => {
    const parsed = TopCategoriesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid query')
    }

    const tenantScoped = enforceTenantScope(request, reply, parsed.data.tenantId)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    return reply.send({
      rows: [],
      limit: parsed.data.limit,
      note: 'Not implemented: no category master data available yet',
    })
  })

  app.get('/reports/builtin/sales-ranking', async (request, reply) => {
    const parsed = BuiltinTenantQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid query')
    }

    const tenantScoped = enforceTenantScope(request, reply, parsed.data.tenantId)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const projects = await prisma.project.findMany({
      where: { tenant_id: tenantScoped },
      select: {
        assigned_to: true,
        quote_value: true,
      },
    })

    const rowsMap = new Map<string, { revenue: number; projects: number }>()
    for (const project of projects) {
      const salesRep = project.assigned_to ?? 'Unassigned'
      const current = rowsMap.get(salesRep) ?? { revenue: 0, projects: 0 }
      current.revenue += project.quote_value ?? 0
      current.projects += 1
      rowsMap.set(salesRep, current)
    }

    const rows = Array.from(rowsMap.entries())
      .map(([salesRep, data]) => ({
        sales_rep: salesRep,
        revenue: Math.round(data.revenue * 100) / 100,
        projects: data.projects,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return reply.send({ rows })
  })

  app.get<{ Params: { id: string } }>('/reports/:id', async (request, reply) => {
    const params = ReportIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid report id')
    }

    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const report = await getReportInTenant(params.data.id, tenantScoped)
    if (!report) {
      return sendNotFound(reply, 'Report not found')
    }

    return reply.send(report)
  })

  app.put<{ Params: { id: string } }>('/reports/:id', async (request, reply) => {
    const params = ReportIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid report id')
    }

    const parsed = UpdateReportSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const existing = await getReportInTenant(params.data.id, tenantScoped)
    if (!existing) {
      return sendNotFound(reply, 'Report not found')
    }

    const updated = await prismaReportDefinition.update({
      where: { id: params.data.id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.dimensions !== undefined && { dimensions: parsed.data.dimensions as Prisma.InputJsonValue }),
        ...(parsed.data.metrics !== undefined && { metrics: parsed.data.metrics as Prisma.InputJsonValue }),
        ...(parsed.data.filters !== undefined && { filters: parsed.data.filters as Prisma.InputJsonValue }),
      },
    })

    return reply.send(updated)
  })

  app.delete<{ Params: { id: string } }>('/reports/:id', async (request, reply) => {
    const params = ReportIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid report id')
    }

    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const report = await getReportInTenant(params.data.id, tenantScoped)
    if (!report) {
      return sendNotFound(reply, 'Report not found')
    }

    const hasActiveSchedules = (report.schedules ?? []).some((schedule) => schedule.enabled)
    if (hasActiveSchedules) {
      return sendConflict(reply, 'Cannot delete report with active schedules')
    }

    await prismaReportDefinition.delete({ where: { id: params.data.id } })
    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>('/reports/:id/schedules', async (request, reply) => {
    const params = ReportScheduleListParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid report id')
    }

    const parsed = CreateScheduleSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const report = await getReportInTenant(params.data.id, tenantScoped)
    if (!report) {
      return sendNotFound(reply, 'Report not found')
    }

    const schedule = await prismaReportSchedule.create({
      data: {
        report_definition_id: params.data.id,
        cron_expression: parsed.data.cron_expression,
        recipients: parsed.data.recipients as Prisma.InputJsonValue,
        format: parsed.data.format,
        enabled: parsed.data.enabled,
      },
    })

    return reply.status(201).send(schedule)
  })

  app.get<{ Params: { id: string } }>('/reports/:id/schedules', async (request, reply) => {
    const params = ReportScheduleListParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid report id')
    }

    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const report = await getReportInTenant(params.data.id, tenantScoped)
    if (!report) {
      return sendNotFound(reply, 'Report not found')
    }

    const schedules = await prismaReportSchedule.findMany({
      where: { report_definition_id: params.data.id },
      orderBy: { created_at: 'desc' },
    })

    return reply.send(schedules)
  })

  app.put<{ Params: { reportId: string; scheduleId: string } }>('/reports/:reportId/schedules/:scheduleId', async (request, reply) => {
    const params = ScheduleParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid params')
    }

    const parsed = UpdateScheduleSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const report = await getReportInTenant(params.data.reportId, tenantScoped)
    if (!report) {
      return sendNotFound(reply, 'Report not found')
    }

    const schedule = await prismaReportSchedule.findUnique({ where: { id: params.data.scheduleId } }) as ReportScheduleRecord | null
    if (!schedule || schedule.report_definition_id !== params.data.reportId) {
      return sendNotFound(reply, 'Schedule not found')
    }

    const updated = await prismaReportSchedule.update({
      where: { id: params.data.scheduleId },
      data: {
        ...(parsed.data.cron_expression !== undefined && { cron_expression: parsed.data.cron_expression }),
        ...(parsed.data.recipients !== undefined && { recipients: parsed.data.recipients as Prisma.InputJsonValue }),
        ...(parsed.data.format !== undefined && { format: parsed.data.format }),
        ...(parsed.data.enabled !== undefined && { enabled: parsed.data.enabled }),
      },
    })

    return reply.send(updated)
  })

  app.delete<{ Params: { reportId: string; scheduleId: string } }>('/reports/:reportId/schedules/:scheduleId', async (request, reply) => {
    const params = ScheduleParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid params')
    }

    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const report = await getReportInTenant(params.data.reportId, tenantScoped)
    if (!report) {
      return sendNotFound(reply, 'Report not found')
    }

    const schedule = await prismaReportSchedule.findUnique({ where: { id: params.data.scheduleId } }) as ReportScheduleRecord | null
    if (!schedule || schedule.report_definition_id !== params.data.reportId) {
      return sendNotFound(reply, 'Schedule not found')
    }

    await prismaReportSchedule.delete({ where: { id: params.data.scheduleId } })
    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>('/reports/:id/run', async (request, reply) => {
    const params = ReportScheduleListParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid report id')
    }

    const tenantScoped = enforceTenantScope(request, reply)
    if (typeof tenantScoped !== 'string') {
      return tenantScoped
    }

    const report = await getReportInTenant(params.data.id, tenantScoped)
    if (!report) {
      return sendNotFound(reply, 'Report not found')
    }

    const run = await prismaReportRun.create({
      data: {
        tenant_id: tenantScoped,
        report_name: report.name,
        status: 'done',
        file_url: null,
      },
    }) as ReportRunRecord

    return reply.status(201).send(run)
  })
}

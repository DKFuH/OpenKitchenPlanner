import { api } from './client.js'

export type ReportFormat = 'pdf' | 'excel' | 'csv'
export type ReportRunStatus = 'pending' | 'running' | 'done' | 'failed'

export interface ReportDefinition {
  id: string
  tenant_id: string
  name: string
  description: string | null
  dimensions: string[]
  metrics: string[]
  filters: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
  schedules?: ReportSchedule[]
}

export interface ReportSchedule {
  id: string
  report_definition_id: string
  cron_expression: string
  recipients: string[]
  format: ReportFormat
  enabled: boolean
  last_run_at: string | null
  created_at: string
}

export interface ReportRun {
  id: string
  tenant_id: string
  report_name: string
  generated_at: string
  file_url: string | null
  status: ReportRunStatus
  error: string | null
}

export interface RevenueByPeriodResponse {
  rows: { period: string; revenue: number; count: number }[]
}

export interface LeadFunnelResponse {
  stages: { status: string; count: number }[]
}

export interface SalesRankingResponse {
  rows: { sales_rep: string; revenue: number; projects: number }[]
}

export const reportsApi = {
  list: (tenantId: string) =>
    api.get<ReportDefinition[]>('/reports', { 'X-Tenant-Id': tenantId }),

  get: (tenantId: string, id: string) =>
    api.get<ReportDefinition>(`/reports/${id}`, { 'X-Tenant-Id': tenantId }),

  create: (tenantId: string, data: object) =>
    api.post<ReportDefinition>('/reports', data, { 'X-Tenant-Id': tenantId }),

  update: (tenantId: string, id: string, data: object) =>
    api.put<ReportDefinition>(`/reports/${id}`, data, { 'X-Tenant-Id': tenantId }),

  delete: (tenantId: string, id: string) =>
    api.delete(`/reports/${id}`, { 'X-Tenant-Id': tenantId }),

  revenueByPeriod: (tenantId: string, period = 'last_30_days') =>
    api.get<RevenueByPeriodResponse>(
      `/reports/builtin/revenue-by-period?period=${period}`,
      { 'X-Tenant-Id': tenantId },
    ),

  leadFunnel: (tenantId: string) =>
    api.get<LeadFunnelResponse>('/reports/builtin/lead-funnel', { 'X-Tenant-Id': tenantId }),

  salesRanking: (tenantId: string) =>
    api.get<SalesRankingResponse>('/reports/builtin/sales-ranking', { 'X-Tenant-Id': tenantId }),

  createSchedule: (tenantId: string, reportId: string, data: object) =>
    api.post<ReportSchedule>(`/reports/${reportId}/schedules`, data, { 'X-Tenant-Id': tenantId }),

  deleteSchedule: (tenantId: string, reportId: string, scheduleId: string) =>
    api.delete(`/reports/${reportId}/schedules/${scheduleId}`, { 'X-Tenant-Id': tenantId }),

  run: (tenantId: string, reportId: string) =>
    api.post<ReportRun>(`/reports/${reportId}/run`, {}, { 'X-Tenant-Id': tenantId }),

  listRuns: (tenantId: string) =>
    api.get<ReportRun[]>('/reports/runs', { 'X-Tenant-Id': tenantId }),
}

type DateLike = Date | string

type ProjectLike = {
  id: string
  created_at: DateLike
  updated_at: DateLike
  project_status: string
}

type ProductionOrderLike = {
  id: string
  project_id: string
  status: string
  created_at: DateLike
  updated_at: DateLike
  events: Array<{
    from_status: string | null
    to_status: string
    note: string | null
    created_at: DateLike
  }>
}

function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function diffDays(start: DateLike, end: DateLike): number {
  const startMs = toDate(start).getTime()
  const endMs = toDate(end).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0
  }

  return round2((endMs - startMs) / (1000 * 60 * 60 * 24))
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  return round2(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function firstEventAt(order: ProductionOrderLike, toStatus: string): Date | null {
  const event = [...order.events]
    .filter((entry) => entry.to_status === toStatus)
    .sort((a, b) => toDate(a.created_at).getTime() - toDate(b.created_at).getTime())[0]
  return event ? toDate(event.created_at) : null
}

export function computeProcessKpis(projects: ProjectLike[], orders: ProductionOrderLike[]) {
  const leadToQuoteDurations = projects
    .filter((project) => ['quoted', 'contract', 'production', 'installed', 'archived'].includes(project.project_status))
    .map((project) => diffDays(project.created_at, project.updated_at))

  const quoteToProductionDurations = orders
    .map((order) => {
      const startedAt = firstEventAt(order, 'in_production')
      if (!startedAt) {
        return null
      }
      return diffDays(order.created_at, startedAt)
    })
    .filter((value): value is number => value !== null)

  const productionToInstallDurations = orders
    .map((order) => {
      const startedAt = firstEventAt(order, 'in_production')
      const installedAt = firstEventAt(order, 'installed')
      if (!startedAt || !installedAt) {
        return null
      }
      return diffDays(startedAt, installedAt)
    })
    .filter((value): value is number => value !== null)

  const blockedOrders = orders.filter((order) => {
    if (order.status === 'installed') {
      return false
    }

    return order.events.some((event) => (event.note ?? '').includes('[issue:'))
  }).length

  return {
    total_orders: orders.length,
    lead_to_quote_days_avg: average(leadToQuoteDurations),
    quote_to_production_days_avg: average(quoteToProductionDurations),
    production_to_install_days_avg: average(productionToInstallDurations),
    blocked_orders: blockedOrders,
  }
}

export function computeBottlenecks(orders: ProductionOrderLike[], now: Date = new Date()) {
  const groups = new Map<string, { count: number; ageDays: number }>()

  for (const order of orders) {
    if (order.status === 'installed') {
      continue
    }

    const current = groups.get(order.status) ?? { count: 0, ageDays: 0 }
    current.count += 1
    current.ageDays += diffDays(order.updated_at, now)
    groups.set(order.status, current)
  }

  return Array.from(groups.entries())
    .map(([status, values]) => ({
      status,
      order_count: values.count,
      avg_age_days: values.count > 0 ? round2(values.ageDays / values.count) : 0,
    }))
    .sort((a, b) => b.avg_age_days - a.avg_age_days)
}

export function buildProcessCsvExport(
  kpis: ReturnType<typeof computeProcessKpis>,
  bottlenecks: ReturnType<typeof computeBottlenecks>,
): string {
  const lines = [
    'section,key,value',
    `kpi,total_orders,${kpis.total_orders}`,
    `kpi,lead_to_quote_days_avg,${kpis.lead_to_quote_days_avg}`,
    `kpi,quote_to_production_days_avg,${kpis.quote_to_production_days_avg}`,
    `kpi,production_to_install_days_avg,${kpis.production_to_install_days_avg}`,
    `kpi,blocked_orders,${kpis.blocked_orders}`,
  ]

  for (const item of bottlenecks) {
    lines.push(`bottleneck,${item.status}_order_count,${item.order_count}`)
    lines.push(`bottleneck,${item.status}_avg_age_days,${item.avg_age_days}`)
  }

  return lines.join('\n')
}

export function buildProcessPdfSummary(
  kpis: ReturnType<typeof computeProcessKpis>,
  bottlenecks: ReturnType<typeof computeBottlenecks>,
): string {
  const lines = [
    'Process Reporting Summary',
    `Total orders: ${kpis.total_orders}`,
    `Lead to quote avg days: ${kpis.lead_to_quote_days_avg}`,
    `Quote to production avg days: ${kpis.quote_to_production_days_avg}`,
    `Production to install avg days: ${kpis.production_to_install_days_avg}`,
    `Blocked orders: ${kpis.blocked_orders}`,
    '',
    'Bottlenecks',
    ...bottlenecks.map((entry) => `- ${entry.status}: count=${entry.order_count}, avg_age_days=${entry.avg_age_days}`),
  ]

  return lines.join('\n')
}

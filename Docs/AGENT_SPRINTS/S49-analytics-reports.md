# Sprint 49 – Erweiterte Analytics & individuelle Reports

**Branch:** `feature/sprint-49-analytics-reports`
**Gruppe:** A (sofort startbar, keine Konflikte mit anderen Gruppe-A-Sprints)
**Status:** `planned`

---

## Ziel

Report-Builder: konfigurierbare Dimensionen/Metriken, 5 Standard-Reports,
Drill-down, geplante E-Mail-Verteilung als PDF/Excel.

---

## 1. Prisma-Schema-Ergänzungen

Ans **Ende** von `planner-api/prisma/schema.prisma` anhängen:

```prisma
// ─────────────────────────────────────────
// PHASE 6 – Sprint 49: Analytics & Reports
// ─────────────────────────────────────────

model ReportDefinition {
  id          String   @id @default(uuid())
  tenant_id   String
  name        String   @db.VarChar(200)
  description String?
  dimensions  Json     @default("[]")  // ["period","branch","sales_rep","category"]
  metrics     Json     @default("[]")  // ["revenue","margin","conversion"]
  filters     Json     @default("{}")  // { period: "last_30_days", branch_id: null }
  created_by  String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  schedules   ReportSchedule[]

  @@index([tenant_id])
  @@map("report_definitions")
}

model ReportSchedule {
  id                   String           @id @default(uuid())
  report_definition_id String
  cron_expression      String           @db.VarChar(100) // "0 8 * * 1" = Mo 8:00
  recipients           Json             @default("[]")  // ["email@example.com"]
  format               ReportFormat     @default(pdf)
  enabled              Boolean          @default(true)
  last_run_at          DateTime?
  created_at           DateTime         @default(now())
  updated_at           DateTime         @updatedAt

  report_definition    ReportDefinition @relation(fields: [report_definition_id], references: [id], onDelete: Cascade)
  runs                 ReportRun[]

  @@index([report_definition_id])
  @@map("report_schedules")
}

enum ReportFormat {
  pdf
  excel
  csv
}

model ReportRun {
  id           String         @id @default(uuid())
  schedule_id  String?
  tenant_id    String
  report_name  String
  generated_at DateTime       @default(now())
  file_url     String?
  status       ReportRunStatus @default(pending)
  error        String?

  schedule     ReportSchedule? @relation(fields: [schedule_id], references: [id], onDelete: SetNull)

  @@index([tenant_id, generated_at])
  @@map("report_runs")
}

enum ReportRunStatus {
  pending
  running
  done
  failed
}
```

---

## 2. Neue Datei: `planner-api/src/routes/reports.ts`

Implementiere folgende Endpunkte:

### CRUD für Report-Definitionen
- `POST /reports` – erstelle Report-Definition (Zod-Validierung: name, tenant_id, dimensions, metrics, filters)
- `GET /reports` – liste alle Reports für `request.tenantId`
- `GET /reports/:id` – einzelner Report inkl. schedules
- `PUT /reports/:id` – aktualisieren
- `DELETE /reports/:id` – löschen (nur wenn keine aktiven Schedules)

### 5 Standard-Reports (GET-Endpunkte, geben aggregierte Daten zurück)
- `GET /reports/builtin/revenue-by-period?tenantId=&period=last_30_days|last_90_days|this_year`
  → Aggregiert aus `projects`: Summe `quote_value` nach Monat
  → Rückgabe: `{ rows: [{ period: "2026-01", revenue: 45000, count: 12 }] }`

- `GET /reports/builtin/lead-funnel?tenantId=`
  → Zählt Projekte nach `project_status` (lead/planning/quoted/contract/production/installed)
  → Rückgabe: `{ stages: [{ status: "lead", count: 45 }, ...] }`

- `GET /reports/builtin/throughput?tenantId=`
  → Durchschnittliche Tage von `lead` bis `contract` und von `contract` bis `installed`
  → Aggregierung aus `project.created_at` und `project.updated_at` (Annäherung)

- `GET /reports/builtin/top-categories?tenantId=&limit=10`
  → Nicht implementiert (keine Warengruppen-Daten vorhanden): gibt leeres Array + Hinweis zurück

- `GET /reports/builtin/sales-ranking?tenantId=`
  → Aggregiert `quote_value` nach `assigned_to` (sales_rep)
  → Rückgabe: `{ rows: [{ sales_rep: "Anna M.", revenue: 120000, projects: 8 }] }`

### Schedule-CRUD
- `POST /reports/:id/schedules` – Zod: cron_expression (min length 9), recipients array, format
- `GET /reports/:id/schedules` – liste Schedules für Report
- `PUT /reports/:reportId/schedules/:scheduleId` – aktualisieren
- `DELETE /reports/:reportId/schedules/:scheduleId` – löschen

### Report-Run
- `POST /reports/:id/run` – erstellt manuellen ReportRun mit status=done und file_url=null (PDF-Generierung: Stub)
- `GET /reports/runs?tenantId=` – letzte 50 Runs

Alle Routes exportieren als `export async function reportRoutes(app: FastifyInstance)`.

---

## 3. Neue Datei: `planner-api/src/routes/reports.test.ts`

Mindest-Tests (15):
1. `POST /reports` → 201 mit valid payload
2. `POST /reports` → 400 ohne name
3. `GET /reports` → 200 array
4. `GET /reports/:id` → 200
5. `GET /reports/:id` → 404
6. `PUT /reports/:id` → 200
7. `DELETE /reports/:id` → 204
8. `GET /reports/builtin/revenue-by-period` → 200 mit `rows` array
9. `GET /reports/builtin/lead-funnel` → 200 mit `stages` array
10. `GET /reports/builtin/sales-ranking` → 200 mit `rows` array
11. `POST /reports/:id/schedules` → 201
12. `POST /reports/:id/schedules` → 400 invalid cron
13. `DELETE /reports/:reportId/schedules/:scheduleId` → 204
14. `POST /reports/:id/run` → 201 mit status=done
15. `GET /reports/runs` → 200 array

---

## 4. `planner-api/src/index.ts` – Route registrieren

```typescript
import { reportRoutes } from './routes/reports.js'
// ...
await app.register(reportRoutes, { prefix: '/api/v1' })
```

---

## 5. Frontend-API: `planner-frontend/src/api/reports.ts`

```typescript
import { api } from './client.js'

export type ReportFormat = 'pdf' | 'excel' | 'csv'
export type ReportRunStatus = 'pending' | 'running' | 'done' | 'failed'

export interface ReportDefinition {
  id: string; tenant_id: string; name: string; description: string | null
  dimensions: string[]; metrics: string[]; filters: Record<string, unknown>
  created_by: string; created_at: string; updated_at: string
  schedules?: ReportSchedule[]
}

export interface ReportSchedule {
  id: string; report_definition_id: string; cron_expression: string
  recipients: string[]; format: ReportFormat; enabled: boolean
  last_run_at: string | null; created_at: string
}

export interface ReportRun {
  id: string; tenant_id: string; report_name: string
  generated_at: string; file_url: string | null
  status: ReportRunStatus; error: string | null
}

export const reportsApi = {
  list: () => api.get<ReportDefinition[]>('/reports'),
  get: (id: string) => api.get<ReportDefinition>(`/reports/${id}`),
  create: (data: object) => api.post<ReportDefinition>('/reports', data),
  update: (id: string, data: object) => api.put<ReportDefinition>(`/reports/${id}`, data),
  delete: (id: string) => api.delete(`/reports/${id}`),

  // Standard-Reports
  revenuByPeriod: (period = 'last_30_days') =>
    api.get<{ rows: { period: string; revenue: number; count: number }[] }>(
      `/reports/builtin/revenue-by-period?period=${period}`
    ),
  leadFunnel: () =>
    api.get<{ stages: { status: string; count: number }[] }>('/reports/builtin/lead-funnel'),
  salesRanking: () =>
    api.get<{ rows: { sales_rep: string; revenue: number; projects: number }[] }>(
      '/reports/builtin/sales-ranking'
    ),

  // Schedules
  createSchedule: (reportId: string, data: object) =>
    api.post<ReportSchedule>(`/reports/${reportId}/schedules`, data),
  deleteSchedule: (reportId: string, scheduleId: string) =>
    api.delete(`/reports/${reportId}/schedules/${scheduleId}`),

  // Runs
  run: (reportId: string) => api.post<ReportRun>(`/reports/${reportId}/run`, {}),
  listRuns: () => api.get<ReportRun[]>('/reports/runs'),
}
```

---

## 6. Frontend-Seite: `planner-frontend/src/pages/ReportsPage.tsx`

Erstelle eine Seite `/reports` mit 3 Tabs:

**Tab 1: Standard-Reports**
- 3 Karten: „Umsatz nach Zeitraum" (Bar-Chart als SVG-Balken), „Lead-Trichter" (Trichterdiagramm als gestapelte Bars), „Verkäufer-Ranking" (Tabelle)
- Für jede Karte: Lade-Spinner + Fehleranzeige
- Charts als einfache SVG-Inline-Visualisierung (keine externe Chart-Bibliothek!)

**Tab 2: Report-Builder**
- Liste gespeicherter Report-Definitionen
- „Neuer Report"-Button → Modal mit Feldern: Name, Beschreibung, Dimensionen (Multi-Checkbox), Metriken (Multi-Checkbox)
- „Ausführen"-Button pro Report → Erstellt ReportRun, zeigt Status

**Tab 3: Ausführungshistorie**
- Tabelle: Report-Name, Datum, Status, Download-Link (falls file_url)

Route: `<Route path="/reports" element={<ReportsPage />} />`

---

## DoD-Checkliste

- [ ] `npx vitest run src/routes/reports.test.ts` → 15+ Tests grün
- [ ] `GET /api/v1/reports/builtin/lead-funnel` gibt `stages`-Array zurück
- [ ] `GET /api/v1/reports/builtin/revenue-by-period` gibt `rows`-Array zurück
- [ ] `POST /api/v1/reports/:id/schedules` validiert cron_expression
- [ ] ROADMAP.md Sprint 49 Status → `done`
- [ ] Commit + PR `feature/sprint-49-analytics-reports`

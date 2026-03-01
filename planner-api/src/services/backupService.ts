import { prisma } from '../db.js'
import { writeDocumentBlob } from './documentStorage.js'

const prismaBackupSnapshot = (prisma as unknown as {
  backupSnapshot?: {
    create: (args: unknown) => Promise<unknown>
  }
}).backupSnapshot

export async function createDailyTenantBackup(tenantId: string, triggeredBy: string) {
  const [projects, quotes] = await Promise.all([
    prisma.project.findMany({
      where: { tenant_id: tenantId },
      include: {
        rooms: true,
        documents: true,
        import_jobs: true,
        render_jobs: {
          include: {
            result: true,
          },
        },
      },
    }),
    prisma.quote.findMany({
      where: {
        project: { tenant_id: tenantId },
      },
      include: {
        items: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ])

  const payload = {
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
    triggered_by: triggeredBy,
    projects,
    quotes,
  }

  const buffer = Buffer.from(JSON.stringify(payload, null, 2), 'utf8')
  const stored = await writeDocumentBlob({
    tenantId,
    projectId: 'tenant-backups',
    filename: `daily-backup-${new Date().toISOString().slice(0, 10)}.json`,
    buffer,
  })

  if (!prismaBackupSnapshot) {
    return {
      id: null,
      tenant_id: tenantId,
      storage_key: stored.storage_key,
      entity_count: projects.length + quotes.length,
      triggered_by: triggeredBy,
    }
  }

  return prismaBackupSnapshot.create({
    data: {
      tenant_id: tenantId,
      scope: 'daily_snapshot',
      status: 'done',
      storage_provider: stored.storage_provider,
      storage_bucket: stored.storage_bucket,
      storage_key: stored.storage_key,
      entity_count: projects.length + quotes.length,
      triggered_by: triggeredBy,
    },
  })
}

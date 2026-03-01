import type { NotificationEventType } from '@prisma/client'
import { prisma } from '../db.js'

interface QueueNotificationInput {
  tenantId: string
  eventType: NotificationEventType
  entityType: string
  entityId: string
  recipientEmail: string
  subject: string
  message: string
  metadata?: Record<string, unknown>
}

const prismaNotificationEvent = (prisma as unknown as {
  notificationEvent?: {
    create: (args: unknown) => Promise<unknown>
  }
}).notificationEvent

export async function queueNotification(input: QueueNotificationInput) {
  if (!prismaNotificationEvent) {
    return null
  }

  return prismaNotificationEvent.create({
    data: {
      tenant_id: input.tenantId,
      event_type: input.eventType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      recipient_email: input.recipientEmail,
      subject: input.subject,
      message: input.message,
      metadata_json: input.metadata ?? {},
      delivery_status: 'queued',
    },
  })
}

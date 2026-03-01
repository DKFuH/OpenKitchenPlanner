import { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import type { ExportPayload } from '@yakds/shared-schemas'
import { exportToDxf } from '@yakds/dxf-export'

import { sendBadRequest } from '../errors.js'

const PointSchema = z.object({
  x_mm: z.number(),
  y_mm: z.number(),
})

const ExportRequestSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  allow_dxf_fallback: z.boolean().optional(),
  payload: z.object({
    room: z.object({
      boundary: z.array(
        z.object({
          id: z.string().min(1),
          x_mm: z.number(),
          y_mm: z.number(),
          index: z.number().int().nonnegative(),
        }),
      ).min(3),
    }),
    wallSegments: z.array(
      z.object({
        id: z.string().min(1),
        start: PointSchema,
        end: PointSchema,
        length_mm: z.number().positive(),
      }),
    ),
    openings: z.array(
      z.object({
        id: z.string().min(1),
        wall_id: z.string().min(1),
        offset_mm: z.number().min(0),
        width_mm: z.number().positive(),
        height_mm: z.number().positive().optional(),
        sill_height_mm: z.number().min(0).optional(),
        type: z.enum(['door', 'window', 'pass-through']).optional(),
        source: z.enum(['manual', 'cad_import']).optional(),
      }),
    ).default([]),
    furniture: z.array(
      z.object({
        id: z.string().min(1),
        footprintRect: z.object({
          min: PointSchema,
          max: PointSchema,
        }),
      }),
    ).default([]),
    includeFurniture: z.boolean().default(true),
  }),
})

function normalizeFilename(filename?: string): string {
  const trimmed = filename?.trim() || 'yakds-export.dxf'
  return trimmed.toLowerCase().endsWith('.dxf') ? trimmed : `${trimmed}.dxf`
}

function normalizeDwgFilename(filename?: string): string {
  const trimmed = filename?.trim() || 'yakds-export.dwg'
  return trimmed.toLowerCase().endsWith('.dwg') ? trimmed : `${trimmed}.dwg`
}

export async function exportRoutes(app: FastifyInstance) {
  const dxfHandler = async (request: { body: unknown }, reply: FastifyReply) => {
    const parsed = ExportRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply as never, parsed.error.errors[0].message)
    }

    const dxf = exportToDxf(parsed.data.payload as ExportPayload)
    const filename = normalizeFilename(parsed.data.filename)

    reply.header('content-disposition', `attachment; filename="${filename}"`)
    reply.type('application/dxf; charset=utf-8')
    return reply.send(dxf)
  }

  const dwgHandler = async (request: { body: unknown }, reply: FastifyReply) => {
    const parsed = ExportRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply as never, parsed.error.errors[0].message)
    }

    if (!parsed.data.allow_dxf_fallback) {
      return reply.status(501).send({
        error: 'DWG_EXPORT_NOT_AVAILABLE',
        message: 'Native DWG export is not wired yet. Use /exports/dxf or set allow_dxf_fallback=true.',
      })
    }

    const dxf = exportToDxf(parsed.data.payload as ExportPayload)
    const requestedFilename = normalizeDwgFilename(parsed.data.filename)
    const fallbackFilename = requestedFilename.replace(/\.dwg$/i, '.dxf')

    reply.header('x-yakds-export-fallback', 'dwg->dxf')
    reply.header('content-disposition', `attachment; filename="${fallbackFilename}"`)
    reply.type('application/dxf; charset=utf-8')
    return reply.send(dxf)
  }

  app.post('/exports/dxf', dxfHandler)
  app.post('/projects/:projectId/export-dxf', dxfHandler)
  app.post('/exports/dwg', dwgHandler)
  app.post('/projects/:projectId/export-dwg', dwgHandler)
}

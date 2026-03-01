import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    $transaction: vi.fn(),
    project: {
      findUnique: vi.fn(),
    },
    blockProgram: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    blockGroup: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    blockDefinitionRecord: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    blockCondition: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    projectBlockEvaluation: {
      findMany: vi.fn(),
    },
  }

  prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock))

  return { prismaMock }
})

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { blockRoutes } from './blocks.js'

const programId = '12121212-1212-1212-1212-121212121212'
const projectId = '34343434-3434-3434-3434-343434343434'

function createStoredProgram() {
  return {
    id: programId,
    name: 'Nobilia Blocks',
    manufacturer: 'Nobilia',
    notes: 'Fruehjahr 2026',
    is_active: true,
    created_at: new Date('2026-03-01T00:00:00.000Z'),
    updated_at: new Date('2026-03-01T12:00:00.000Z'),
    groups: [
      {
        id: 'group-1',
        code: 'BASE',
        name: 'Base Cabinets',
        item_selector: { type: 'base_cabinet' },
      },
    ],
    conditions: [
      {
        id: 'cond-program-1',
        block_definition_id: null,
        field: 'subtotal_net',
        operator: 'gte',
        value: 1000,
      },
    ],
    definitions: [
      {
        id: 'def-1',
        name: 'Spring Block',
        basis: 'purchase_price',
        tiers: [{ min_value: 1000, discount_pct: 8 }],
        sort_order: 0,
        group: {
          id: 'group-1',
          code: 'BASE',
          name: 'Base Cabinets',
          item_selector: { type: 'base_cabinet' },
        },
        conditions: [
          {
            id: 'cond-def-1',
            block_definition_id: 'def-1',
            field: 'lead_status',
            operator: 'eq',
            value: 'quoted',
          },
        ],
      },
    ],
  }
}

describe('blockRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock))
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId })
    prismaMock.blockProgram.findMany.mockResolvedValue([])
    prismaMock.blockProgram.findUnique.mockResolvedValue(null)
    prismaMock.blockProgram.create.mockResolvedValue({ id: programId })
    prismaMock.blockProgram.update.mockResolvedValue({ id: programId })
    prismaMock.blockGroup.create.mockResolvedValue({ id: 'group-1' })
    prismaMock.blockDefinitionRecord.create.mockResolvedValue({ id: 'def-1' })
    prismaMock.blockGroup.deleteMany.mockResolvedValue({ count: 0 })
    prismaMock.blockDefinitionRecord.deleteMany.mockResolvedValue({ count: 0 })
    prismaMock.blockCondition.deleteMany.mockResolvedValue({ count: 0 })
    prismaMock.blockCondition.createMany.mockResolvedValue({ count: 1 })
    prismaMock.projectBlockEvaluation.findMany.mockResolvedValue([])
  })

  it('lists stored block programs', async () => {
    prismaMock.blockProgram.findMany.mockResolvedValue([createStoredProgram()])

    const app = Fastify()
    await app.register(blockRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/block-programs',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      expect.objectContaining({
        id: programId,
        name: 'Nobilia Blocks',
      }),
    ])

    await app.close()
  })

  it('creates a block program with groups, definitions and conditions', async () => {
    prismaMock.blockProgram.findUnique.mockResolvedValue(createStoredProgram())

    const app = Fastify()
    await app.register(blockRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/block-programs',
      payload: {
        name: 'Nobilia Blocks',
        manufacturer: 'Nobilia',
        notes: 'Fruehjahr 2026',
        is_active: true,
        groups: [
          {
            code: 'BASE',
            name: 'Base Cabinets',
            item_selector: { type: 'base_cabinet' },
          },
        ],
        conditions: [
          {
            field: 'subtotal_net',
            operator: 'gte',
            value: 1000,
          },
        ],
        definitions: [
          {
            name: 'Spring Block',
            basis: 'purchase_price',
            group_code: 'BASE',
            sort_order: 0,
            tiers: [{ min_value: 1000, discount_pct: 8 }],
            conditions: [
              {
                field: 'lead_status',
                operator: 'eq',
                value: 'quoted',
              },
            ],
          },
        ],
      },
    })

    expect(response.statusCode).toBe(201)
    expect(prismaMock.blockProgram.create).toHaveBeenCalled()
    expect(prismaMock.blockCondition.createMany).toHaveBeenCalledTimes(2)
    expect(response.json().definitions[0].group_code).toBe('BASE')

    await app.close()
  })

  it('updates an existing block program', async () => {
    prismaMock.blockProgram.findUnique
      .mockResolvedValueOnce({ id: programId })
      .mockResolvedValueOnce(createStoredProgram())

    const app = Fastify()
    await app.register(blockRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/block-programs/${programId}`,
      payload: {
        name: 'Updated Blocks',
        manufacturer: null,
        notes: null,
        is_active: false,
        groups: [],
        conditions: [],
        definitions: [
          {
            name: 'Fallback Block',
            basis: 'sell_price',
            group_code: null,
            sort_order: 0,
            tiers: [{ min_value: 500, discount_pct: 4 }],
            conditions: [],
          },
        ],
      },
    })

    expect(response.statusCode).toBe(200)
    expect(prismaMock.blockProgram.update).toHaveBeenCalledWith({
      where: { id: programId },
      data: {
        name: 'Updated Blocks',
        manufacturer: null,
        notes: null,
        is_active: false,
      },
    })

    await app.close()
  })

  it('returns stored project block evaluations', async () => {
    prismaMock.projectBlockEvaluation.findMany.mockResolvedValue([
      {
        id: 'eval-1',
        project_id: projectId,
        program_id: programId,
        created_at: new Date('2026-03-01T16:00:00.000Z'),
        price_summary: { subtotal_net: 1200 },
        evaluations: [{ block_id: 'def-1' }],
        best_block: { block_id: 'def-1', recommended: true },
        program: {
          id: programId,
          name: 'Nobilia Blocks',
        },
      },
    ])

    const app = Fastify()
    await app.register(blockRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/block-evaluations`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      expect.objectContaining({
        id: 'eval-1',
        project_id: projectId,
        program_name: 'Nobilia Blocks',
      }),
    ])

    await app.close()
  })
})

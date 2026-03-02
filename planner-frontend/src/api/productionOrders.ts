import { api } from './client.js'

export type ProductionOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'delivered'
  | 'installed'

export interface ProductionOrderEvent {
  id: string
  production_order_id: string
  from_status: string | null
  to_status: string
  user_id: string | null
  note: string | null
  created_at: string
}

export interface ProductionOrderSummary {
  id: string
  supplier_name: string
  status: string
}

export interface ProductionOrder {
  id: string
  project_id: string
  tenant_id: string
  quote_id: string | null
  bom_snapshot: Record<string, unknown>
  status: ProductionOrderStatus
  due_date: string | null
  created_by: string
  notes: string | null
  frozen_at: string | null
  created_at: string
  updated_at: string
  events: ProductionOrderEvent[]
  purchase_orders: ProductionOrderSummary[]
}

export interface FreezeStatus {
  frozen: boolean
  production_order: { id: string; status: ProductionOrderStatus; frozen_at: string } | null
}

export const productionOrdersApi = {
  list(projectId: string) {
    return api.get<ProductionOrder[]>(`/projects/${projectId}/production-orders`)
  },

  get(id: string) {
    return api.get<ProductionOrder>(`/production-orders/${id}`)
  },

  create(projectId: string, data: { created_by: string; quote_id?: string; notes?: string; due_date?: string }) {
    return api.post<ProductionOrder>(`/projects/${projectId}/production-orders`, data)
  },

  updateStatus(id: string, status: ProductionOrderStatus, userId?: string, note?: string) {
    return api.patch<ProductionOrder>(`/production-orders/${id}/status`, { status, user_id: userId, note })
  },

  linkPurchaseOrder(id: string, purchaseOrderId: string) {
    return api.patch<ProductionOrder>(`/production-orders/${id}/link-purchase-order`, {
      purchase_order_id: purchaseOrderId,
    })
  },

  delete(id: string) {
    return api.delete(`/production-orders/${id}`)
  },

  freezeStatus(projectId: string) {
    return api.get<FreezeStatus>(`/projects/${projectId}/freeze-status`)
  },
}

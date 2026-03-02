import { api } from './client.js'
import { projectsApi } from './projects.js'

const TENANT_ID_PLACEHOLDER = '00000000-0000-0000-0000-000000000001'

export type SupplierPortalOrderStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'partially_delivered'
  | 'delivered'
  | 'cancelled'

export interface SupplierPortalOrderItem {
  id: string
  purchase_order_id: string
  position: number
  sku: string | null
  description: string
  qty: number
  unit: string
  unit_price_net: number
  line_net: number
  notes: string | null
}

export interface SupplierPortalOrder {
  id: string
  project_id: string
  tenant_id: string
  supplier_name: string
  supplier_ref: string | null
  status: SupplierPortalOrderStatus
  created_at: string
  items: SupplierPortalOrderItem[]
}

export interface SupplierErpConnector {
  id: string
  name: string
  endpoint: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ErpPushResult {
  success: boolean
  erp_order_ref: string | null
  error: string | null
}

export const supplierPortalApi = {
  async listOpenOrders(): Promise<SupplierPortalOrder[]> {
    const projects = await projectsApi.list()
    const ordersByProject = await Promise.all(
      projects.map((project) => api.get<SupplierPortalOrder[]>(`/projects/${project.id}/purchase-orders`)),
    )

    return ordersByProject
      .flat()
      .filter((order) => order.status === 'draft' || order.status === 'sent' || order.status === 'confirmed')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  listConnectors() {
    return api.get<SupplierErpConnector[]>('/erp-connectors', { 'X-Tenant-Id': TENANT_ID_PLACEHOLDER })
  },

  pushToErp(orderId: string, connectorId: string) {
    return api.post<ErpPushResult>(
      `/purchase-orders/${orderId}/push-to-erp`,
      { connector_id: connectorId },
      { 'X-Tenant-Id': TENANT_ID_PLACEHOLDER },
    )
  },
}

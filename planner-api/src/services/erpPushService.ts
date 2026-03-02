export interface ErpConnector {
  id: string
  endpoint: string
  auth_config:
    | { type: 'bearer'; token: string }
    | { type: 'basic'; username: string; password: string }
    | Record<string, unknown>
  field_mapping: Record<string, string>
}

export interface ErpPushResult {
  success: boolean
  erp_order_ref: string | null
  error: string | null
}

export async function pushToErp(
  connector: ErpConnector,
  purchaseOrder: { id: string; supplier_name: string; supplier_ref?: string | null; items: unknown[] },
): Promise<ErpPushResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (connector.auth_config.type === 'bearer') {
    headers.Authorization = `Bearer ${(connector.auth_config as { type: 'bearer'; token: string }).token}`
  } else if (connector.auth_config.type === 'basic') {
    const cfg = connector.auth_config as { type: 'basic'; username: string; password: string }
    headers.Authorization = `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`
  }

  const payload: Record<string, unknown> = { ...purchaseOrder }
  for (const [localKey, erpKey] of Object.entries(connector.field_mapping)) {
    if (payload[localKey] !== undefined) {
      payload[erpKey] = payload[localKey]
    }
  }

  try {
    const res = await fetch(connector.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { success: false, erp_order_ref: null, error: `ERP returned ${res.status}: ${text}` }
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    const erpRef = (data.order_id ?? data.erp_order_ref ?? data.id ?? null) as string | null
    return { success: true, erp_order_ref: erpRef ? String(erpRef) : null, error: null }
  } catch (error) {
    return {
      success: false,
      erp_order_ref: null,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

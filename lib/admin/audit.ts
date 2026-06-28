import { createAdminClient } from '@/lib/supabase/server'

type AuditParams = {
  adminId: string
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  const db = createAdminClient()
  await db.from('admin_audit_log').insert({
    admin_user_id: params.adminId,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    details: params.details ?? null,
    ip_address: params.ipAddress ?? null,
  })
}

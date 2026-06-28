import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import AdminSettingsTabs from './AdminSettingsTabs'

export default async function AdminSettingsPage() {
  const session = await getAdminSession()
  const db = createAdminClient()

  const [{ data: adminUsers }, { data: settings }, { data: templates }, { data: auditLog }] = await Promise.all([
    db.from('admin_users').select('id, name, email, role, is_active, last_login, created_at').order('created_at'),
    db.from('platform_settings').select('key, value').order('key'),
    db.from('email_templates').select('id, template_key, subject, updated_at').order('template_key'),
    db.from('admin_audit_log')
      .select('id, action, entity_type, entity_id, ip_address, created_at, admin_users(name)')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">Admin users, platform config, email templates, audit log</p>
      </div>
      <AdminSettingsTabs
        session={session!}
        adminUsers={adminUsers ?? []}
        settings={settings ?? []}
        templates={templates ?? []}
        auditLog={auditLog ?? []}
      />
    </div>
  )
}

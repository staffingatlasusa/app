import { createAdminClient } from '@/lib/supabase/server'
import ContentControls from './ContentControls'

export default async function AdminContentPage() {
  const db = createAdminClient()
  const { data: settings } = await db.from('platform_settings').select('key, value')
  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Content & Marketplace</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">Control platform-wide toggles and content</p>
      </div>
      <ContentControls settings={settingsMap} />
    </div>
  )
}

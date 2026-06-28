import { createAdminClient } from '@/lib/supabase/server'
import FeaturedManager from './FeaturedManager'

type Placement = { id: string; entity_type: string; entity_id: string; display_order: number; expires_at: string | null; is_active: boolean; created_at: string }

export default async function AdminFeaturedPage() {
  const db = createAdminClient()
  const { data: placements } = await db
    .from('featured_placements')
    .select('id, entity_type, entity_id, display_order, expires_at, is_active, created_at')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const { data: companies } = await db.from('companies').select('id, name')
  const { data: contractors } = await db.from('contractors').select('id, name, role')

  const companyMap = Object.fromEntries((companies ?? []).map((c: { id: string; name: string }) => [c.id, c.name]))
  const contractorMap = Object.fromEntries((contractors ?? []).map((c: { id: string; name: string; role: string }) => [c.id, `${c.name} (${c.role})`]))

  const typedPlacements = (placements ?? []) as Placement[]
  const featuredCompanies = typedPlacements.filter(p => p.entity_type === 'company')
  const featuredContractors = typedPlacements.filter(p => p.entity_type === 'contractor')

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Featured Placements</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">Manage featured companies and contractors</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Featured Companies', value: featuredCompanies.length },
          { label: 'Featured Contractors', value: featuredContractors.length },
          { label: 'Expiring in 7 days', value: typedPlacements.filter(p => p.expires_at && new Date(p.expires_at) < new Date(Date.now() + 7 * 86400000)).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-5">
            <p className="text-xs text-[#8B8FA8] mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#F5C842]">{value}</p>
          </div>
        ))}
      </div>

      <FeaturedManager
        featuredCompanies={featuredCompanies}
        featuredContractors={featuredContractors}
        companyMap={companyMap}
        contractorMap={contractorMap}
        allCompanies={companies ?? []}
        allContractors={contractors ?? []}
      />
    </div>
  )
}

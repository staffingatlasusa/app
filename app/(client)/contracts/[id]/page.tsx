import { createClient } from '@/lib/supabase/server'
import { getMyCompany } from '@/lib/company'
import { requireActivePlan } from '@/lib/plan'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ContractView from '@/components/ContractView'
import PrintButton from '../../payroll/[id]/invoice/PrintButton'

export default async function CompanyContractPage({ params }: { params: { id: string } }) {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { company } = await getMyCompany(supabase, user!)

  const { data: contract } = await supabase
    .from('contracts')
    .select('*, contractors(name)')
    .eq('id', params.id)
    .eq('company_id', company?.id ?? '')
    .maybeSingle()
  if (!contract) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href={`/contractors/${contract.contractor_id}`} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft size={13} /> Back to contractor
        </Link>
        <PrintButton />
      </div>
      <ContractView
        contract={contract}
        companyName={company?.name ?? 'Company'}
        contractorName={(contract.contractors as unknown as { name: string } | null)?.name ?? 'Contractor'}
      />
    </div>
  )
}

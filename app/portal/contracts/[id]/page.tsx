import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ContractView from '@/components/ContractView'
import SignBox from './SignBox'

export default async function PortalContractPage({ params }: { params: { id: string } }) {
  const ctx = await getContractorContext()
  if (!ctx.contractor) redirect('/portal')
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*, companies(name)')
    .eq('id', params.id)
    .eq('contractor_id', ctx.contractor.id)
    .maybeSingle()
  if (!contract) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/portal/contracts" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-4 transition-colors print:hidden">
        <ArrowLeft size={13} /> All contracts
      </Link>
      <ContractView
        contract={contract}
        companyName={(contract.companies as unknown as { name: string } | null)?.name ?? 'Company'}
        contractorName={ctx.contractor.name}
      />
      {contract.status === 'sent' && (
        <SignBox contractId={contract.id} contractorName={ctx.contractor.name} />
      )}
    </div>
  )
}

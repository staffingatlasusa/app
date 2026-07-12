import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { redirect } from 'next/navigation'
import DocumentVault from '@/components/DocumentVault'

export default async function PortalDocumentsPage() {
  const ctx = await getContractorContext()
  if (!ctx.contractor) redirect('/portal')
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, storage_path, category, size, created_at')
    .eq('contractor_id', ctx.contractor.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-6">
        Contracts, IDs, and compliance documents shared between you and your company
      </p>
      <DocumentVault
        companyId={ctx.contractor.company_id}
        contractorId={ctx.contractor.id}
        initialDocs={documents ?? []}
        canDelete={false}
      />
    </div>
  )
}

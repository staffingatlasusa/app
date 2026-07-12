type Contract = {
  title: string; body: string; status: string
  company_signatory: string | null; company_signed_at: string | null
  contractor_signatory: string | null; contractor_signed_at: string | null
}

export default function ContractView({ contract, companyName, contractorName }: {
  contract: Contract; companyName: string; contractorName: string
}) {
  return (
    <div className="bg-white rounded-xl print:rounded-none border border-slate-200 print:border-0 p-8 sm:p-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-lg font-black text-navy-deep">
            Staffing<span className="text-amber">Atlas</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Contract</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize print:hidden ${
          contract.status === 'active' ? 'bg-green-50 text-green-700' :
          contract.status === 'sent' ? 'bg-amber/10 text-amber-600' : 'bg-slate-100 text-slate-400'
        }`}>{contract.status === 'sent' ? 'awaiting signature' : contract.status}</span>
      </div>

      <h1 className="text-xl font-bold text-slate-900 mb-6">{contract.title}</h1>

      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed mb-10">{contract.body}</pre>

      <div className="grid sm:grid-cols-2 gap-8 border-t border-slate-200 pt-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Client — {companyName}</p>
          {contract.company_signed_at ? (
            <>
              <p className="font-signature text-lg italic text-slate-900">{contract.company_signatory}</p>
              <p className="text-xs text-slate-400 mt-1">Signed {new Date(contract.company_signed_at).toLocaleString()}</p>
            </>
          ) : <p className="text-sm text-slate-300">Not signed</p>}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Contractor — {contractorName}</p>
          {contract.contractor_signed_at ? (
            <>
              <p className="font-signature text-lg italic text-slate-900">{contract.contractor_signatory}</p>
              <p className="text-xs text-slate-400 mt-1">Signed {new Date(contract.contractor_signed_at).toLocaleString()}</p>
            </>
          ) : <p className="text-sm text-slate-300">Awaiting signature</p>}
        </div>
      </div>
    </div>
  )
}

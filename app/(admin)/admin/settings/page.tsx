export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-8">Platform configuration</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl">
        <h2 className="font-semibold text-slate-900 mb-4">Platform Info</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">App name</dt>
            <dd className="font-medium text-slate-900">StaffingAtlas</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Domain</dt>
            <dd className="font-medium text-slate-900">staffingatlas.online</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Environment</dt>
            <dd className="font-medium text-slate-900">Production</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

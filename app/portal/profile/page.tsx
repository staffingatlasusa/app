import { getContractorContext } from '@/lib/portal'
import ProfileForm from './ProfileForm'
import { createClient } from '@/lib/supabase/server'

export default async function PortalProfilePage() {
  const ctx = await getContractorContext()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('contractor_profiles')
    .select('id, name, role, country, bio, hourly_rate, skills, status, photo_url')
    .eq('user_id', ctx.userId)
    .maybeSingle()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-6">
        {ctx.contractor
          ? `Employed as ${ctx.contractor.role}`
          : 'This is what companies see on the marketplace'}
      </p>
      <ProfileForm userId={ctx.userId} email={ctx.email} profile={profile} />
    </div>
  )
}

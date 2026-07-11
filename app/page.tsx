import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Visitors go to the marketing site
  if (!user) redirect('https://staffingatlas.com')

  // Route by account type: company owners → dashboard, contractors → portal
  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle()
  if (company) redirect('/dashboard')

  redirect('/portal')
}

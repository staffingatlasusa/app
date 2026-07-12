import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendRawEmail } from '@/lib/admin/email'

const APP = 'https://staffingatlas.online'

/** POST — owner invites a manager by email. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await request.json()
  if (!email || !/@/.test(email)) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  const db = createAdminClient()
  const { data: company } = await db.from('companies')
    .select('id, name').eq('owner_id', user.id).maybeSingle()
  if (!company) return NextResponse.json({ error: 'Only the company owner can invite team members' }, { status: 403 })

  const lower = String(email).toLowerCase()
  if (lower === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "That's you — you're already the owner" }, { status: 400 })
  }

  // Link immediately if the invitee already has an account
  const { data: { users } } = await db.auth.admin.listUsers()
  const existing = users.find((u: { email?: string }) => u.email?.toLowerCase() === lower)

  const { data: member, error } = await db.from('company_members').insert({
    company_id: company.id,
    email: lower,
    user_id: existing?.id ?? null,
    role: 'manager',
    status: existing ? 'active' : 'invited',
    invited_by: user.id,
  }).select('id, email, role, status, created_at').single()

  if (error) {
    const msg = error.message.includes('duplicate') ? 'Already invited' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  await sendRawEmail({
    to: lower,
    subject: `${company.name} added you to their StaffingAtlas team`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <div style="font-size:22px;font-weight:900;color:#0D1F3C;margin-bottom:24px">Staffing<span style="color:#F4A020">Atlas</span></div>
      <h2 style="color:#0D1F3C;font-size:18px;margin:0 0 12px">You're on the ${company.name} team</h2>
      <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px">
        ${existing
          ? 'Sign in with this email address and you\'ll have manager access — timesheet approvals, tasks, contractors, and messages.'
          : `Create an account with this email address (${lower}) and you'll automatically get manager access to ${company.name}'s dashboard.`}
      </p>
      <a href="${APP}/${existing ? 'login' : 'signup/company'}" style="display:inline-block;background:#1B3A6B;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">${existing ? 'Sign in' : 'Create your account'}</a>
    </div>`,
  }).catch(() => {})

  return NextResponse.json({ ok: true, member })
}

/** DELETE ?id= — owner removes a member. */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = createAdminClient()
  const { data: company } = await db.from('companies')
    .select('id').eq('owner_id', user.id).maybeSingle()
  if (!company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await db.from('company_members')
    .delete().eq('id', id).eq('company_id', company.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

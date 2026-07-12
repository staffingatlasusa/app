import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendRawEmail } from '@/lib/admin/email'

const APP = 'https://staffingatlas.online'

function wrap(title: string, body: string, cta?: { label: string; href: string }) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
    <div style="font-size:22px;font-weight:900;color:#0D1F3C;margin-bottom:24px">Staffing<span style="color:#F4A020">Atlas</span></div>
    <h2 style="color:#0D1F3C;font-size:18px;margin:0 0 12px">${title}</h2>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px">${body}</p>
    ${cta ? `<a href="${cta.href}" style="display:inline-block;background:#1B3A6B;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">${cta.label}</a>` : ''}
    <p style="color:#9CA3AF;font-size:11px;margin-top:32px">© ${new Date().getFullYear()} StaffingAtlas — an AIO Technologies company</p>
  </div>`
}

/**
 * POST /api/notify — transactional email dispatch, fire-and-forget from the UI.
 * Caller must be signed in; recipient addresses are looked up server-side so
 * the client can never direct mail to an arbitrary address.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event, id } = await request.json()
  const db = createAdminClient()

  try {
    switch (event) {
      case 'welcome_company': {
        await sendRawEmail({
          to: user.email!,
          subject: 'Welcome to StaffingAtlas — your trial has started',
          html: wrap(
            'Your 14-day trial is live',
            'Add your first contractor, set up timesheets, and see everything in one place. No credit card needed during the trial.',
            { label: 'Open your dashboard', href: `${APP}/dashboard` }
          ),
        })
        break
      }
      case 'welcome_contractor': {
        await sendRawEmail({
          to: user.email!,
          subject: 'Welcome to StaffingAtlas — profile received',
          html: wrap(
            'Your profile is under review',
            'Our team reviews new contractor profiles within 2 business days. Complete your profile — skills, rate, and bio — to get approved faster.',
            { label: 'Complete your profile', href: `${APP}/portal/profile` }
          ),
        })
        break
      }
      case 'timesheet_status': {
        // Verify caller owns the company on this timesheet, then notify the contractor
        const { data: ts } = await db.from('timesheets')
          .select('status, date, hours_worked, company_id, contractors(name, email), companies(owner_id, name)')
          .eq('id', id).maybeSingle()
        if (!ts) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const owner = (ts.companies as { owner_id: string } | null)?.owner_id
        if (owner !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const contractor = ts.contractors as { name: string; email: string } | null
        if (!contractor?.email) break
        const approved = ts.status === 'approved'
        await sendRawEmail({
          to: contractor.email,
          subject: `Timesheet ${ts.status} — ${new Date(ts.date).toLocaleDateString()}`,
          html: wrap(
            `Your timesheet was ${ts.status}`,
            `Your ${ts.hours_worked}h timesheet for ${new Date(ts.date).toLocaleDateString()} was ${ts.status}${approved ? ' and will be included in your next payroll summary' : ''}.`,
            { label: 'View timesheets', href: `${APP}/portal/timesheets` }
          ),
        })
        break
      }
      case 'payroll_ready': {
        const { data: ps } = await db.from('payroll_summaries')
          .select('period_start, period_end, total_hours, total_amount, currency, contractors(name, email), companies(owner_id)')
          .eq('id', id).maybeSingle()
        if (!ps) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if ((ps.companies as { owner_id: string } | null)?.owner_id !== user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        const contractor = ps.contractors as { name: string; email: string } | null
        if (!contractor?.email) break
        await sendRawEmail({
          to: contractor.email,
          subject: 'Your payroll summary is ready',
          html: wrap(
            'Payroll summary approved',
            `${Number(ps.total_hours).toFixed(1)} hours from ${new Date(ps.period_start).toLocaleDateString()} to ${new Date(ps.period_end).toLocaleDateString()} — total ${ps.currency} ${Number(ps.total_amount).toFixed(2)}.`,
            { label: 'View payroll', href: `${APP}/portal/payroll` }
          ),
        })
        break
      }
      case 'new_message': {
        // Notify the recipient of a message they haven't seen; throttled to
        // one email per hour per pair so threads don't spam inboxes.
        const { data: msg } = await db.from('messages')
          .select('sender_id, recipient_id, content, created_at')
          .eq('id', id).maybeSingle()
        if (!msg || msg.sender_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const hourAgo = new Date(Date.now() - 3600_000).toISOString()
        const { count } = await db.from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('sender_id', msg.sender_id).eq('recipient_id', msg.recipient_id)
          .gte('created_at', hourAgo).lt('created_at', msg.created_at)
        if ((count ?? 0) > 0) break // already messaged within the hour — skip email

        const { data: { user: recipient } } = await db.auth.admin.getUserById(msg.recipient_id)
        if (!recipient?.email) break
        const senderName = (user.user_metadata?.full_name as string) ?? 'Someone'
        await sendRawEmail({
          to: recipient.email,
          subject: `New message from ${senderName} on StaffingAtlas`,
          html: wrap(
            `${senderName} sent you a message`,
            `"${String(msg.content).slice(0, 140)}${String(msg.content).length > 140 ? '…' : ''}"`,
            { label: 'Reply on StaffingAtlas', href: `${APP}/` }
          ),
        })
        break
      }
      case 'new_application': {
        // Applicant notifies the company owner of their own application
        const { data: app } = await db.from('job_applications')
          .select('user_id, job_postings(title, companies(name, owner_id)), contractor_profiles(name)')
          .eq('id', id).maybeSingle()
        if (!app || app.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const job = app.job_postings as unknown as { title: string; companies: { name: string; owner_id: string } | null } | null
        const ownerId = job?.companies?.owner_id
        if (!ownerId) break
        const { data: { user: owner } } = await db.auth.admin.getUserById(ownerId)
        if (!owner?.email) break
        const applicant = app.contractor_profiles as unknown as { name: string } | null
        await sendRawEmail({
          to: owner.email,
          subject: `New applicant for ${job?.title}`,
          html: wrap(
            `${applicant?.name ?? 'A contractor'} applied to ${job?.title}`,
            'Review their profile, pitch, and expected rate in your applicant pipeline.',
            { label: 'Review applicants', href: `${APP}/jobs` }
          ),
        })
        break
      }
      case 'application_status': {
        // Company owner notifies the applicant of a stage change
        const { data: app } = await db.from('job_applications')
          .select('status, user_id, job_postings(title, companies(name, owner_id))')
          .eq('id', id).maybeSingle()
        if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const job = app.job_postings as unknown as { title: string; companies: { name: string; owner_id: string } | null } | null
        if (job?.companies?.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const { data: { user: applicant } } = await db.auth.admin.getUserById(app.user_id)
        if (!applicant?.email) break
        const hired = app.status === 'hired'
        await sendRawEmail({
          to: applicant.email,
          subject: hired ? `You're hired — ${job?.title}!` : `Application update — ${job?.title}`,
          html: wrap(
            hired ? `${job?.companies?.name} hired you 🎉` : `You've been moved to "${app.status}"`,
            hired
              ? 'You now have full portal access for this company — timesheets, tasks, messages, and payroll.'
              : `${job?.companies?.name} moved your application for ${job?.title} to the "${app.status}" stage.`,
            { label: hired ? 'Open your portal' : 'View your applications', href: hired ? `${APP}/portal` : `${APP}/portal/jobs` }
          ),
        })
        break
      }
      case 'contract_sent': {
        // Company owner sends a contract to the contractor
        const { data: contract } = await db.from('contracts')
          .select('title, contractors(name, email), companies(name, owner_id)')
          .eq('id', id).maybeSingle()
        if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const co = contract.companies as unknown as { name: string; owner_id: string } | null
        if (co?.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const contractor = contract.contractors as unknown as { name: string; email: string } | null
        if (!contractor?.email) break
        await sendRawEmail({
          to: contractor.email,
          subject: `Contract ready for your signature — ${co?.name}`,
          html: wrap(
            `${co?.name} sent you a contract`,
            `"${contract.title}" is awaiting your electronic signature in your portal. Review the terms and sign when ready.`,
            { label: 'Review & sign', href: `${APP}/portal/contracts` }
          ),
        })
        break
      }
      case 'contract_signed': {
        // Contractor signed — notify the company owner
        const { data: contract } = await db.from('contracts')
          .select('title, contractor_id, contractors(name, user_id), companies(owner_id)')
          .eq('id', id).maybeSingle()
        if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const signer = contract.contractors as unknown as { name: string; user_id: string } | null
        if (signer?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const ownerId = (contract.companies as unknown as { owner_id: string } | null)?.owner_id
        if (!ownerId) break
        const { data: { user: owner } } = await db.auth.admin.getUserById(ownerId)
        if (!owner?.email) break
        await sendRawEmail({
          to: owner.email,
          subject: `Contract signed — ${signer?.name}`,
          html: wrap(
            `${signer?.name} signed "${contract.title}"`,
            'The contract is now active. You can view or print the fully executed copy anytime.',
            { label: 'View contract', href: `${APP}/contractors/${contract.contractor_id}` }
          ),
        })
        break
      }
      case 'portal_invite': {
        // Company owner invites their contractor to create a portal login
        const { data: contractor } = await db.from('contractors')
          .select('name, email, user_id, companies(name, owner_id)')
          .eq('id', id).maybeSingle()
        if (!contractor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const co = contractor.companies as { name: string; owner_id: string } | null
        if (co?.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        if (contractor.user_id) return NextResponse.json({ error: 'Already has portal access' }, { status: 400 })
        await sendRawEmail({
          to: contractor.email,
          subject: `${co?.name} invited you to StaffingAtlas`,
          html: wrap(
            `${co?.name} set you up on StaffingAtlas`,
            `Create your account with this email address (${contractor.email}) and you'll get instant access to your timesheets, tasks, messages, and payroll summaries.`,
            { label: 'Create your account', href: `${APP}/signup/contractor` }
          ),
        })
        break
      }
      default:
        return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/notify]', err)
    // Email failures should never break the calling flow
    return NextResponse.json({ ok: false })
  }
}

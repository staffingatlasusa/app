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

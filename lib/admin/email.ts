import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.EMAIL_FROM ?? 'admin@staffingatlas.com'

export async function getTemplate(key: string): Promise<{ subject: string; body_html: string; body_text: string } | null> {
  const db = createAdminClient()
  const { data } = await db.from('email_templates').select('subject,body_html,body_text').eq('template_key', key).single()
  return data
}

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{{${k}}}`, v), template)
}

export async function sendTemplatedEmail(params: {
  to: string
  templateKey: string
  vars?: Record<string, string>
}): Promise<void> {
  const tpl = await getTemplate(params.templateKey)
  if (!tpl) throw new Error(`Email template '${params.templateKey}' not found`)
  const vars = params.vars ?? {}
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: interpolate(tpl.subject, vars),
    html: interpolate(tpl.body_html, vars),
    text: interpolate(tpl.body_text ?? '', vars),
  })
}

export async function sendRawEmail(params: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })
}

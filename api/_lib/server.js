// Shared helpers for the Vercel API functions. Server-only: these read
// secret environment variables that must never reach the browser.
import crypto from 'node:crypto'
import dns from 'node:dns/promises'
import { createClient } from '@supabase/supabase-js'

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function serviceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new HttpError(503, 'Comments are not set up yet. Please try again later.')
  return key
}

/** Supabase client with the service role: only for calling the server-only SQL functions. */
export function adminDb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  if (!url) throw new HttpError(503, 'Comments are not set up yet. Please try again later.')
  return createClient(url, serviceKey(), { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Keyed hash, so a leaked code hash can't be reversed by trying all 1,000,000 codes. */
export const hashCode = (code) => crypto.createHmac('sha256', serviceKey()).update(String(code)).digest('hex')
export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex')
export const newCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
export const newToken = () => crypto.randomBytes(32).toString('base64url')

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

/** True when the address looks valid and its domain accepts mail (catches typos like gmial.com). */
export async function isDeliverable(email) {
  if (!EMAIL_RE.test(email) || email.length > 254) return false
  const domain = email.split('@')[1]
  try {
    const mx = await dns.resolveMx(domain)
    return mx.length > 0
  } catch (err) {
    // Only a definite "no such domain / no mail server" fails; other lookup trouble shouldn't block real people.
    return !['ENOTFOUND', 'ENODATA'].includes(err.code)
  }
}

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** Sends one email through Brevo. In local dev without a key, prints it to the terminal instead. */
export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY
  const sender = process.env.BREVO_SENDER_EMAIL
  if (!apiKey || !sender) {
    if (process.env.DEV_EMAIL_LOG === '1') {
      console.log(`\n[email to ${to}] ${subject}\n${text}\n`)
      return
    }
    throw new HttpError(503, 'Email is not set up yet. Please try again later.')
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: sender, name: process.env.BREVO_SENDER_NAME || 'Ian.Analyst' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  })
  if (!res.ok) {
    console.error('Brevo error', res.status, await res.text().catch(() => ''))
    throw new HttpError(502, "We couldn't send the email. Please try again in a moment.")
  }
}

/** Emails the site owner about a newly published comment. Never fails the visitor's request. */
export async function notifyAdmin(db, commentId) {
  try {
    const { data } = await db.rpc('comment_notice', { p_comment_id: commentId })
    if (!data) return
    const site = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '')
    const postLink = site ? `${site}/blog/${data.post_slug}` : ''
    const adminLink = site ? `${site}/admin?tab=comments` : ''
    const kind = data.is_reply ? 'reply' : 'comment'

    await sendEmail({
      to: process.env.ADMIN_NOTIFY_EMAIL || 'ianearlbesanez@gmail.com',
      subject: `New ${kind} on "${data.post_title}"`,
      text: `${data.author_name} <${data.author_email}> wrote:\n\n${data.body}\n\n${postLink}\n${adminLink}`.trim(),
      html: `
        <p><strong>${escapeHtml(data.author_name)}</strong> (${escapeHtml(data.author_email)}) left a ${kind} on
        <strong>${escapeHtml(data.post_title)}</strong>:</p>
        <blockquote style="border-left:3px solid #00c26e;margin:0;padding:8px 12px;color:#333;white-space:pre-wrap">${escapeHtml(data.body)}</blockquote>
        ${postLink ? `<p><a href="${escapeHtml(postLink)}">View the post</a> · <a href="${escapeHtml(adminLink)}">Reply in the dashboard</a></p>` : ''}`,
    })
  } catch (err) {
    console.error('Admin notification failed:', err.message)
  }
}

/** Runs a handler with JSON responses and friendly errors. */
export function route(methods, handler) {
  return async (req, res) => {
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '))
      return res.status(405).json({ error: 'Method not allowed' })
    }
    try {
      await handler(req, res)
    } catch (err) {
      // Postgres errors raised on purpose by our SQL functions carry a readable message.
      const known = err instanceof HttpError ? err : err?.code === '22023' ? new HttpError(400, err.message) : err?.code === 'P0001' ? new HttpError(429, err.message) : null
      if (!known) console.error(err)
      res.status(known?.status ?? 500).json({ error: known?.message ?? 'Something went wrong. Please try again.' })
    }
  }
}

/** Throws the Supabase error so route() can turn it into a response. */
export function unwrap({ data, error }) {
  if (error) throw error
  return data
}

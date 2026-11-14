// POST /api/comments
// A visitor posts a comment. Verified browsers (with a saved token) publish
// straight away; everyone else gets a 6-digit code by email first.
import crypto from 'node:crypto'
import { adminDb, hashCode, hashToken, isDeliverable, newCode, notifyAdmin, route, sendEmail, unwrap, escapeHtml, HttpError } from '../_lib/server.js'

export default route(['POST'], async (req, res) => {
  const { post_id, parent_id = null, name, email, body, token = null, website } = req.body ?? {}

  // Honeypot field: real people never see it, bots fill it in. Pretend it worked.
  if (website) return res.status(200).json({ status: 'verify', comment_id: crypto.randomUUID() })

  const cleanEmail = String(email ?? '').trim().toLowerCase()
  if (!(await isDeliverable(cleanEmail))) {
    throw new HttpError(400, "That email address doesn't look like it can receive mail. Please check it.")
  }

  const db = adminDb()
  db.rpc('purge_stale_pending').then(() => {}, () => {})

  const code = newCode()
  const result = unwrap(
    await db.rpc('comment_request', {
      p_post_id: post_id,
      p_name: name,
      p_email: cleanEmail,
      p_body: body,
      p_parent_id: parent_id,
      p_code_hash: hashCode(code),
      p_token_hash: token ? hashToken(token) : null,
    }),
  )

  if (result.status === 'published') {
    await notifyAdmin(db, result.comment.id)
    return res.status(201).json(result)
  }

  await sendEmail({
    to: cleanEmail,
    subject: `Your code: ${code}`,
    text: `Your code to publish your comment is ${code}\n\nIt expires in 15 minutes. If you didn't comment on Ian Earl Besañez's blog, you can ignore this email.`,
    html: `<p>Your code to publish your comment is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;font-family:monospace">${escapeHtml(code)}</p>
      <p style="color:#555">It expires in 15 minutes. If you didn't comment on Ian Earl Besañez's blog, you can ignore this email.</p>`,
  })

  return res.status(202).json({ status: 'verify', comment_id: result.comment_id })
})

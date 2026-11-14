// POST /api/comments/verify
// The visitor enters the emailed code. On success the comment is published
// and the browser gets a token so it can skip the code next time.
import { adminDb, hashCode, hashToken, newToken, notifyAdmin, route, unwrap, HttpError } from '../_lib/server.js'

export default route(['POST'], async (req, res) => {
  const { comment_id, code } = req.body ?? {}
  if (!comment_id || !/^\d{6}$/.test(String(code ?? '').trim())) {
    throw new HttpError(400, 'Please enter the 6-digit code from the email.')
  }

  const db = adminDb()
  const token = newToken()
  const result = unwrap(
    await db.rpc('comment_verify', {
      p_comment_id: comment_id,
      p_code_hash: hashCode(String(code).trim()),
      p_token_hash: hashToken(token),
    }),
  )

  if (result.status !== 'published') throw new HttpError(400, result.message)

  await notifyAdmin(db, result.comment.id)
  return res.status(200).json({ ...result, token })
})

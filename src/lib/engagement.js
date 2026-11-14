import { supabase } from './supabase'
import { getSessionId } from './session'

export const REACTIONS = [
  { kind: 'like', emoji: '👍', label: 'Like' },
  { kind: 'love', emoji: '❤️', label: 'Love' },
  { kind: 'insightful', emoji: '💡', label: 'Insightful' },
  { kind: 'celebrate', emoji: '🎉', label: 'Celebrate' },
]
export const REACTION_BY_KIND = Object.fromEntries(REACTIONS.map((r) => [r.kind, r]))

/** Reaction, comment and share counts for several posts at once. Null if the database isn't set up for it. */
export async function fetchEngagement(postIds) {
  if (!supabase || postIds.length === 0) return {}
  const { data, error } = await supabase.rpc('post_engagement', { p_post_ids: postIds, p_session_id: getSessionId() })
  if (error) {
    console.warn('[engagement] unavailable. Run supabase/migrations/004_engagement.sql:', error.message)
    return null
  }
  return Object.fromEntries(
    data.map((r) => [
      r.post_id,
      {
        reactions: r.reactions ?? {},
        totalReactions: Number(r.total_reactions),
        comments: Number(r.comments),
        shares: Number(r.shares),
        myReaction: r.my_reaction,
      },
    ]),
  )
}

export async function setReaction(postId, kind) {
  const { error } = await supabase.rpc('react_to_post', { p_post_id: postId, p_session_id: getSessionId(), p_kind: kind })
  if (error) throw error
}

export function recordShare(postId, platform) {
  supabase?.rpc('record_share', { p_post_id: postId, p_session_id: getSessionId(), p_platform: platform }).then(() => {})
}

/** Calls one of the /api functions and throws its error message on failure. */
export async function callApi(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

// The verified commenter's name, email and token, so they don't need a code every time.
const COMMENTER_KEY = 'commenter'
export function loadCommenter() {
  try {
    return JSON.parse(localStorage.getItem(COMMENTER_KEY)) ?? {}
  } catch {
    return {}
  }
}
export function saveCommenter(value) {
  try {
    localStorage.setItem(COMMENTER_KEY, JSON.stringify(value))
  } catch {
    /* private mode: they'll just verify again next time */
  }
}

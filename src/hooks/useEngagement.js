import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchEngagement, setReaction } from '../lib/engagement'
import { useToast } from '../context/ToastContext'

const EMPTY = { reactions: {}, totalReactions: 0, comments: 0, shares: 0, myReaction: null }

/** Engagement for a list of posts, with optimistic reactions. */
export function useEngagement(postIds) {
  const key = postIds.join(',')
  const toast = useToast()
  const [byPost, setByPost] = useState({})
  const [available, setAvailable] = useState(false)
  const current = useRef(byPost)
  current.current = byPost

  useEffect(() => {
    let cancelled = false
    if (!key) return
    fetchEngagement(key.split(',')).then((data) => {
      if (cancelled) return
      setAvailable(data !== null)
      if (data) setByPost(data)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  // Clicking your current reaction removes it; clicking another switches to it.
  const react = useCallback(async (postId, kind) => {
    const before = current.current[postId] ?? EMPTY
    const next = kind === before.myReaction ? null : kind
    const reactions = { ...before.reactions }
    if (before.myReaction) reactions[before.myReaction] = Math.max(0, (reactions[before.myReaction] ?? 1) - 1)
    if (next) reactions[next] = (reactions[next] ?? 0) + 1
    const after = {
      ...before,
      reactions,
      totalReactions: before.totalReactions + (next ? 1 : 0) - (before.myReaction ? 1 : 0),
      myReaction: next,
    }

    setByPost((all) => ({ ...all, [postId]: after }))
    try {
      await setReaction(postId, next)
    } catch (err) {
      setByPost((all) => ({ ...all, [postId]: before }))
      toast.error("Couldn't save your reaction", err.message)
    }
  }, [toast])

  const bump = useCallback((postId, field, by = 1) => {
    setByPost((all) => {
      const cur = all[postId] ?? EMPTY
      return { ...all, [postId]: { ...cur, [field]: cur[field] + by } }
    })
  }, [])

  return { available, get: (id) => byPost[id] ?? EMPTY, react, bump }
}

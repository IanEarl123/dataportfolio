import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getSessionId } from '../lib/session'
import { useAuth } from './AuthContext'

const PresenceContext = createContext({ onlineCount: 0, connected: false })

/**
 * Every visitor joins one Supabase Realtime presence channel. The admin
 * dashboard reads how many distinct visitors are in it right now.
 * Presence needs no database table — it lives entirely in Realtime.
 */
export function PresenceProvider({ children }) {
  const { isAdmin } = useAuth()
  const { pathname } = useLocation()
  const channelRef = useRef(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const channel = supabase.channel('online-visitors', {
      config: { presence: { key: getSessionId() } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Count distinct visitors (one key per browser), not counting the admin.
        const visitors = Object.values(state).filter((metas) => !metas.some((m) => m.is_admin))
        setOnlineCount(visitors.length)
      })
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      setConnected(false)
    }
  }, [])

  // (Re)announce ourselves whenever the page or admin status changes.
  useEffect(() => {
    if (connected && channelRef.current) {
      channelRef.current.track({ path: pathname, is_admin: isAdmin, online_at: new Date().toISOString() })
    }
  }, [connected, pathname, isAdmin])

  return <PresenceContext.Provider value={{ onlineCount, connected }}>{children}</PresenceContext.Provider>
}

export const usePresence = () => useContext(PresenceContext)

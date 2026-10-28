import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getSessionId } from '../lib/session'

let tracked = false

/** Records one profile view per page load. The database de-dupes per session. */
export function useTrackView() {
  useEffect(() => {
    if (!supabase || tracked) return
    tracked = true
    supabase
      .rpc('track_view', {
        p_session_id: getSessionId(),
        p_path: window.location.pathname,
        p_referrer: document.referrer || null,
        p_user_agent: navigator.userAgent,
      })
      .then(({ error }) => error && console.warn('[track_view]', error.message))
  }, [])
}

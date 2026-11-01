import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_PORTRAIT, DEFAULT_LEARNING_SINCE } from '../lib/constants'

const SiteContext = createContext(null)
const CACHE_KEY = 'site-settings'

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? {}
  } catch {
    return {}
  }
}

function writeCache(settings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings))
  } catch {
    /* storage unavailable — the next visit just refetches */
  }
}

/**
 * The one-row site_settings table (profile picture, stats values). Cached so a
 * custom photo shows immediately on return visits, and subscribed to Realtime
 * so a new photo reaches every open page without a refresh.
 */
export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(readCache)

  const apply = useCallback((row) => {
    if (!row) return
    const next = { profile_image_url: row.profile_image_url, learning_since_year: row.learning_since_year }
    setSettings(next)
    writeCache(next)
  }, [])

  useEffect(() => {
    if (!supabase) return

    supabase
      .from('site_settings')
      .select('profile_image_url, learning_since_year')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => apply(data))

    const channel = supabase
      .channel('site-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, ({ new: row }) => apply(row))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [apply])

  const updateSettings = useCallback(
    async (patch) => {
      const { data, error } = await supabase
        .from('site_settings')
        .update(patch)
        .eq('id', 1)
        .select('profile_image_url, learning_since_year')
        .single()
      if (error) throw error
      apply(data)
    },
    [apply],
  )

  const value = useMemo(
    () => ({
      profileImage: settings.profile_image_url || DEFAULT_PORTRAIT,
      hasCustomImage: Boolean(settings.profile_image_url),
      learningSince: settings.learning_since_year || DEFAULT_LEARNING_SINCE,
      updateSettings,
    }),
    [settings, updateSettings],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FALLBACK_SKILLS } from '../lib/constants'
import { useSite } from '../context/SiteContext'

async function countRows(table) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
  return error ? null : count
}

/** Live numbers for the homepage: counted from your content, so they stay accurate. */
export function useSiteStats() {
  const { learningSince } = useSite()
  const [counts, setCounts] = useState({ projects: 0, certificates: 0, skills: FALLBACK_SKILLS.length })

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    Promise.all([countRows('projects'), countRows('certificates'), countRows('skills')]).then(
      ([projects, certificates, skills]) => {
        if (cancelled) return
        setCounts({
          projects: projects ?? 0,
          certificates: certificates ?? 0,
          skills: skills || FALLBACK_SKILLS.length,
        })
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  return { ...counts, years: Math.max(1, new Date().getFullYear() - learningSince) }
}

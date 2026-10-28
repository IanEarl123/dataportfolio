import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Reads rows from a Supabase table.
 *   useCollection('projects')
 *   useCollection('blog_posts', { orderBy: 'published_at', ascending: false, match: { published: true }, limit: 3 })
 */
export function useCollection(table, { orderBy = 'sort_order', ascending = true, match = null, limit = null } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState(null)
  const matchKey = match ? JSON.stringify(match) : ''

  const refetch = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    let query = supabase.from(table).select('*')
    if (matchKey) query = query.match(JSON.parse(matchKey))
    query = query.order(orderBy, { ascending, nullsFirst: false }).order('created_at', { ascending: false })
    if (limit) query = query.limit(limit)

    const { data: rows, error: err } = await query
    if (err) {
      console.error(`[${table}]`, err)
      setError(err)
    } else {
      setData(rows ?? [])
      setError(null)
    }
    setLoading(false)
  }, [table, orderBy, ascending, matchKey, limit])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, setData, loading, error, refetch }
}

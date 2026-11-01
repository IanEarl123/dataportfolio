import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_URL } from '../lib/constants'

const DEFAULT_DESCRIPTION =
  'Ian Earl Besañez is a Data Analyst in the Philippines working with SQL, Power BI, Excel, PostgreSQL, automation and data visualization.'

function setMeta(selector, attr, value) {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

/** Per-page title, description and canonical URL for search engines and link previews. */
export function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} | Ian Earl Besañez` : 'Ian Earl Besañez | Data Analyst Portfolio'
    const url = `${SITE_URL}${pathname}`
    document.title = fullTitle
    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:title"]', 'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', url)
  }, [title, description, pathname])
}

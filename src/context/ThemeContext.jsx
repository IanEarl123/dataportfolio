import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

// New key so visitors who were saved as "light" by the old default start dark.
const STORAGE_KEY = 'theme-v2'

function initialTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#070B12' : '#F4F7FA')
  }, [theme])

  const toggleTheme = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* storage unavailable (private mode) — theme just won't persist */
      }
      return next
    })

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

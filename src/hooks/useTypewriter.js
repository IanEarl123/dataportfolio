import { useEffect, useState } from 'react'

/** Small replacement for typed.js: types, pauses, deletes, moves to the next string. */
export function useTypewriter(strings, { typeSpeed = 60, backSpeed = 30, pause = 1400 } = {}) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const full = strings[index % strings.length]
    let timeout

    if (!deleting && text === full) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && text === '') {
      setDeleting(false)
      setIndex((i) => i + 1)
    } else {
      timeout = setTimeout(
        () => setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1)),
        deleting ? backSpeed : typeSpeed,
      )
    }
    return () => clearTimeout(timeout)
  }, [text, deleting, index, strings, typeSpeed, backSpeed, pause])

  return text
}

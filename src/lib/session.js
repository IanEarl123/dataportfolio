// Anonymous per-browser id used for view de-duplication and presence.
let memoryId = null

function newId() {
  const raw = crypto.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2)}`
  return raw.replace(/-/g, '')
}

export function getSessionId() {
  try {
    let id = localStorage.getItem('visitor_id')
    if (!id) {
      id = newId()
      localStorage.setItem('visitor_id', id)
    }
    return id
  } catch {
    memoryId ??= newId()
    return memoryId
  }
}

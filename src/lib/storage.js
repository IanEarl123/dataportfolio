import { supabase } from './supabase'
import { STORAGE_BUCKET } from './constants'

const MAX_BYTES = 10 * 1024 * 1024

/** Uploads a file to Supabase Storage and returns its public URL. */
export async function uploadFile(file, folder = 'misc') {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (file.size > MAX_BYTES) throw new Error('File is larger than 10 MB.')

  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin'
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  const path = `${folder}/${Date.now()}-${base || 'file'}.${ext}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw error

  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Best-effort delete of a file we previously uploaded (ignores external/local URLs). */
export async function removeFileByUrl(url) {
  if (!supabase || !url) return
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = decodeURIComponent(url.slice(idx + marker.length))
  await supabase.storage.from(STORAGE_BUCKET).remove([path])
}

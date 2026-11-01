import { supabase } from './supabase'
import { STORAGE_BUCKET } from './constants'

const MAX_BYTES = 10 * 1024 * 1024
const MAX_IMAGE_SIDE = 1600
const WEBP_QUALITY = 0.82

/**
 * Shrinks a photo in the browser before upload: longest side capped and
 * converted to WebP. GIFs (may be animated) and anything that fails to decode
 * or wouldn't get smaller are returned unchanged.
 */
export async function optimizeImage(file, maxSide = MAX_IMAGE_SIDE) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY))
    if (!blob || blob.type !== 'image/webp' || (blob.size >= file.size && scale === 1)) return file

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

/** Uploads a file to Supabase Storage and returns its public URL. */
export async function uploadFile(rawFile, folder = 'misc', { maxSide } = {}) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const file = await optimizeImage(rawFile, maxSide)
  if (file.size > MAX_BYTES) throw new Error('File is larger than 10 MB.')

  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin'
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  const path = `${folder}/${Date.now()}-${base || 'file'}.${ext}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type })
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

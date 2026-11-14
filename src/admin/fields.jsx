import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { uploadFile } from '../lib/storage'
import { removeBackground } from '../lib/removeBackground'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import Toggle from '../components/ui/Toggle'

const canClean = (file) => file.type.startsWith('image/') && !['image/gif', 'image/svg+xml'].includes(file.type)

/**
 * Upload button + URL input. Used for images and PDFs. With removeBg, plain
 * backgrounds (logos, badges) are removed automatically; photos are left as they are.
 */
export function UploadField({ value, onChange, folder, accept = 'image/*', preview = 'image', removeBg = false }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(null)
  const [original, setOriginal] = useState(null) // the file before its background was removed

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setOriginal(null)
    try {
      if (removeBg && canClean(file)) {
        setBusy('Removing background…')
        const result = await removeBackground(file, file.name).catch(() => ({ changed: false }))
        if (result.changed) {
          setBusy('Uploading…')
          onChange(await uploadFile(result.file, folder))
          setOriginal(file)
          toast.success('Background removed', 'Not right? Use "Keep original".')
          return
        }
      }
      setBusy('Uploading…')
      onChange(await uploadFile(file, folder))
      toast.success('Uploaded', file.name)
    } catch (err) {
      toast.error('Upload failed', err.message)
    } finally {
      setBusy(null)
    }
  }

  const keepOriginal = async () => {
    setBusy('Uploading…')
    try {
      onChange(await uploadFile(original, folder))
      setOriginal(null)
      toast.success('Using the original image')
    } catch (err) {
      toast.error('Upload failed', err.message)
    } finally {
      setBusy(null)
    }
  }

  // For images uploaded before this feature existed.
  const cleanCurrent = async () => {
    setBusy('Removing background…')
    try {
      const result = await removeBackground(value, 'image')
      if (!result.changed) return toast.info('Left as it is', `This image ${result.reason}.`)
      setBusy('Uploading…')
      onChange(await uploadFile(result.file, folder))
      toast.success('Background removed')
    } catch (err) {
      toast.error("Couldn't remove the background", err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      {preview === 'image' && (
        <div className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line ${value && removeBg ? 'bg-checker' : 'bg-raised'}`}>
          {value ? <img src={value} alt="" className={`h-full w-full ${removeBg ? 'object-contain p-1.5' : 'object-cover'}`} /> : <i className="fa-regular fa-image text-2xl text-ink3" />}
        </div>
      )}
      <div className="flex-1 space-y-2">
        <input type="text" inputMode="url" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload a file" className="input" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={!!busy} className="btn-ghost px-3 py-1.5 text-xs">
            {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-cloud-arrow-up" />}
            {busy ?? 'Upload'}
          </button>
          {original && (
            <button type="button" onClick={keepOriginal} disabled={!!busy} className="btn-ghost px-3 py-1.5 text-xs">
              <i className="fa-solid fa-rotate-left" /> Keep original
            </button>
          )}
          {value && removeBg && !original && (
            <button type="button" onClick={cleanCurrent} disabled={!!busy} className="btn-ghost px-3 py-1.5 text-xs">
              <i className="fa-solid fa-wand-magic-sparkles" /> Remove background
            </button>
          )}
          {value && (
            <>
              <a href={value} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-1.5 text-xs">
                <i className="fa-solid fa-eye" /> Open
              </a>
              <button type="button" onClick={() => onChange('')} className="btn-ghost px-3 py-1.5 text-xs hover:!text-red-600">
                <i className="fa-solid fa-xmark" /> Clear
              </button>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      </div>
    </div>
  )
}

/** Several photos for one post: upload many at once, reorder, remove. */
export function GalleryField({ value = [], onChange, folder }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null)
  const images = value ?? []

  const handleFiles = async (e) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return

    const added = []
    for (const [i, file] of files.entries()) {
      setProgress(`${i + 1}/${files.length}`)
      try {
        added.push(await uploadFile(file, folder))
      } catch (err) {
        toast.error(`Couldn't upload ${file.name}`, err.message)
      }
    }
    setProgress(null)
    if (added.length) {
      onChange([...images, ...added])
      toast.success(`${added.length} ${added.length === 1 ? 'photo' : 'photos'} added`)
    }
  }

  const move = (index, delta) => {
    const next = [...images]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <motion.li key={src} layout className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-raised">
              <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-page/80 p-1 backdrop-blur">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="icon-btn h-7 w-7 text-xs disabled:opacity-30">
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move later" className="icon-btn h-7 w-7 text-xs disabled:opacity-30">
                  <i className="fa-solid fa-arrow-right" />
                </button>
                <button type="button" onClick={() => onChange(images.filter((_, n) => n !== i))} aria-label="Remove photo" className="icon-btn h-7 w-7 text-xs hover:!text-red-500">
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={!!progress} className="btn-ghost px-3 py-1.5 text-xs">
        {progress ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-images" />}
        {progress ? `Uploading ${progress}…` : 'Add photos'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
    </div>
  )
}

/** Chip input: Enter or comma adds, Backspace on empty removes the last chip. */
export function TagsField({ value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [draft, setDraft] = useState('')
  const tags = value ?? []

  const add = (raw) => {
    const t = raw.trim().replace(/,$/, '')
    if (t && !tags.includes(t)) onChange([...tags, t])
    setDraft('')
  }

  return (
    <div className="input flex min-h-[46px] flex-wrap items-center gap-1.5 py-2">
      {tags.map((t) => (
        <motion.span key={t} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="chip bg-accent/10 text-accent-ink">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="ml-0.5 hover:text-red-600">
            <i className="fa-solid fa-xmark text-[10px]" />
          </button>
        </motion.span>
      ))}
      <input
        value={draft}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1))
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={tags.length ? '' : placeholder}
        className="min-w-[120px] flex-1 bg-transparent outline-none"
      />
    </div>
  )
}

/** Markdown editor with Write / Preview tabs and inline image upload. */
export function MarkdownField({ value = '', onChange, folder, required }) {
  const toast = useToast()
  const [tab, setTab] = useState('write')
  const [busy, setBusy] = useState(false)
  const textRef = useRef(null)
  const fileRef = useRef(null)

  const insertAtCursor = (snippet) => {
    const el = textRef.current
    const text = value ?? ''
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
    onChange(text.slice(0, start) + snippet + text.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + snippet.length, start + snippet.length)
    })
  }

  const wrap = (before, after = before) => {
    const el = textRef.current
    const text = value ?? ''
    const start = el?.selectionStart ?? 0
    const end = el?.selectionEnd ?? 0
    const selected = text.slice(start, end) || 'text'
    onChange(text.slice(0, start) + before + selected + after + text.slice(end))
  }

  const handleImage = async (e) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    setBusy(true)
    try {
      let snippet = ''
      for (const file of files) {
        const url = await uploadFile(file, folder)
        snippet += `\n![${file.name.replace(/\.[^.]+$/, '')}](${url})\n`
      }
      insertAtCursor(snippet)
      toast.success(files.length === 1 ? 'Image inserted' : `${files.length} images inserted`)
    } catch (err) {
      toast.error('Upload failed', err.message)
    } finally {
      setBusy(false)
    }
  }

  const tools = [
    { icon: 'fa-bold', label: 'Bold', run: () => wrap('**') },
    { icon: 'fa-italic', label: 'Italic', run: () => wrap('_') },
    { icon: 'fa-heading', label: 'Heading', run: () => insertAtCursor('\n## ') },
    { icon: 'fa-list-ul', label: 'List', run: () => insertAtCursor('\n- ') },
    { icon: 'fa-link', label: 'Link', run: () => wrap('[', '](https://)') },
    { icon: 'fa-code', label: 'Code', run: () => wrap('`') },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-raised px-2 py-1.5">
        <div className="flex gap-1">
          {['write', 'preview'].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`relative rounded-lg px-3 py-1 text-xs font-bold capitalize ${tab === t ? 'text-accent-ink' : 'text-ink2'}`}>
              {tab === t && <motion.span layoutId="md-tab" className="absolute inset-0 -z-10 rounded-lg bg-raised" />}
              {t}
            </button>
          ))}
        </div>
        {tab === 'write' && (
          <div className="flex flex-wrap gap-0.5">
            {tools.map((t) => (
              <button key={t.icon} type="button" onClick={t.run} title={t.label} aria-label={t.label} className="icon-btn h-7 w-7 text-xs">
                <i className={`fa-solid ${t.icon}`} />
              </button>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} title="Insert images" aria-label="Insert images" className="icon-btn h-7 w-7 text-xs" disabled={busy}>
              <i className={busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-image'} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImage} className="hidden" />
          </div>
        )}
      </div>
      {tab === 'write' ? (
        <textarea
          ref={textRef}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={14}
          className="block w-full resize-y bg-page/60 p-4 font-mono text-sm text-ink outline-none"
          placeholder="Write in Markdown…"
        />
      ) : (
        <div className="article prose-sm min-h-[320px] bg-page/60 p-4">
          {value ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown> : <p className="text-ink3">Nothing to preview.</p>}
        </div>
      )}
    </div>
  )
}

export function BooleanField({ value, onChange, label }) {
  return (
    <div className="pt-1">
      <Toggle checked={!!value} onChange={onChange} label={label} />
    </div>
  )
}

/** Dropdown of rows from another table (e.g. a certificate's section). */
export function RelationField({ id, value, onChange, table, labelField, orderBy = 'created_at' }) {
  const [options, setOptions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from(table)
      .select(`id, ${labelField}`)
      .order(orderBy)
      .then(({ data, error: err }) => (err ? setError(err.message) : setOptions(data ?? [])))
  }, [table, labelField, orderBy])

  return (
    <>
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="input">
        <option value="">None</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o[labelField]}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </>
  )
}

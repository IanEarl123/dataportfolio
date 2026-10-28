import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { uploadFile } from '../lib/storage'
import { useToast } from '../context/ToastContext'
import Toggle from '../components/ui/Toggle'

/** Upload button + URL input. Used for images and PDFs. */
export function UploadField({ value, onChange, folder, accept = 'image/*', preview = 'image' }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadFile(file, folder)
      onChange(url)
      toast.success('Uploaded', file.name)
    } catch (err) {
      toast.error('Upload failed', err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      {preview === 'image' && (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <i className="fa-regular fa-image text-2xl text-slate-300" />}
        </div>
      )}
      <div className="flex-1 space-y-2">
        <input type="text" inputMode="url" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload a file" className="input" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-ghost px-3 py-1.5 text-xs">
            {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-cloud-arrow-up" />}
            {busy ? 'Uploading…' : 'Upload'}
          </button>
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
        <motion.span key={t} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="chip bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
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
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadFile(file, folder)
      insertAtCursor(`\n![${file.name.replace(/\.[^.]+$/, '')}](${url})\n`)
      toast.success('Image inserted')
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
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex gap-1">
          {['write', 'preview'].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`relative rounded-lg px-3 py-1 text-xs font-bold capitalize ${tab === t ? 'text-indigo-700 dark:text-white' : 'text-slate-500'}`}>
              {tab === t && <motion.span layoutId="md-tab" className="absolute inset-0 -z-10 rounded-lg bg-white shadow-sm dark:bg-slate-800" />}
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
            <button type="button" onClick={() => fileRef.current?.click()} title="Insert image" aria-label="Insert image" className="icon-btn h-7 w-7 text-xs" disabled={busy}>
              <i className={busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-image'} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
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
          className="block w-full resize-y bg-white p-4 font-mono text-sm outline-none dark:bg-slate-950"
          placeholder="Write in Markdown…"
        />
      ) : (
        <div className="prose prose-sm prose-slate min-h-[320px] max-w-none bg-white p-4 dark:prose-invert dark:bg-slate-950">
          {value ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown> : <p className="text-slate-400">Nothing to preview.</p>}
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

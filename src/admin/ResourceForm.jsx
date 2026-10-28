import { useEffect, useState } from 'react'
import Modal from '../components/ui/Modal'
import { supabase } from '../lib/supabase'
import { slugify } from '../lib/format'
import { useToast } from '../context/ToastContext'
import { BooleanField, MarkdownField, TagsField, UploadField } from './fields'

function emptyValue(field) {
  if (field.default !== undefined) return field.default
  if (field.type === 'tags') return []
  if (field.type === 'boolean') return false
  return ''
}

function initialValues(resource, row) {
  return Object.fromEntries(resource.fields.map((f) => [f.name, row?.[f.name] ?? emptyValue(f)]))
}

/** Converts form state into what Postgres expects (numbers, nulls, arrays). */
function toPayload(resource, values) {
  const payload = {}
  for (const f of resource.fields) {
    const v = values[f.name]
    switch (f.type) {
      case 'number':
        payload[f.name] = v === '' || v === null ? (f.default ?? null) : Number(v)
        break
      case 'boolean':
        payload[f.name] = Boolean(v)
        break
      case 'tags':
        payload[f.name] = Array.isArray(v) ? v : []
        break
      case 'markdown':
        payload[f.name] = f.required ? (v ?? '') : v?.trim() ? v : null
        break
      default:
        payload[f.name] = typeof v === 'string' ? v.trim() || null : (v ?? null)
    }
  }
  return payload
}

export default function ResourceForm({ resource, row, open, onClose, onSaved }) {
  const toast = useToast()
  const isNew = !row
  const [values, setValues] = useState(() => initialValues(resource, row))
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(initialValues(resource, row))
      setSlugTouched(!!row)
    }
  }, [open, resource, row])

  const set = (name, value) =>
    setValues((prev) => {
      const next = { ...prev, [name]: value }
      // Auto-fill slug fields from their source until the slug is edited by hand.
      resource.fields
        .filter((f) => f.type === 'slug' && f.from === name && !slugTouched)
        .forEach((f) => (next[f.name] = slugify(value)))
      return next
    })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = toPayload(resource, values)
    const query = isNew
      ? supabase.from(resource.key).insert(payload)
      : supabase.from(resource.key).update(payload).eq('id', row.id)
    const { data, error } = await query.select().single()
    setSaving(false)

    if (error) {
      const message = error.code === '23505' ? 'That slug is already used by another post.' : error.message
      toast.error(`Couldn't save ${resource.singular.toLowerCase()}`, message)
      return
    }
    toast.success(isNew ? `${resource.singular} created` : `${resource.singular} updated`)
    onSaved(data, isNew)
    onClose()
  }

  const renderField = (f) => {
    const value = values[f.name]
    const id = `field-${f.name}`
    const common = { id, required: f.required, placeholder: f.placeholder, className: 'input' }

    switch (f.type) {
      case 'textarea':
        return <textarea {...common} rows={f.rows ?? 4} value={value ?? ''} onChange={(e) => set(f.name, e.target.value)} />
      case 'markdown':
        return <MarkdownField value={value} onChange={(v) => set(f.name, v)} folder={resource.key} required={f.required} />
      case 'number':
        return <input {...common} type="number" step={f.step ?? '1'} min={f.min} value={value ?? ''} onChange={(e) => set(f.name, e.target.value)} />
      case 'date':
        return <input {...common} type="date" value={value ?? ''} onChange={(e) => set(f.name, e.target.value)} />
      case 'url':
        return <input {...common} type="url" placeholder={f.placeholder ?? 'https://'} value={value ?? ''} onChange={(e) => set(f.name, e.target.value)} />
      case 'select':
        return (
          <select {...common} value={value ?? ''} onChange={(e) => set(f.name, e.target.value)}>
            {f.options.map((o) => {
              const opt = typeof o === 'string' ? { value: o, label: o } : o
              return <option key={opt.value} value={opt.value}>{opt.label}</option>
            })}
          </select>
        )
      case 'boolean':
        return <BooleanField value={value} onChange={(v) => set(f.name, v)} label={value ? 'Yes' : 'No'} />
      case 'tags':
        return <TagsField value={value} onChange={(v) => set(f.name, v)} />
      case 'image':
        return <UploadField value={value} onChange={(v) => set(f.name, v)} folder={resource.key} />
      case 'file':
        return <UploadField value={value} onChange={(v) => set(f.name, v)} folder={resource.key} accept={f.accept} preview="none" />
      case 'slug':
        return (
          <input
            {...common}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers and dashes"
            value={value ?? ''}
            onChange={(e) => {
              setSlugTouched(true)
              set(f.name, slugify(e.target.value))
            }}
          />
        )
      default:
        return <input {...common} type="text" value={value ?? ''} onChange={(e) => set(f.name, e.target.value)} />
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isNew ? `New ${resource.singular}` : `Edit ${resource.singular}`}
      size={resource.size ?? 'md'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="resource-form" className="btn-primary" disabled={saving}>
            {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-floppy-disk" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="resource-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-5">
        {resource.fields.map((f) => (
          <div key={f.name} className={f.half ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
            <label htmlFor={`field-${f.name}`} className="label">
              {f.label}
              {f.required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {renderField(f)}
            {f.help && <p className="mt-1 text-xs text-slate-400">{f.help}</p>}
          </div>
        ))}
      </form>
    </Modal>
  )
}

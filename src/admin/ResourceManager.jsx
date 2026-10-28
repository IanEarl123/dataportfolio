import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { removeFileByUrl } from '../lib/storage'
import { useCollection } from '../hooks/useCollection'
import { useToast } from '../context/ToastContext'
import Toggle from '../components/ui/Toggle'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { EmptyState, SkeletonGrid } from '../components/ui/States'
import ResourceForm from './ResourceForm'

/** Generic list + create/edit/delete screen driven by a RESOURCES entry. */
export default function ResourceManager({ resource }) {
  const toast = useToast()
  const { data: rows, setData: setRows, loading, error } = useCollection(resource.key, {
    orderBy: resource.orderBy,
    ascending: resource.ascending ?? true,
  })
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null = new, row = edit (kept during close animation)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busyDelete, setBusyDelete] = useState(false)

  const visible = rows.filter((r) =>
    !query ? true : JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
  )

  const handleSaved = (saved, isNew) => {
    setRows((prev) => (isNew ? [saved, ...prev] : prev.map((r) => (r.id === saved.id ? saved : r))))
  }

  const handleToggle = async (row, value) => {
    const field = resource.toggleField
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)))
    const { data, error: err } = await supabase.from(resource.key).update({ [field]: value }).eq('id', row.id).select().single()
    if (err) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)))
      toast.error('Update failed', err.message)
    } else {
      setRows((prev) => prev.map((r) => (r.id === row.id ? data : r)))
      toast.success(`${resource.toggleLabel}: ${value ? 'on' : 'off'}`, data[resource.titleField])
    }
  }

  const handleDelete = async () => {
    setBusyDelete(true)
    const { error: err } = await supabase.from(resource.key).delete().eq('id', deleting.id)
    setBusyDelete(false)
    if (err) {
      toast.error('Delete failed', err.message)
      return
    }
    // Clean up any files we uploaded for this row (ignores external links).
    resource.fields
      .filter((f) => f.type === 'image' || f.type === 'file')
      .forEach((f) => removeFileByUrl(deleting[f.name]).catch(() => {}))
    setRows((prev) => prev.filter((r) => r.id !== deleting.id))
    toast.success(`${resource.singular} deleted`)
    setDeleting(null)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{resource.label}</h2>
          <p className="text-sm text-slate-500">{rows.length} {rows.length === 1 ? 'item' : 'items'}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="input pl-9" />
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => { setEditing(null); setFormOpen(true) }} className="btn-primary shrink-0">
            <i className="fa-solid fa-plus" /> <span className="hidden sm:inline">New {resource.singular}</span>
          </motion.button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error.message} — did you run <code>supabase/migrations/001_init.sql</code>?
        </p>
      )}

      {loading ? (
        <SkeletonGrid count={4} className="space-y-3" itemClass="h-20 !rounded-2xl" />
      ) : visible.length === 0 ? (
        <EmptyState icon={resource.icon} title={query ? 'No matches' : `No ${resource.label.toLowerCase()} yet`} message={query ? 'Try another search.' : `Click "New ${resource.singular}" to add one.`} />
      ) : (
        <motion.ul layout className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((row, i) => (
              <motion.li
                key={row.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.03, 0.3) } }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                className="card flex items-center gap-4 rounded-2xl p-3 pr-4 hover:shadow-md"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  {resource.imageField && row[resource.imageField] ? (
                    <img src={row[resource.imageField]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <i className={`${row.icon || resource.icon} text-lg text-slate-400`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{row[resource.titleField]}</p>
                  <p className="truncate text-xs text-slate-500">{resource.subtitle?.(row)}</p>
                </div>
                {resource.toggleField && (
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-xs font-semibold text-slate-400">{resource.toggleLabel}</span>
                    <Toggle size="sm" checked={!!row[resource.toggleField]} onChange={(v) => handleToggle(row, v)} label={`${resource.toggleLabel} ${row[resource.titleField]}`} />
                  </div>
                )}
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(row); setFormOpen(true) }} className="icon-btn" aria-label="Edit">
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button onClick={() => setDeleting(row)} className="icon-btn hover:!text-red-600" aria-label="Delete">
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <ResourceForm
        resource={resource}
        row={editing}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${resource.singular.toLowerCase()}?`}
        message={deleting ? `"${deleting[resource.titleField]}" will be permanently removed. This can't be undone.` : ''}
        busy={busyDelete}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

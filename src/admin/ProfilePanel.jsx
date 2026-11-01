import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { removeFileByUrl, uploadFile } from '../lib/storage'
import { useSite } from '../context/SiteContext'
import { useToast } from '../context/ToastContext'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const PROFILE_SIDE = 800

/** Change the profile photo (with a preview before saving) and the stats start year. */
export default function ProfilePanel() {
  const { profileImage, hasCustomImage, learningSince, updateSettings } = useSite()
  const toast = useToast()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [year, setYear] = useState(learningSince)

  useEffect(() => setYear(learningSince), [learningSince])

  // Local preview: nothing is uploaded until Save.
  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handlePick = (e) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    if (!picked.type.startsWith('image/')) return toast.error('Please choose an image file')
    if (picked.size > MAX_UPLOAD_BYTES) return toast.error('Image is larger than 10 MB')
    setFile(picked)
  }

  const handleSave = async () => {
    setSaving(true)
    const previous = hasCustomImage ? profileImage : null
    try {
      const url = await uploadFile(file, 'profile', { maxSide: PROFILE_SIDE })
      await updateSettings({ profile_image_url: url })
      setFile(null)
      toast.success('Profile picture updated', 'It now shows across the site.')
      removeFileByUrl(previous).catch(() => {})
    } catch (err) {
      toast.error("Couldn't update the picture", err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    const previous = profileImage
    try {
      await updateSettings({ profile_image_url: null })
      toast.success('Back to the default picture')
      removeFileByUrl(previous).catch(() => {})
    } catch (err) {
      toast.error("Couldn't reset the picture", err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleYear = async (e) => {
    e.preventDefault()
    try {
      await updateSettings({ learning_since_year: Number(year) })
      toast.success('Stats updated')
    } catch (err) {
      toast.error("Couldn't save", err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="text-sm text-ink3">Your picture and homepage stats.</p>
      </div>

      <section className="card p-5 md:p-6">
        <h3 className="mb-4 font-semibold text-ink">Profile picture</h3>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-end gap-5">
            <figure>
              <figcaption className="label">Current</figcaption>
              <img src={profileImage} alt="Current profile" className="h-32 w-32 rounded-xl border border-line object-cover" />
            </figure>
            <AnimatePresence>
              {preview && (
                <motion.figure initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  <figcaption className="label text-accent-ink">Preview</figcaption>
                  <img src={preview} alt="New profile preview" className="h-32 w-32 rounded-xl border border-accent-ink object-cover shadow-glow" />
                </motion.figure>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            <p className="max-w-xs text-sm text-ink2">
              {preview ? 'This is how it will look. Save to publish it.' : 'Use a square, front-facing photo for the best result.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {preview ? (
                <>
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                    {saving ? 'Saving…' : 'Save picture'}
                  </button>
                  <button className="btn-ghost" onClick={() => setFile(null)} disabled={saving}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn-primary" onClick={() => inputRef.current?.click()} disabled={saving}>
                    <i className="fa-solid fa-image" /> Choose photo
                  </button>
                  {hasCustomImage && (
                    <button className="btn-ghost" onClick={handleReset} disabled={saving}>Use default</button>
                  )}
                </>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={handlePick} className="hidden" aria-label="Choose profile photo" />
          </div>
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h3 className="mb-1 font-semibold text-ink">Years of Learning</h3>
        <p className="mb-4 text-sm text-ink3">The homepage counts from this year. Projects, Certificates and Technologies count automatically from your content.</p>
        <form onSubmit={handleYear} className="flex max-w-xs items-end gap-2">
          <div className="flex-1">
            <label htmlFor="learning-year" className="label">Started in</label>
            <input id="learning-year" type="number" min="1980" max={new Date().getFullYear()} required value={year} onChange={(e) => setYear(e.target.value)} className="input" />
          </div>
          <button type="submit" className="btn-ghost">Save</button>
        </form>
      </section>
    </div>
  )
}

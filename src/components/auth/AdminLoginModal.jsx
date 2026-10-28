import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useAnimationControls } from 'framer-motion'
import Modal from '../ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { isSupabaseConfigured } from '../../lib/supabase'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60_000

export default function AdminLoginModal({ open, onClose }) {
  const { signIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const controls = useAnimationControls()

  useEffect(() => {
    if (!open) {
      setPassword('')
      setError('')
      setShowPassword(false)
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Date.now() < lockedUntil) {
      setError(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)}s.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      toast.success('Welcome back, Ian', 'Admin dashboard unlocked.')
      setAttempts(0)
      onClose()
      navigate('/admin')
    } catch (err) {
      const next = attempts + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS)
        setAttempts(0)
      }
      setError(err.message)
      controls.start({ x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.45 } })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title="Admin Access" size="sm">
      <motion.form
        animate={controls}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200">
          <i className="fa-solid fa-shield-halved text-lg" />
          <span>Restricted area. Only the site owner can sign in.</span>
        </div>

        {!isSupabaseConfigured && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            Supabase isn&apos;t configured yet — add your keys to <code>.env.local</code> and restart the dev server.
          </p>
        )}

        <div>
          <label htmlFor="admin-email" className="label">Email</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="label">Password</label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
            >
              <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
            </button>
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-red-600" role="alert">
            <i className="fa-solid fa-triangle-exclamation mr-1.5" />
            {error}
          </motion.p>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-lock-open" />}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </motion.form>
    </Modal>
  )
}

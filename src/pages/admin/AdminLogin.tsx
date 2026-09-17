import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

export default function AdminLogin() {
  const { signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // حالات الأنيميشن: 'idle' | 'verifying' | 'success' | 'error'
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')

  // مسح أي تسجيل دخول قديم فور فتح رابط /admin
  useEffect(() => {
    signOut()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setStatus('verifying')

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setStatus('error')
      setError(signInError)

      setTimeout(() => {
        setStatus('idle')
      }, 1500)
      return
    }

    setStatus('success')
    setTimeout(() => {
      navigate('/admin/dashboard')
    }, 1500)
  }

  const isCompact = status !== 'idle'

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Background Glow */}
      <motion.div
        animate={{
          scale: status === 'success' ? 1.2 : 1,
          opacity: status === 'success' ? 0.8 : 0.4,
        }}
        transition={{ duration: 0.6 }}
        className="absolute h-96 w-96 rounded-full blur-3xl pointer-events-none"
        style={{
          backgroundColor:
            status === 'success'
              ? 'rgba(34, 197, 94, 0.25)'
              : status === 'error'
              ? 'rgba(239, 68, 68, 0.25)'
              : 'color-mix(in srgb, var(--accent) 20%, transparent)',
        }}
      />

      {/* Main Container Card */}
      <motion.section
        layout
        transition={{
          duration: 0.5,
          ease: [0.32, 0.72, 0, 1], // Fluid physical ease
        }}
        className={`relative w-full backdrop-blur-2xl border shadow-2xl overflow-hidden flex items-center justify-center transition-colors duration-500 ${
          isCompact
            ? 'max-w-[170px] min-h-[170px] rounded-3xl p-4 text-center'
            : 'max-w-sm rounded-3xl p-6 sm:p-7'
        }`}
        style={{
          borderColor:
            status === 'success'
              ? 'rgba(34, 197, 94, 0.5)'
              : status === 'error'
              ? 'rgba(239, 68, 68, 0.5)'
              : 'color-mix(in srgb, var(--border) 60%, transparent)',
          backgroundColor:
            status === 'success'
              ? 'rgba(34, 197, 94, 0.08)'
              : status === 'error'
              ? 'rgba(239, 68, 68, 0.08)'
              : 'color-mix(in srgb, var(--surface) 65%, transparent)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {!isCompact ? (
            /* Full Form View */
            <motion.div
              key="full-form"
              initial={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.7,
                filter: 'blur(8px)',
              }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="w-full"
            >
              <motion.a
                href="/"
                whileHover={{ x: -3 }}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-xs font-medium transition-colors"
                style={{
                  borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--surface-2) 40%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12,19 5,12 12,5" />
                </svg>
                <span>Back to portfolio</span>
              </motion.a>

              <div className="mt-6 text-center">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    color: 'var(--accent)',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <p className="eyebrow mt-4 text-[11px] uppercase tracking-wider opacity-80">
                  Private Area
                </p>

                <h1
                  className="font-display mt-1 text-2xl font-semibold tracking-tight"
                  style={{ color: 'var(--text)' }}
                >
                  Admin Login
                </h1>
              </div>

              {!isSupabaseConfigured && (
                <p
                  className="mt-4 rounded-xl border px-3 py-2 text-xs leading-relaxed text-center"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Supabase is not connected yet. Add keys to <code className="mx-0.5">.env.local</code>.
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    Email address
                  </label>

                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)',
                      backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)',
                      color: 'var(--text)',
                    }}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    Password
                  </label>

                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)',
                      backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)',
                      color: 'var(--text)',
                    }}
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p
                    className="rounded-xl border px-3 py-2 text-xs text-center"
                    style={{ borderColor: '#DC5B4B', color: '#DC5B4B', backgroundColor: '#DC5B4B15' }}
                  >
                    {error}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!isSupabaseConfigured}
                  className="primary-button w-full py-2.5 text-sm font-medium disabled:opacity-50 mt-2 shadow-lg"
                >
                  Sign in to dashboard
                </motion.button>
              </form>

              <p
                className="mt-5 text-center font-mono text-[9px] tracking-widest opacity-60"
                style={{ color: 'var(--text-muted)' }}
              >
                PORTFOLIO MANAGEMENT SYSTEM
              </p>
            </motion.div>
          ) : (
            /* Square Lock View (Centered simultaneously) */
            <motion.div
              key="compact-lock-view"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: status === 'error' ? [0, -8, 8, -6, 6, 0] : 0,
              }}
              transition={{
                duration: 0.4,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="flex flex-col items-center justify-center"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xl transition-colors duration-300"
                style={{
                  borderColor:
                    status === 'success'
                      ? '#22c55e'
                      : status === 'error'
                      ? '#ef4444'
                      : 'var(--accent)',
                  backgroundColor:
                    status === 'success'
                      ? 'rgba(34, 197, 94, 0.15)'
                      : status === 'error'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'color-mix(in srgb, var(--accent) 10%, transparent)',
                  color:
                    status === 'success'
                      ? '#22c55e'
                      : status === 'error'
                      ? '#ef4444'
                      : 'var(--accent)',
                }}
              >
                {status === 'verifying' && (
                  <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </motion.svg>
                )}

                {status === 'success' && (
                  <motion.svg
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </motion.svg>
                )}

                {status === 'error' && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <line x1="12" y1="14" x2="12" y2="17" />
                    <line x1="12" y1="19" x2="12.01" y2="19" />
                  </motion.svg>
                )}
              </div>

              <p
                className="mt-2.5 font-mono text-[10px] font-medium tracking-wider uppercase transition-colors duration-300"
                style={{
                  color:
                    status === 'success'
                      ? '#22c55e'
                      : status === 'error'
                      ? '#ef4444'
                      : 'var(--text-muted)',
                }}
              >
                {status === 'verifying' && 'Verifying...'}
                {status === 'success' && 'Unlocked'}
                {status === 'error' && 'Access Denied'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  )
}
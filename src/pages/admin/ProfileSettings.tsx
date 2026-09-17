import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { profile as seedProfile } from '../../data/seed'
import AssetUploader from '../../components/admin/AssetUploader'
import CvUploader from '../../components/admin/CvUploader'

const initialForm = {
  name: seedProfile.name,
  title: seedProfile.title,
  bio: seedProfile.bio,
  email: seedProfile.email,
  phone: seedProfile.phone ?? '',
  linkedin: seedProfile.linkedin,
  github: seedProfile.github ?? '',
  cv_url: seedProfile.cvUrl ?? '',
  profile_image: seedProfile.profileImage ?? '',
}

export default function ProfileSettings() {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data) {
      setProfileId(data.id)
      setForm({
        name: data.name ?? '',
        title: data.title ?? '',
        bio: data.bio ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        linkedin: data.linkedin ?? '',
        github: data.github ?? '',
        cv_url: data.cv_url ?? '',
        profile_image: data.profile_image ?? '',
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!supabase) {
      setError('Supabase is not configured yet.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      bio: form.bio.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      linkedin: form.linkedin.trim() || null,
      github: form.github.trim() || null,
      cv_url: form.cv_url.trim() || null,
      profile_image: form.profile_image.trim() || null,
    }

    const { data, error: saveError } = profileId
      ? await supabase
          .from('profile')
          .update(payload)
          .eq('id', profileId)
          .select()
          .single()
      : await supabase
          .from('profile')
          .insert(payload)
          .select()
          .single()

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    if (data) {
      setProfileId(data.id)
    }

    setMessage('Profile saved successfully.')
  }

  const inputStyle = {
    borderColor: 'var(--border)',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
  }

  if (loading) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading profile settings...
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {/* FULL WIDTH LIVE PREVIEW HERO SECTION */}
      <section className="soft-panel rounded-2xl p-6 sm:p-8">
        <p className="eyebrow">Live Preview</p>

        <div className="mt-6 flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
          <div
            className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-inner sm:h-36 sm:w-36"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}
          >
            {form.profile_image ? (
              <img
                src={form.profile_image}
                alt={form.name || 'Profile preview'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display text-3xl font-semibold" style={{ color: 'var(--accent)' }}>
                {form.name
                  .split(' ')
                  .filter(Boolean)
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'ZM'}
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              {form.name || 'Your Name'}
            </h3>

            <p className="mt-1 font-mono text-xs font-medium" style={{ color: 'var(--accent)' }}>
              {form.title || 'Your Professional Title'}
            </p>

            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {form.bio || 'Your professional bio will appear here.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {form.email && (
                <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  {form.email}
                </span>
              )}

              {form.linkedin && (
                <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  LinkedIn
                </span>
              )}

              {form.github && (
                <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  GitHub
                </span>
              )}

              {form.cv_url && (
                <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  CV attached
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FULL WIDTH EDIT FORM SECTION */}
      <section className="soft-panel rounded-2xl p-6 sm:p-8">
        <div>
          <p className="eyebrow">Profile Settings</p>
          <h2 className="font-display mt-2 text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            Your portfolio identity
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            These details appear across the public portfolio.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Full name
              </label>

              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Professional title
              </label>

              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                placeholder="Example: Data Analyst"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Professional bio
            </label>

            <textarea
              required
              rows={5}
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              className="mt-1.5 w-full resize-y rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed outline-none"
              style={inputStyle}
              placeholder="Write a short professional introduction."
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Email address
              </label>

              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Phone number
              </label>

              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                placeholder="+20 1xx xxx xxxx"
              />
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                LinkedIn URL
              </label>

              <input
                type="url"
                value={form.linkedin}
                onChange={(event) => setForm({ ...form, linkedin: event.target.value })}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                GitHub URL
              </label>

              <input
                type="url"
                value={form.github}
                onChange={(event) => setForm({ ...form, github: event.target.value })}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={inputStyle}
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            <CvUploader
              label="CV file"
              value={form.cv_url}
              onChange={(url) => setForm({ ...form, cv_url: url })}
              folder="cv"
              helpText="Optional. Upload your CV as a PDF or Word file."
            />

            <AssetUploader
              label="Profile photo"
              value={form.profile_image}
              onChange={(url) => setForm({ ...form, profile_image: url })}
              folder="profile"
              cropShape="circle"
              helpText="Optional. Upload your profile photo or paste an image URL."
            />
          </div>

          {error && (
            <p
              className="rounded-xl border px-3.5 py-2.5 text-sm"
              style={{ borderColor: '#DC5B4B', color: '#DC5B4B' }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              className="rounded-xl border px-3.5 py-2.5 text-sm"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              {message}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="primary-button disabled:opacity-50">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
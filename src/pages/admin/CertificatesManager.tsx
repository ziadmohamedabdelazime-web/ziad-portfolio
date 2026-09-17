import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import AssetUploader from '../../components/admin/AssetUploader'

interface CertificateRow {
  id: string
  title: string
  issuer: string
  issue_date: string | null
  credential_url: string | null
  image_url: string | null
  sort_order: number | null
}

const emptyForm = {
  title: '',
  issue_date: '',
  image_url: '',
}

export default function CertificatesManager() {
  const [certificates, setCertificates] = useState<CertificateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())
  const previousRects = useRef<Map<string, DOMRect>>(new Map())
  const lastSwapTarget = useRef<string | null>(null)

  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>()
    itemRefs.current.forEach((node, id) => {
      if (node) nextRects.set(id, node.getBoundingClientRect())
    })

    const frames: number[] = []
    nextRects.forEach((nextRect, id) => {
      const node = itemRefs.current.get(id)
      const previousRect = previousRects.current.get(id)
      if (!node || !previousRect) return
      const deltaX = previousRect.left - nextRect.left
      const deltaY = previousRect.top - nextRect.top
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return

      node.style.transition = 'none'
      node.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`
      frames.push(window.requestAnimationFrame(() => {
        node.style.transition =
          'transform 340ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease, opacity 220ms ease'
        node.style.transform = 'translate3d(0, 0, 0)'
      }))
    })
    previousRects.current = nextRects
    return () => frames.forEach((frame) => window.cancelAnimationFrame(frame))
  }, [certificates])

  function setItemRef(id: string, node: HTMLElement | null) {
    if (node) itemRefs.current.set(id, node)
    else itemRefs.current.delete(id)
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>, id: string) {
    if (!event.dataTransfer) return
    const index = certificates.findIndex((entry) => entry.id === id)
    if (index < 0) return

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)

    const card = itemRefs.current.get(id)
    if (card) {
      const rect = card.getBoundingClientRect()
      const preview = card.cloneNode(true) as HTMLElement
      preview.style.position = 'fixed'
      preview.style.left = '-10000px'
      preview.style.top = '0'
      preview.style.width = `${rect.width}px`
      preview.style.height = `${rect.height}px`
      preview.style.margin = '0'
      preview.style.pointerEvents = 'none'
      preview.style.opacity = '0.94'
      preview.style.transform = 'scale(1.02)'
      preview.style.boxShadow = '0 24px 55px rgba(15, 23, 42, 0.24)'
      document.body.appendChild(preview)
      event.dataTransfer.setDragImage(preview, event.nativeEvent.offsetX, event.nativeEvent.offsetY)
      window.setTimeout(() => preview.remove(), 0)
    }

    lastSwapTarget.current = null
    setDraggedId(id)
    setDragOverId(id)
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault()
    if (!event.dataTransfer) return
    event.dataTransfer.dropEffect = 'move'
    if (!draggedId || draggedId === targetId) return

    const currentItems = [...certificates]
    const fromIndex = currentItems.findIndex((entry) => entry.id === draggedId)
    const targetIndex = currentItems.findIndex((entry) => entry.id === targetId)
    if (fromIndex < 0 || targetIndex < 0) return

    const rect = event.currentTarget.getBoundingClientRect()

    const pointerInsideTarget =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom

    if (pointerInsideTarget) {
      if (lastSwapTarget.current === targetId) {
        setDragOverId(targetId)
        return
      }

      const swappedItems = [...currentItems]
      ;[swappedItems[fromIndex], swappedItems[targetIndex]] = [
        swappedItems[targetIndex],
        swappedItems[fromIndex],
      ]

      setDragOverId(targetId)
      setCertificates(swappedItems)
      lastSwapTarget.current = targetId
      return
    }

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const before =
      event.clientY < centerY ||
      (Math.abs(event.clientY - centerY) < rect.height * 0.25 && event.clientX < centerX)

    let insertionIndex = before ? targetIndex : targetIndex + 1
    if (fromIndex < insertionIndex) insertionIndex -= 1
    if (insertionIndex === fromIndex) {
      setDragOverId(targetId)
      return
    }

    const [moved] = currentItems.splice(fromIndex, 1)
    currentItems.splice(insertionIndex, 0, moved)
    setCertificates(currentItems)
    setDragOverId(targetId)
  }

  function handleDragEnd() {
    lastSwapTarget.current = null
    setDraggedId(null)
    setDragOverId(null)
  }

  async function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    if (!draggedId) return
    lastSwapTarget.current = null
    const orderedItems = [...certificates]
    setDraggedId(null)
    setDragOverId(null)
    await updateSortOrders(orderedItems)
  }

  async function load() {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setCertificates(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateSortOrders(updatedItems: CertificateRow[]) {
    if (!supabase) return

    setCertificates(updatedItems)

    const updates = updatedItems.map((item, index) =>
      supabase
        .from('certificates')
        .update({ sort_order: index })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some((res) => res.error)
    if (hasError) {
      setError('Failed to save reordered items.')
    }
  }

  function openNewCertificate() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setIsEditorOpen(true)
  }

  function startEdit(cert: CertificateRow) {
    setEditingId(cert.id)
    setForm({
      title: cert.title,
      issue_date: cert.issue_date ?? '',
      image_url: cert.image_url ?? '',
    })
    setError(null)
    setIsEditorOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setIsEditorOpen(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!supabase) {
      setError('Supabase client is not configured.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      title: form.title.trim(),
      issuer: '',
      issue_date: null,
      credential_url: null,
      image_url: form.image_url.trim() || null,
    }

    if (editingId) {
      const { error: saveError } = await supabase
        .from('certificates')
        .update(payload)
        .eq('id', editingId)

      if (saveError) {
        setSaving(false)
        setError(saveError.message)
        return
      }
    } else {
      const { error: saveError } = await supabase
        .from('certificates')
        .insert({
          ...payload,
          sort_order: certificates.length,
        })

      if (saveError) {
        setSaving(false)
        setError(saveError.message)
        return
      }
    }

    setSaving(false)
    resetForm()
    await load()
  }

  async function handleDelete(id: string) {
    if (!supabase) return

    const confirmed = window.confirm('Are you sure you want to delete this certificate?')
    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    await load()
  }

  const inputStyle = {
    borderColor: 'var(--border)',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Portfolio Content</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Certificates Management
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Add and manage your professional certifications and achievements.
          </p>
        </div>

        <button type="button" onClick={openNewCertificate} className="primary-button">
          + Add Certificate
        </button>
      </div>

      <section className="mt-9">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Portfolio Content</p>
            <h2 className="font-display mt-2 text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              Existing Certificates
            </h2>
          </div>
          <span
            className="rounded-full border px-3 py-1.5 font-mono text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {certificates.length} total
          </span>
        </div>

        {loading ? (
          <p className="mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading certificates...
          </p>
        ) : (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {certificates.map((cert) => (
              <article
                key={cert.id}
                ref={(node) => setItemRef(cert.id, node)}
                onDragOver={(e) => handleDragOver(e, cert.id)}
                onDrop={(e) => handleDrop(e)}
                onDragEnd={handleDragEnd}
                className={`
                  soft-panel
                  overflow-hidden
                  rounded-2xl
                  transition-all
                  duration-200
                  ${draggedId === cert.id ? 'opacity-45 scale-[0.985] border-2 border-dashed border-accent shadow-xl' : ''}
                  ${dragOverId === cert.id && draggedId !== cert.id ? 'ring-2 ring-accent ring-offset-2' : ''}
                `}
              >
                <div className="relative h-48 w-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                  <div
                    className="absolute left-3 top-3 z-10 flex h-8 w-8 drag-handle cursor-grab items-center justify-center rounded-lg bg-black/60 text-white shadow backdrop-blur transition-transform active:cursor-grabbing hover:scale-105"
                    title="Drag to reorder"
                    draggable
                    onDragStart={(e) => handleDragStart(e, cert.id)}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>

                  {cert.image_url ? (
                    <img src={cert.image_url} alt={cert.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                        NO IMAGE
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-display mt-2 line-clamp-2 text-lg font-semibold" style={{ color: 'var(--text)' }}>
                    {cert.title}
                  </h3>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(cert)}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm transition-opacity hover:opacity-80"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cert.id)}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm transition-opacity hover:opacity-80"
                      style={{ borderColor: '#DC5B4B', color: '#DC5B4B' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {certificates.length === 0 && (
              <div
                className="rounded-2xl border border-dashed p-12 text-center sm:col-span-2 xl:col-span-3"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <p className="text-sm">No certificates added yet.</p>
                <button
                  type="button"
                  onClick={openNewCertificate}
                  className="mt-4 text-sm font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  + Add your first certificate
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:py-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.78)' }}>
          <div className="mx-auto max-w-2xl">
            <section className="soft-panel rounded-2xl p-5 shadow-2xl sm:p-7" style={{ backgroundColor: 'var(--surface)' }}>
              <div className="flex items-start justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="eyebrow">Certificate Editor</p>
                  <h2 className="font-display mt-2 text-2xl font-semibold" style={{ color: 'var(--text)' }}>
                    {editingId ? 'Edit Certificate' : 'New Certificate'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Certificate Title
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                    style={inputStyle}
                    placeholder="e.g. Data Analyst Professional Certificate"
                  />
                </div>

                <div>
                  <AssetUploader
                    label="Certificate Image"
                    value={form.image_url}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                    folder="certificates"
                    helpText="Upload an image or preview badge of the certificate."
                  />
                </div>

                {error && (
                  <p className="rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: '#DC5B4B', color: '#DC5B4B' }}>
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border px-5 py-2.5 text-sm transition-opacity hover:opacity-70"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="primary-button disabled:opacity-50">
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Certificate'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
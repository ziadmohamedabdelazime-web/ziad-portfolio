import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { mapEducationRow } from '../../data/mappers'
import type { Education } from '../../data/seed'
import AssetUploader from '../../components/admin/AssetUploader'

const emptyForm = {
  institution: '',
  degree: '',
  start_date: '',
  end_date: '',
  logo_url: '',
}

export default function EducationManager() {
  const [education, setEducation] = useState<Education[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Professional live drag & drop.
  // Dragging starts only from the dedicated handle; cards themselves are not draggable.
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
  }, [education])

  function setItemRef(id: string, node: HTMLElement | null) {
    if (node) itemRefs.current.set(id, node)
    else itemRefs.current.delete(id)
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>, id: string) {
    if (!event.dataTransfer) return
    const index = education.findIndex((entry) => entry.id === id)
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

    const currentItems = [...education]
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
      setEducation(swappedItems)
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
    setEducation(currentItems)
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
    const orderedItems = [...education]
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
      .from('education')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setEducation(data.map(mapEducationRow))
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateSortOrders(updatedItems: Education[]) {
    if (!supabase) return
    const client = supabase

    setEducation(updatedItems)

    const updates = updatedItems.map((item, index) =>
      client
        .from('education')
        .update({ sort_order: index })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some((res) => res.error)
    if (hasError) {
      setError('Failed to save reordered items.')
    }
  }

  function openNewEducation() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setIsEditorOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setIsEditorOpen(false)
  }

  function startEdit(item: Education) {
    setEditingId(item.id)

    setForm({
      institution: item.institution,
      degree: item.degree,
      start_date: item.startDate,
      end_date: item.endDate ?? '',
      logo_url: item.logoUrl ?? '',
    })

    setError(null)
    setIsEditorOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!supabase) {
      setError('Supabase is not configured yet.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      institution: form.institution.trim(),
      degree: form.degree.trim(),
      start_date: form.start_date.trim(),
      end_date: form.end_date.trim() || null,
      logo_url: form.logo_url.trim() || null,
    }

    const { error: saveError } = editingId
      ? await supabase.from('education').update(payload).eq('id', editingId)
      : await supabase.from('education').insert({
          ...payload,
          sort_order: education.length,
        })

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    resetForm()
    load()
  }

  async function handleDelete(id: string) {
    if (!supabase) return

    if (!window.confirm('Delete this education entry permanently?')) return

    const { error: deleteError } = await supabase
      .from('education')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    load()
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
            Education Management
          </h1>

          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Manage your academic background.
          </p>
        </div>

        <button type="button" onClick={openNewEducation} className="primary-button">
          + Add Education
        </button>
      </div>

      <section className="mt-9">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Portfolio Content</p>

            <h2 className="font-display mt-2 text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              Existing Education
            </h2>
          </div>

          <span
            className="rounded-full border px-3 py-1.5 font-mono text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {education.length} total
          </span>
        </div>

        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          Drag cards up or down to reorder items. The top item will appear first on the portfolio.
        </p>

        {loading ? (
          <p className="mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading education...
          </p>
        ) : (
          <div className="mt-7 space-y-4">
            {education.map((item) => (
              <article
                key={item.id}
                ref={(node) => setItemRef(item.id, node)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={(e) => handleDrop(e)}
                onDragEnd={handleDragEnd}
                className={`
                  soft-panel
                  rounded-2xl
                  p-5
                  transition-all
                  duration-200
                  ${draggedId === item.id ? 'opacity-45 scale-[0.985] border-2 border-dashed border-accent shadow-xl' : ''}
                  ${dragOverId === item.id && draggedId !== item.id ? 'ring-2 ring-accent ring-offset-2' : ''}
                `}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-8 drag-handle cursor-grab items-center justify-center rounded-lg border transition-transform active:cursor-grabbing hover:scale-105"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text-muted)',
                      }}
                      title="Drag to reorder"
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>

                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
                    >
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.institution}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <span className="font-display text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                          {item.institution.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                        {item.startDate} – {item.endDate ?? 'Present'}
                      </p>

                      <h3 className="font-display mt-1 text-lg font-semibold" style={{ color: 'var(--text)' }}>
                        {item.degree}
                      </h3>

                      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {item.institution}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-full border px-3 py-1.5 text-xs"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-full border px-3 py-1.5 text-xs"
                      style={{ borderColor: '#DC5B4B', color: '#DC5B4B' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {education.length === 0 && (
              <div
                className="rounded-2xl border border-dashed p-12 text-center"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <p className="text-sm">No education entries have been added yet.</p>

                <button
                  type="button"
                  onClick={openNewEducation}
                  className="mt-4 text-sm font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  + Add your first education entry
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:py-10"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.78)' }}
        >
          <div className="mx-auto max-w-3xl">
            <section
              className="soft-panel rounded-2xl p-5 shadow-2xl sm:p-7"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <div
                className="flex items-start justify-between gap-4 border-b pb-5"
                style={{ borderColor: 'var(--border)' }}
              >
                <div>
                  <p className="eyebrow">Education Editor</p>

                  <h2 className="font-display mt-2 text-2xl font-semibold" style={{ color: 'var(--text)' }}>
                    {editingId ? 'Edit Education' : 'New Education'}
                  </h2>

                  <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Add degree, institution, and logo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Degree
                  </label>

                  <input
                    required
                    value={form.degree}
                    onChange={(event) => setForm({ ...form, degree: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                    style={inputStyle}
                    placeholder="Example: Bachelor of Computer Science"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Institution
                  </label>

                  <input
                    required
                    value={form.institution}
                    onChange={(event) => setForm({ ...form, institution: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                    style={inputStyle}
                    placeholder="Example: Zagazig University"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Start date
                    </label>

                    <input
                      required
                      value={form.start_date}
                      onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                      style={inputStyle}
                      placeholder="Example: 2021"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      End date
                    </label>

                    <input
                      value={form.end_date}
                      onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                      style={inputStyle}
                      placeholder="Leave empty for Present"
                    />
                  </div>
                </div>

                <AssetUploader
                  label="Institution logo"
                  value={form.logo_url}
                  onChange={(url) => setForm({ ...form, logo_url: url })}
                  folder="education"
                  cropShape="square"
                  helpText="Optional. Upload your college/institution logo."
                />

                {error && (
                  <p
                    className="rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: '#DC5B4B', color: '#DC5B4B' }}
                  >
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-5 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border px-5 py-2.5 text-sm transition-opacity hover:opacity-70"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    Cancel
                  </button>

                  <button type="submit" disabled={saving} className="primary-button disabled:opacity-50">
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Education'}
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
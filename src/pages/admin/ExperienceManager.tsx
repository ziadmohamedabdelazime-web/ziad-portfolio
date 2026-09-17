import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { mapExperienceRow } from '../../data/mappers'
import type { Experience } from '../../data/seed'

const emptyForm = {
  organization: '',
  position: '',
  start_date: '',
  end_date: '',
  description: '',
}

export default function ExperienceManager() {
  const [experience, setExperience] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
  }, [experience])

  function setItemRef(id: string, node: HTMLElement | null) {
    if (node) itemRefs.current.set(id, node)
    else itemRefs.current.delete(id)
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>, id: string) {
    if (!event.dataTransfer) return
    const index = experience.findIndex((entry) => entry.id === id)
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

    const currentItems = [...experience]
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
      setExperience(swappedItems)
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
    setExperience(currentItems)
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
    const orderedItems = [...experience]
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
      .from('experience')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setExperience(data.map(mapExperienceRow))
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateSortOrders(updatedItems: Experience[]) {
    if (!supabase) return
    const client = supabase

    setExperience(updatedItems)

    const updates = updatedItems.map((item, index) =>
      client
        .from('experience')
        .update({ sort_order: index })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some((res) => res.error)
    if (hasError) {
      setError('Failed to save reordered items.')
    }
  }

  function openNewForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setIsModalOpen(false)
  }

  function startEdit(item: Experience) {
    setEditingId(item.id)
    setForm({
      organization: item.organization,
      position: item.position,
      start_date: item.startDate,
      end_date: item.endDate ?? '',
      description: item.description.join('\n'),
    })
    setError(null)
    setIsModalOpen(true)
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
      organization: form.organization.trim(),
      position: form.position.trim(),
      start_date: form.start_date.trim(),
      end_date: form.end_date.trim() || null,
      description: form.description
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    }

    const { error: saveError } = editingId
      ? await supabase.from('experience').update(payload).eq('id', editingId)
      : await supabase.from('experience').insert({
          ...payload,
          sort_order: experience.length,
        })

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    closeModal()
    load()
  }

  async function handleDelete(id: string) {
    if (!supabase) return
    if (!window.confirm('Delete this experience entry permanently?')) return

    const { error: deleteError } = await supabase
      .from('experience')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">PORTFOLIO CONTENT</p>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text)' }}>
            Work experience
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span
            className="rounded-full border px-3 py-1 font-mono text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {experience.length} total
          </span>
          <button type="button" onClick={openNewForm} className="primary-button">
            + Add Experience
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading experience...
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {experience.map((item) => (
            <article
              key={item.id}
              ref={(node) => setItemRef(item.id, node)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDrop={(e) => handleDrop(e)}
              onDragEnd={handleDragEnd}
              className={`
                soft-panel
                flex
                flex-col
                justify-between
                overflow-hidden
                rounded-2xl
                p-6
                transition-all
                duration-200
                ${draggedId === item.id ? 'opacity-45 scale-[0.985] border-2 border-dashed border-accent shadow-xl' : ''}
                ${dragOverId === item.id && draggedId !== item.id ? 'ring-2 ring-accent ring-offset-2' : ''}
              `}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 drag-handle cursor-grab items-center justify-center rounded-lg border transition-transform active:cursor-grabbing hover:scale-105"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text-muted)',
                      }}
                      title="Drag to reorder"
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>

                    <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                      {item.startDate} — {item.endDate ?? 'Present'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-xl border px-3 py-1 text-xs font-medium"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-xl border px-3 py-1 text-xs font-medium"
                      style={{ borderColor: '#DC5B4B', color: '#DC5B4B' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <h3 className="font-display mt-3 text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  {item.position}
                </h3>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  {item.organization}
                </p>

                <ul className="mt-4 space-y-2">
                  {item.description.map((line, idx) => (
                    <li key={idx} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--accent)' }}>•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}

          {experience.length === 0 && (
            <div
              className="col-span-full rounded-2xl border border-dashed p-12 text-center text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              No experience entries added yet.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
          <div
            className="soft-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div
              className="flex items-center justify-between border-b pb-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <p className="eyebrow">EXPERIENCE EDITOR</p>
                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>
                  {editingId ? 'Edit experience' : 'Add experience'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-lg font-bold"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Job title</label>
                <input
                  required
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Example: Data Analyst Intern"
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Organization</label>
                <input
                  required
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  placeholder="Example: Green Pack"
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Start date</label>
                  <input
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    placeholder="Example: 2025-11"
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>End date</label>
                  <input
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    placeholder="Leave empty for Present"
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Responsibilities and achievements</label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={'Write one point on each line.\nExample: Built interactive Power BI dashboards.'}
                  className="mt-1 w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              {error && (
                <p className="text-xs" style={{ color: '#DC5B4B' }}>{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border px-4 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
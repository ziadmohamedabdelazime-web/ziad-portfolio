import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { mapSkillRow } from '../../data/mappers'
import type { Skill } from '../../data/seed'
import AssetUploader from '../../components/admin/AssetUploader'

const emptyForm = {
  name: '',
  image_url: '',
}

export default function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  // Professional live drag & drop.
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
  }, [skills])

  function setItemRef(id: string, node: HTMLElement | null) {
    if (node) itemRefs.current.set(id, node)
    else itemRefs.current.delete(id)
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>, id: string) {
    if (!event.dataTransfer) return
    const index = skills.findIndex((entry) => entry.id === id)
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

    const currentItems = [...skills]
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
      setSkills(swappedItems)
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
    setSkills(currentItems)
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
    const orderedItems = [...skills]
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
      .from('skills')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setSkills(data.map(mapSkillRow))
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateSortOrders(updatedItems: Skill[]) {
    if (!supabase) return
    const client = supabase

    setSkills(updatedItems)

    const updates = updatedItems.map((item, index) =>
      client
        .from('skills')
        .update({ sort_order: index })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some((res) => res.error)
    if (hasError) {
      setError('Failed to save reordered items.')
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setEditorOpen(false)
  }

  function openAddSkill() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setEditorOpen(true)
  }

  function startEdit(skill: Skill) {
    setEditingId(skill.id)
    setForm({
      name: skill.name,
      image_url: skill.image_url ?? '',
    })
    setError(null)
    setEditorOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!supabase) {
      setError('Supabase is not configured yet.')
      return
    }

    if (!form.name.trim()) {
      setError('Skill name is required.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      category: 'Other',
      description: null,
      image_url: form.image_url.trim() || null,
    }

    const { error: saveError } = editingId
      ? await supabase.from('skills').update(payload).eq('id', editingId)
      : await supabase.from('skills').insert({
          ...payload,
          sort_order: skills.length,
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
    if (!window.confirm('Delete this skill permanently?')) return

    const { error: deleteError } = await supabase
      .from('skills')
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
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Tech Stack Editor</p>
          <h2
            className="font-display mt-2 text-2xl font-semibold sm:text-3xl"
            style={{ color: 'var(--text)' }}
          >
            Skills Management
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Manage your technical skills and tools.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddSkill}
          className="primary-button"
        >
          + Add Skill
        </button>
      </div>

      <section className="mt-9">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Portfolio Content</p>
            <h3
              className="font-display mt-2 text-xl font-semibold"
              style={{ color: 'var(--text)' }}
            >
              Existing Skills
            </h3>
          </div>

          <span
            className="rounded-full border px-3 py-1.5 font-mono text-xs"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            {skills.length} total
          </span>
        </div>

        {loading ? (
          <p
            className="mt-6 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Loading skills...
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <article
                key={skill.id}
                ref={(node) => setItemRef(skill.id, node)}
                onDragOver={(e) => handleDragOver(e, skill.id)}
                onDrop={(e) => handleDrop(e)}
                onDragEnd={handleDragEnd}
                className={`
                  soft-panel
                  rounded-2xl
                  p-5
                  transition-all
                  duration-200
                  ${draggedId === skill.id ? 'opacity-45 scale-[0.985] border-2 border-dashed border-accent shadow-xl' : ''}
                  ${dragOverId === skill.id && draggedId !== skill.id ? 'ring-2 ring-accent ring-offset-2' : ''}
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-7 drag-handle cursor-grab items-center justify-center rounded-lg border transition-transform active:cursor-grabbing hover:scale-105"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text-muted)',
                      }}
                      title="Drag to reorder"
                      draggable
                      onDragStart={(e) => handleDragStart(e, skill.id)}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>

                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--bg)',
                      }}
                    >
                      {skill.image_url ? (
                        <img
                          src={skill.image_url}
                          alt={skill.name}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <span
                          className="font-display text-xs font-semibold"
                          style={{ color: 'var(--accent)' }}
                        >
                          {skill.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4
                        className="font-display text-base font-semibold"
                        style={{ color: 'var(--text)' }}
                      >
                        {skill.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(skill)}
                      className="rounded-lg border px-2.5 py-1 text-xs"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(skill.id)}
                      className="rounded-lg border px-2.5 py-1 text-xs"
                      style={{
                        borderColor: '#DC5B4B',
                        color: '#DC5B4B',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {skills.length === 0 && (
              <div
                className="col-span-full rounded-2xl border border-dashed p-12 text-center text-sm"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                No skills have been added yet.
              </div>
            )}
          </div>
        )}
      </section>

      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.78)' }}
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
                <p className="eyebrow">Skill Editor</p>
                <h3
                  className="font-display text-xl font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  {editingId ? 'Edit Skill' : 'Add Skill'}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-lg font-bold"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  Skill Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Example: Python"
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <AssetUploader
                label="Skill Icon / Image"
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                folder="skills"
                cropShape="square"
                helpText="Optional skill logo or icon."
              />

              {error && (
                <p className="text-xs" style={{ color: '#DC5B4B' }}>
                  {error}
                </p>
              )}

              <div
                className="flex justify-end gap-3 border-t pt-4"
                style={{ borderColor: 'var(--border)' }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border px-4 py-2 text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
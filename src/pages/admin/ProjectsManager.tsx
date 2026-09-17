import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { mapProjectRow } from '../../data/mappers'
import type { Project } from '../../data/seed'
import AssetUploader from '../../components/admin/AssetUploader'

const emptyForm = {
  title: '',
  short_description: '',
  full_description: '',
  technologies: '',
  key_features: '',
  github_url: '',
  live_url: '',
  image_url: '',
  category: '',
  project_date: '',
  featured: false,
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [projectImages, setProjectImages] = useState<string[]>([])
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
  }, [projects])

  function setItemRef(id: string, node: HTMLElement | null) {
    if (node) itemRefs.current.set(id, node)
    else itemRefs.current.delete(id)
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>, id: string) {
    if (!event.dataTransfer) return
    const index = projects.findIndex((entry) => entry.id === id)
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

    const currentItems = [...projects]
    const fromIndex = currentItems.findIndex((entry) => entry.id === draggedId)
    const targetIndex = currentItems.findIndex((entry) => entry.id === targetId)
    if (fromIndex < 0 || targetIndex < 0) return

    const rect = event.currentTarget.getBoundingClientRect()

    // Exact-card swap:
    // If the pointer is actually inside the target card, exchange the two
    // cards directly (A <-> B) instead of inserting A before/after B.
    // The guard prevents rapid back-and-forth swaps while the pointer stays
    // over the same physical card.
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
      setProjects(swappedItems)
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
    setProjects(currentItems)
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
    const orderedItems = [...projects]
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
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setProjects(data.map(mapProjectRow))
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateSortOrders(updatedItems: Project[]) {
    if (!supabase) return

    setProjects(updatedItems)

    const updates = updatedItems.map((item, index) =>
      supabase
        .from('projects')
        .update({ sort_order: index })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some((res) => res.error)
    if (hasError) {
      setError('Failed to save reordered items.')
    }
  }

  async function loadProjectImages(projectId: string) {
    if (!supabase) return

    const { data, error } = await supabase
      .from('project_images')
      .select('image_url')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setProjectImages(data.map((item) => item.image_url))
    }
  }

  function openNewProject() {
    setEditingId(null)
    setForm(emptyForm)
    setProjectImages([])
    setError(null)
    setIsEditorOpen(true)
  }

  async function startEdit(project: Project) {
    setEditingId(project.id)

    setForm({
      title: project.title,
      short_description: project.shortDescription,
      full_description: project.fullDescription,
      technologies: project.technologies.join(', '),
      key_features: (project.keyFeatures ?? []).join('\n'),
      github_url: project.githubUrl ?? '',
      live_url: project.liveUrl ?? '',
      image_url: project.image ?? '',
      category: project.category,
      project_date: project.date ?? '',
      featured: project.featured ?? false,
    })

    setProjectImages([])
    setError(null)
    setIsEditorOpen(true)

    await loadProjectImages(project.id)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setProjectImages([])
    setError(null)
    setIsEditorOpen(false)
  }

  function addProjectImage(url: string) {
    if (!url.trim()) return

    setProjectImages((current) => [...current, url.trim()])
  }

  function removeProjectImage(index: number) {
    setProjectImages((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!supabase) {
      setError('Supabase is not configured yet.')
      return
    }

    setSaving(true)
    setError(null)

    const imagesToSave = projectImages.length
      ? projectImages
      : form.image_url.trim()
        ? [form.image_url.trim()]
        : []

    const primaryImage = imagesToSave[0] ?? null

    const payload = {
      title: form.title.trim(),
      short_description: form.short_description.trim(),
      full_description: form.full_description.trim(),

      technologies: form.technologies
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),

      key_features: form.key_features
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),

      github_url: form.github_url.trim() || null,
      live_url: form.live_url.trim() || null,

      image_url: primaryImage,

      category: form.category.trim(),
      project_date: form.project_date.trim(),
      featured: form.featured,
    }

    let projectId = editingId

    if (!editingId) {
      const { data, error: saveError } = await supabase
        .from('projects')
        .insert({
          ...payload,
          sort_order: projects.length,
        })
        .select('id')
        .single()

      if (saveError) {
        setSaving(false)
        setError(saveError.message)
        return
      }

      projectId = data?.id ?? null
    }

    if (editingId) {
      const { error: saveError } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', editingId)

      if (saveError) {
        setSaving(false)
        setError(saveError.message)
        return
      }
    }

    if (!projectId) {
      setSaving(false)
      setError('Project could not be saved.')
      return
    }

    const { error: deleteImagesError } = await supabase
      .from('project_images')
      .delete()
      .eq('project_id', projectId)

    if (deleteImagesError) {
      setSaving(false)
      setError(deleteImagesError.message)
      return
    }

    if (imagesToSave.length > 0) {
      const imageRows = imagesToSave.map((url, index) => ({
        project_id: projectId,
        image_url: url,
        sort_order: index,
      }))

      const { error: imagesError } = await supabase
        .from('project_images')
        .insert(imageRows)

      if (imagesError) {
        setSaving(false)
        setError(imagesError.message)
        return
      }
    }

    setSaving(false)

    resetForm()
    await load()
  }

  async function handleDelete(id: string) {
    if (!supabase) return

    const confirmed = window.confirm(
      'Delete this project permanently?'
    )

    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from('projects')
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
          <h1
            className="font-display mt-2 text-3xl font-semibold tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Projects Management
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Manage your portfolio projects.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewProject}
          className="primary-button"
        >
          + Add Project
        </button>
      </div>

      <section className="mt-9">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Portfolio Content</p>
            <h2
              className="font-display mt-2 text-2xl font-semibold"
              style={{ color: 'var(--text)' }}
            >
              Existing Projects
            </h2>
          </div>

          <span
            className="rounded-full border px-3 py-1.5 font-mono text-xs"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            {projects.length} total
          </span>
        </div>

        {loading ? (
          <p
            className="mt-8 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Loading projects...
          </p>
        ) : (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <article
              key={project.id}
              ref={(node) => setItemRef(project.id, node)}
              onDragOver={(e) => handleDragOver(e, project.id)}
              onDrop={(e) => handleDrop(e)}
              onDragEnd={handleDragEnd}
                className={`
                  soft-panel
                  overflow-hidden
                  rounded-2xl
                  transition-all
                  duration-300
                  ease-in-out
                  ${draggedId === project.id ? 'opacity-45 scale-[0.985] border-2 border-dashed border-accent shadow-xl' : 'hover:-translate-y-1 hover:shadow-lg'}
                  ${dragOverId === project.id && draggedId !== project.id ? 'ring-2 ring-accent ring-offset-2' : ''}
                `}
              >
                <div
                  className="relative h-56 w-full overflow-hidden"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  <div
                    className="absolute left-3 top-3 z-10 flex h-8 w-8 drag-handle cursor-grab items-center justify-center rounded-lg bg-black/60 text-white shadow backdrop-blur transition-all duration-200 active:cursor-grabbing hover:scale-110"
                    title="Drag to reorder"
                    draggable
                    onDragStart={(e) => handleDragStart(e, project.id)}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>

                  {project.image ? (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                        NO IMAGE
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                      {project.category}
                    </span>

                    {project.featured && (
                      <span
                        className="rounded-full px-2.5 py-1 font-mono text-[9px]"
                        style={{
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--accent)',
                        }}
                      >
                        FEATURED
                      </span>
                    )}
                  </div>

                  <h3
                    className="font-display mt-2 line-clamp-2 text-xl font-semibold"
                    style={{ color: 'var(--text)' }}
                  >
                    {project.title}
                  </h3>

                  <p
                    className="mt-2 line-clamp-3 text-sm leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {project.shortDescription}
                  </p>

                  <p
                    className="mt-3 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {project.date}
                  </p>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(project)}
                      className="flex-1 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 hover:opacity-80 active:scale-95"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      className="flex-1 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 hover:opacity-80 active:scale-95"
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

            {projects.length === 0 && (
              <div
                className="rounded-2xl border border-dashed p-12 text-center sm:col-span-2 xl:col-span-3"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <p className="text-sm">No projects have been added yet.</p>
                <button
                  type="button"
                  onClick={openNewProject}
                  className="mt-4 text-sm font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  + Add your first project
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:py-10 transition-opacity duration-300 animate-fadeIn"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.78)' }}
        >
          <div className="mx-auto max-w-5xl">
            <section
              className="soft-panel rounded-2xl p-5 shadow-2xl sm:p-7 transition-all duration-300 animate-slideUp"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <div
                className="flex items-start justify-between gap-4 border-b pb-5"
                style={{ borderColor: 'var(--border)' }}
              >
                <div>
                  <p className="eyebrow">Project Editor</p>
                  <h2
                    className="font-display mt-2 text-2xl font-semibold"
                    style={{ color: 'var(--text)' }}
                  >
                    {editingId ? 'Edit Project' : 'New Project'}
                  </h2>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Add project information, links and images.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg transition-transform duration-200 hover:scale-110 hover:opacity-70"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Project Title
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-accent"
                    style={inputStyle}
                    placeholder="Example: Sales Dashboard"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Short Description
                  </label>
                  <input
                    required
                    value={form.short_description}
                    onChange={(event) =>
                      setForm({ ...form, short_description: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-accent"
                    style={inputStyle}
                    placeholder="One concise sentence for the project card"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Full Description
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={form.full_description}
                    onChange={(event) =>
                      setForm({ ...form, full_description: event.target.value })
                    }
                    className="mt-1.5 w-full resize-y rounded-xl border px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors duration-200 focus:border-accent"
                    style={inputStyle}
                    placeholder="Describe the project, its goal, and what you built."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Category
                    </label>
                    <input
                      required
                      value={form.category}
                      onChange={(event) =>
                        setForm({ ...form, category: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-accent"
                      style={inputStyle}
                      placeholder="Example: BI Dashboards"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Date
                    </label>
                    <input
                      required
                      value={form.project_date}
                      onChange={(event) =>
                        setForm({ ...form, project_date: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-accent"
                      style={inputStyle}
                      placeholder="Example: 2026"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Technologies
                  </label>
                  <input
                    value={form.technologies}
                    onChange={(event) =>
                      setForm({ ...form, technologies: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-accent"
                    style={inputStyle}
                    placeholder="Python, SQL, Power BI"
                  />
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Separate each technology with a comma.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Key Features
                  </label>
                  <textarea
                    rows={4}
                    value={form.key_features}
                    onChange={(event) =>
                      setForm({ ...form, key_features: event.target.value })
                    }
                    className="mt-1.5 w-full resize-y rounded-xl border px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors duration-200 focus:border-accent"
                    style={inputStyle}
                    placeholder={'One feature per line\nExample: Built interactive KPI reporting'}
                  />
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Write one feature on each line.
                  </p>
                </div>

                <div
                  className="rounded-2xl border p-4 sm:p-5"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--bg)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        Project Images
                      </label>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        You can upload multiple images for one project.
                      </p>
                    </div>

                    <span
                      className="shrink-0 rounded-full border px-3 py-1.5 text-xs"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {projectImages.length} images
                    </span>
                  </div>

                  <div className="mt-4">
                    <AssetUploader
                      label="Upload Project Image"
                      value=""
                      onChange={addProjectImage}
                      folder="projects"
                      helpText="Upload another image for this project."
                    />
                  </div>

                  {projectImages.length > 0 && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {projectImages.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md"
                          style={{
                            borderColor: 'var(--border)',
                            backgroundColor: 'var(--surface)',
                          }}
                        >
                          <div
                            className="relative h-40 overflow-hidden"
                            style={{ backgroundColor: 'var(--surface-2)' }}
                          >
                            <img
                              src={image}
                              alt={`Project image ${index + 1}`}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                            <div
                              className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.68)',
                                color: '#fff',
                              }}
                            >
                              Image {index + 1}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 p-3">
                            {index === 0 ? (
                              <span
                                className="text-xs font-medium"
                                style={{ color: 'var(--accent)' }}
                              >
                                Main image
                              </span>
                            ) : (
                              <span
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Project image
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => removeProjectImage(index)}
                              className="rounded-lg border px-3 py-1.5 text-xs transition-all duration-200 hover:opacity-70 active:scale-95"
                              style={{
                                borderColor: '#DC5B4B',
                                color: '#DC5B4B',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={form.github_url}
                      onChange={(event) =>
                        setForm({ ...form, github_url: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-accent"
                      style={inputStyle}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Live Demo URL
                    </label>
                    <input
                      type="url"
                      value={form.live_url}
                      onChange={(event) =>
                        setForm({ ...form, live_url: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-accent"
                      style={inputStyle}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <label
                  className="flex cursor-pointer items-center gap-2 text-sm transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text)' }}
                >
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      setForm({ ...form, featured: event.target.checked })
                    }
                  />
                  Show this project as featured
                </label>

                {error && (
                  <p
                    className="rounded-xl border px-3 py-2.5 text-sm"
                    style={{
                      borderColor: '#DC5B4B',
                      color: '#DC5B4B',
                    }}
                  >
                    {error}
                  </p>
                )}

                <div
                  className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border px-5 py-2.5 text-sm transition-all duration-200 hover:opacity-70 active:scale-95"
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
                    className="primary-button disabled:opacity-50 transition-transform active:scale-95"
                  >
                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Save Changes'
                        : 'Save Project'}
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
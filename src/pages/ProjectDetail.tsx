import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import { useContent } from '../hooks/useContent'
import {
  profile as seedProfile,
  projects as seedProjects,
  type Profile,
  type Project,
} from '../data/seed'
import { mapProfileRow, mapProjectRow } from '../data/mappers'

export default function ProjectDetail() {
  const { id } = useParams()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const { data: profile } = useContent<any, Profile>(
    'profile',
    seedProfile,
    (rows) => (rows[0] ? mapProfileRow(rows[0]) : seedProfile)
  )

  const { data: projects } = useContent<any, Project[]>(
    'projects',
    seedProjects,
    (rows) => rows.map(mapProjectRow),
    'sort_order'
  )

  const foundProject = projects.find((item) => item.id === id)

  if (!foundProject) {
    if (projects.length === 0) return null
    return <Navigate to="/#projects" replace />
  }

  // Re-bind to a definitely-typed constant so TypeScript keeps this narrowed
  // to `Project` (not `Project | undefined`) everywhere below, including
  // inside nested closures like the image slider's .map() callbacks.
  const project: Project = foundProject

  const projectImages: string[] = (project as any).images?.length > 0
    ? (project as any).images
    : project.image ? [project.image] : []

  const handleNext = () => {
    setActiveImageIndex((prev) => (prev + 1) % projectImages.length)
  }

  const handlePrev = () => {
    setActiveImageIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length)
  }

  return (
    <div>
      <Nav name={profile.name} />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <Link
          to="/#projects"
          className="inline-flex items-center gap-2 font-mono text-xs transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          <span>←</span> Back to portfolio
        </Link>

        <section className="mt-8 grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full border px-3 py-1 font-mono text-[10px] tracking-wide"
                style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
              >
                {project.category}
              </span>

              <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                {project.date}
              </span>
            </div>

            <h1
              className="font-display mt-5 text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl"
              style={{ color: 'var(--text)' }}
            >
              {project.title}
            </h1>

            <p
              className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {project.fullDescription}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-button"
                >
                  Live Demo ↗
                </a>
              )}

              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-button"
                >
                  View GitHub ↗
                </a>
              )}

              {!project.liveUrl && !project.githubUrl && (
                <span
                  className="rounded-full border px-4 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Links will be added soon
                </span>
              )}
            </div>
          </div>

          {/* ==========================================
              السلايدر التفاعلي بـ Smooth Horizontal Track (مع LTR ثابت)
             ========================================== */}
          <div
            dir="ltr"
            className="soft-panel relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl p-2 sm:min-h-96"
            style={{ backgroundColor: 'var(--surface-2)' }}
          >
            {projectImages.length > 0 ? (
              <div className="relative h-full w-full overflow-hidden rounded-2xl">
                {/* Track الصور بالاتجاه الأفقِي المُحدد */}
                <div
                  className="flex h-[340px] transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] sm:h-[420px]"
                  style={{
                    transform: `translateX(-${activeImageIndex * (100 / projectImages.length)}%)`,
                    width: `${projectImages.length * 100}%`,
                  }}
                >
                  {projectImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="h-full flex-shrink-0"
                      style={{ width: `${100 / projectImages.length}%` }}
                    >
                      <img
                        src={img}
                        alt={`${project.title} ${idx + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                </div>

                {/* أزرار التنقل */}
                {projectImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-md transition hover:scale-110 hover:bg-black/80 active:scale-95"
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-md transition hover:scale-110 hover:bg-black/80 active:scale-95"
                      aria-label="Next image"
                    >
                      ›
                    </button>

                    {/* نقاط الترقيم */}
                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
                      {projectImages.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`h-2 rounded-full transition-all duration-500 ${
                            idx === activeImageIndex
                              ? 'w-6 bg-white'
                              : 'w-2 bg-white/40 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    PROJECT OVERVIEW
                  </span>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                </div>

                <div
                  className="mt-7 rounded-2xl border p-5"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <div className="flex items-end gap-2">
                    {[46, 68, 40, 82, 58, 96, 74].map((height, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-t-md"
                        style={{
                          height: `${height}px`,
                          backgroundColor:
                            index === 5
                              ? 'var(--accent)'
                              : 'color-mix(in srgb, var(--accent) 32%, transparent)',
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
                      <p className="font-display text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                        {project.technologies.length}
                      </p>
                      <p className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        TOOLS
                      </p>
                    </div>

                    <div className="col-span-2 rounded-xl p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
                      <p className="font-mono text-[9px] tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        CATEGORY
                      </p>
                      <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {project.category}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-16 grid gap-10 border-t pt-12 lg:grid-cols-[0.8fr_1.2fr]" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="eyebrow">Tools Used</p>
            <h2 className="font-display mt-3 text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              Technologies
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.technologies.map((technology) => (
              <span
                key={technology}
                className="rounded-full border px-4 py-2 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {technology}
              </span>
            ))}
          </div>
        </section>

        {(project.keyFeatures?.length ?? 0) > 0 && (
          <section className="mt-12 border-t pt-12" style={{ borderColor: 'var(--border)' }}>
            <p className="eyebrow">Highlights</p>
            <h2 className="font-display mt-3 text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              Key Features
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(project.keyFeatures ?? []).map((feature, index) => (
                <div key={feature} className="soft-panel rounded-2xl p-5">
                  <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                    0{index + 1}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
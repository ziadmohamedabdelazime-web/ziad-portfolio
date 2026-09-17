import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import type { Project } from '../data/seed'

export default function ProjectCard({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loadingImages, setLoadingImages] = useState(false)

  // قفل سكرول الصفحة التي خلف المودال
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // إغلاق المودال عند الضغط على زر Escape
  useEffect(() => {
    if (!isOpen) return

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  // جلب كافة صور المشروع من Supabase عند فتح المودال
  useEffect(() => {
    if (!isOpen) return

    async function fetchProjectImages() {
      setCurrentImageIndex(0)

      if (!supabase) {
        if (project.image) setImages([project.image])
        return
      }

      setLoadingImages(true)
      const { data, error } = await supabase
        .from('project_images')
        .select('image_url')
        .eq('project_id', project.id)
        .order('sort_order', { ascending: true })

      if (!error && data && data.length > 0) {
        setImages(data.map((item) => item.image_url))
      } else if (project.image) {
        setImages([project.image])
      } else {
        setImages([])
      }
      setLoadingImages(false)
    }

    fetchProjectImages()
  }, [isOpen, project.id, project.image])

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      {/* بطاقة المشروع الخارجية */}
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="group soft-panel flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl text-left"
        onClick={() => setIsOpen(true)}
      >
        <div
          className="relative flex h-48 items-end overflow-hidden p-5"
          style={{ backgroundColor: 'var(--surface-2)' }}
        >
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--accent) 35%, transparent), transparent 55%)',
                }}
              />

              <div className="relative w-full">
                <div className="flex items-end gap-2">
                  {[35, 58, 42, 75, 54, 90].map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${height}px`,
                        backgroundColor:
                          index === 5
                            ? 'var(--accent)'
                            : 'color-mix(in srgb, var(--accent) 38%, transparent)',
                      }}
                    />
                  ))}
                </div>

                <div
                  className="mt-3 h-1.5 w-3/4 rounded-full"
                  style={{ backgroundColor: 'var(--border)' }}
                />
                <div
                  className="mt-2 h-1.5 w-1/2 rounded-full"
                  style={{ backgroundColor: 'var(--border)' }}
                />
              </div>
            </>
          )}

          <span
            className="relative rounded-full px-3 py-1 font-mono text-[10px] tracking-wide"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg) 88%, transparent)',
              color: 'var(--accent)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {project.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <span
              className="font-mono text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {project.date}
            </span>

            <span
              className="font-mono text-[10px] tracking-wide"
              style={{
                color: project.featured
                  ? 'var(--accent)'
                  : 'var(--text-muted)',
              }}
            >
              {project.featured ? 'FEATURED' : 'PROJECT'}
            </span>
          </div>

          <h3
            className="font-display mt-3 text-lg font-semibold leading-snug"
            style={{ color: 'var(--text)' }}
          >
            {project.title}
          </h3>

          <p
            className="mt-2 flex-1 text-sm leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            {project.shortDescription}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((technology) => (
              <span
                key={technology}
                className="rounded-full border px-2.5 py-1 text-xs"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                {technology}
              </span>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setIsOpen(true)
              }}
              className="text-sm font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              View details
            </button>

            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-transform duration-200 group-hover:translate-x-1"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--accent)',
              }}
              aria-hidden="true"
            >
              →
            </span>
          </div>
        </div>
      </motion.div>

      {/* مودال تفاصيل المشروع */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* الحاوية الأساسية للكارت مع الزر */}
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col">
              {/* زر الإغلاق: محاذي لأعلى الكارت تماماً وتبعد عنه مسافة جانبية على اليمين */}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setIsOpen(false)
                }}
                className="absolute top-0 -right-11 sm:-right-14 z-[120] flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border shadow-xl transition-all hover:scale-110 active:scale-95"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--bg) 95%, transparent)',
                  color: 'var(--text)',
                }}
                aria-label="Close"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full overflow-y-auto rounded-3xl border"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                }}
                onClick={(event) => event.stopPropagation()}
              >
                {/* معرض الصور التفاعلي */}
                <div
                  className="relative flex w-full items-center justify-center overflow-hidden rounded-t-3xl"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  {loadingImages ? (
                    <div
                      className="flex h-40 w-full items-center justify-center rounded-t-3xl p-6 sm:h-56"
                      style={{ backgroundColor: 'var(--surface-2)' }}
                    >
                      <span
                        className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                        aria-label="Loading images"
                      />
                    </div>
                  ) : images.length > 0 ? (
                    <div className="relative flex min-h-[250px] max-h-[420px] w-full items-center justify-center">
                      <img
                        src={images[currentImageIndex]}
                        alt={`${project.title} - Image ${currentImageIndex + 1}`}
                        className="max-h-[280px] w-full object-contain sm:max-h-[420px]"
                      />

                      {/* أسهم التنقل - تظهر فقط لو يوجد أكثر من صورة */}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevImage}
                            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border text-white transition-all hover:scale-110 active:scale-95"
                            style={{
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              backdropFilter: 'blur(4px)',
                            }}
                            aria-label="Previous Image"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>

                          <button
                            type="button"
                            onClick={handleNextImage}
                            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border text-white transition-all hover:scale-110 active:scale-95"
                            style={{
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              backdropFilter: 'blur(4px)',
                            }}
                            aria-label="Next Image"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>

                          {/* مؤشر النقاط أسفل معرض الصور */}
                          <div
                            className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                          >
                            {images.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCurrentImageIndex(idx)
                                }}
                                className={`h-2 rounded-full transition-all ${
                                  idx === currentImageIndex
                                    ? 'w-6 bg-white'
                                    : 'w-2 bg-white/40 hover:bg-white/70'
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className="flex h-40 w-full items-end rounded-t-3xl p-6 sm:h-56"
                      style={{ backgroundColor: 'var(--surface-2)' }}
                    >
                      <div className="w-full">
                        <div className="flex items-end gap-2">
                          {[35, 58, 42, 75, 54, 90].map((height, index) => (
                            <span
                              key={index}
                              className="flex-1 rounded-t-sm"
                              style={{
                                height: `${height}px`,
                                backgroundColor:
                                  index === 5
                                    ? 'var(--accent)'
                                    : 'color-mix(in srgb, var(--accent) 38%, transparent)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* تفاصيل المشروع النصية */}
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="rounded-full px-3 py-1 font-mono text-[10px] tracking-wide"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--accent) 12%, transparent)',
                        color: 'var(--accent)',
                      }}
                    >
                      {project.category}
                    </span>

                    {project.featured && (
                      <span
                        className="font-mono text-[10px] tracking-wide"
                        style={{ color: 'var(--accent)' }}
                      >
                        FEATURED
                      </span>
                    )}
                  </div>

                  <h2
                    className="font-display mt-4 text-2xl font-semibold sm:text-3xl"
                    style={{ color: 'var(--text)' }}
                  >
                    {project.title}
                  </h2>

                  {project.date && (
                    <p
                      className="mt-2 font-mono text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {project.date}
                    </p>
                  )}

                  <p
                    className="mt-6 whitespace-pre-line text-sm leading-7"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {project.fullDescription}
                  </p>

                  {project.keyFeatures && project.keyFeatures.length > 0 && (
                    <div className="mt-8">
                      <h3
                        className="font-display text-lg font-semibold"
                        style={{ color: 'var(--text)' }}
                      >
                        Key Features
                      </h3>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {project.keyFeatures.map((feature) => (
                          <div
                            key={feature}
                            className="rounded-xl border p-4 text-sm"
                            style={{
                              borderColor: 'var(--border)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <h3
                      className="font-display text-lg font-semibold"
                      style={{ color: 'var(--text)' }}
                    >
                      Technologies
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.technologies.map((technology) => (
                        <span
                          key={technology}
                          className="rounded-full border px-3 py-1.5 text-xs"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {technology}
                        </span>
                      ))}
                    </div>
                  </div>

                  {(project.githubUrl || project.liveUrl) && (
                    <div className="mt-8 flex flex-wrap gap-3">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-xl px-5 py-3 text-sm font-semibold"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: '#fff',
                          }}
                        >
                          Live Demo
                        </a>
                      )}

                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-xl border px-5 py-3 text-sm font-semibold"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--text)',
                          }}
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
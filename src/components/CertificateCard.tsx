import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Certificate } from '../data/seed'

export default function CertificateCard({ cert }: { cert: Certificate }) {
  const [imgError, setImgError] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // قراءة رابط الصورة مع تغطية جميع المسميات المحتملة
  const imageUrl =
    (cert as any).image ||
    cert.image_url ||
    (cert as any).imageUrl ||
    ''

  // منع التمرير (Scroll) عند فتح الـ Modal وإلغاءه عند الإغلاق
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* كارت الشهادة */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={() => imageUrl && !imgError && setIsOpen(true)}
        className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        {imageUrl && imageUrl.trim() !== '' && !imgError ? (
          <img
            src={imageUrl}
            alt={cert.title || 'Certificate'}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-4 text-center font-mono text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>No Image Available</span>
          </div>
        )}

        {/* Hover Overlay */}
        {imageUrl && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
              View Certificate
            </span>
          </div>
        )}
      </motion.div>

      {/* Portal لعرض النافذة المكبرة أعلى عناصر الصفحة بالكامل بدون أي تعليق */}
      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md"
              >
                {/* زر الإغلاق */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                  className="fixed right-6 top-6 z-[100000] flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white backdrop-blur-lg transition-transform hover:scale-110 hover:bg-white/30 active:scale-95"
                  aria-label="Close"
                >
                  ✕
                </button>

                {/* الحاوية المكبرة والصورة */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center overflow-hidden"
                >
                  <img
                    src={imageUrl}
                    alt={cert.title || 'Certificate Full View'}
                    className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
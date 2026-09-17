import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle'

const links = [
  { label: 'About', id: 'about' },
  { label: 'Education', id: 'education' },
  { label: 'Projects', id: 'projects', tab: 'projects' as const },
  { label: 'Certificates', id: 'projects', tab: 'certificates' as const },
  { label: 'Skills', id: 'projects', tab: 'skills' as const },
  { label: 'Experience', id: 'experience' },
  { label: 'Contact', id: 'contact' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState('about')
  const [activeTab, setActiveTab] = useState('projects')
  
  // علم لتثبيت الحالة وإيقاف الـ scroll-spy مؤقتاً أثناء الضغط لتفادي أي تطيير أو تعليق
  const isManualScrolling = useRef(false)
  const scrollTimeout = useRef<number | null>(null)

  // إلغاء حفظ السكرول عند الـ Refresh والطلوع لأول الصفحة فورا
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
    window.history.replaceState(null, '', '#about')
  }, [])

  // متابعة التاب النشط جوه قسم الـ Portfolio
  useEffect(() => {
    function handleTabChanged(event: Event) {
      const tab = (event as CustomEvent<string>).detail
      if (tab) setActiveTab(tab)
    }

    window.addEventListener('portfolio-tab-changed', handleTabChanged)
    return () => window.removeEventListener('portfolio-tab-changed', handleTabChanged)
  }, [])

  function handleNavClick(link: (typeof links)[number]) {
    setOpen(false)

    // ضبط الحالة يدوياً فوراً لضمان عدم حدوث أي وميض أو تنقل خاطئ
    setActiveId(link.id)
    if (link.tab) {
      setActiveTab(link.tab)
      window.dispatchEvent(new CustomEvent('portfolio-tab-select', { detail: link.tab }))
    }

    // تفعيل الـ flag لمنع الـ scroll-spy من التداخل أثناء الحركة
    isManualScrolling.current = true
    if (scrollTimeout.current) {
      window.clearTimeout(scrollTimeout.current)
    }

    const element = document.getElementById(link.id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }

    // إرجاع العمل للـ scroll-spy بعد انتهاء حركة الاسكرول بسلاسة
    scrollTimeout.current = window.setTimeout(() => {
      isManualScrolling.current = false
    }, 800)
  }

  // دالة الصعود لأعلى الصفحة عند الضغط على الشعار الترحيبي
  function handleLogoClick() {
    setOpen(false)
    setActiveId('about')
    setActiveTab('projects')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.replaceState(null, '', '#about')
  }

  // Scroll-spy + Dynamic URL Hash Update
  useEffect(() => {
    const sectionIds = links.map((link) => link.id)
    const offset = 160

    function updateActiveSection() {
      // لو المستخدم ضغط يدويًا، نتجاهل التحديث التلقائي مؤقتاً عشان مانعملش تداخل
      if (isManualScrolling.current) return

      const distanceToBottom =
        document.documentElement.scrollHeight - (window.scrollY + window.innerHeight)

      let current = sectionIds[0]

      if (distanceToBottom < 4) {
        current = sectionIds[sectionIds.length - 1]
      } else {
        for (const id of sectionIds) {
          const el = document.getElementById(id)
          if (!el) continue

          const top = el.getBoundingClientRect().top

          if (top - offset <= 0) {
            current = id
          }
        }
      }

      setActiveId(current)

      if (window.location.hash !== `#${current}`) {
        window.history.replaceState(null, '', `#${current}`)
      }
    }

    updateActiveSection()

    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  const pillSurface = {
    borderColor: 'var(--border)',
    backgroundColor: 'color-mix(in srgb, var(--surface) 75%, transparent)',
    boxShadow: 'var(--shadow)',
  }

  return (
    <header className="sticky top-0 z-40 px-4 pb-2 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        {/* LOGO / WELCOME BUTTON WITH GLOW EFFECT */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="group relative font-display shrink-0 rounded-full border px-4 py-2 text-sm font-medium tracking-wide backdrop-blur-md transition-all duration-300 sm:text-base overflow-hidden"
          style={{ ...pillSurface, color: 'var(--accent)' }}
        >
          {/* Glow Effect on Hover */}
          <span
            className="absolute inset-0 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 80%)',
              boxShadow:
                '0 0 16px color-mix(in srgb, var(--accent) 15%, transparent)',
            }}
          />
          <span className="relative z-10 transition-colors duration-200 group-hover:text-[var(--text)] italic font-semibold">
            ✦ Welcome
          </span>
        </button>

        {/* DESKTOP PILL NAV */}
        <nav
          className="hidden items-center gap-1.5 rounded-full border p-1.5 backdrop-blur-md md:flex relative"
          style={pillSurface}
        >
          {links.map((link) => {
            const isActive = link.tab
              ? activeId === link.id && activeTab === link.tab
              : activeId === link.id

            return (
              <button
                key={`${link.id}-${link.label}`}
                type="button"
                onClick={() => handleNavClick(link)}
                className="group relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 overflow-visible z-10"
                style={{
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                }}
                aria-pressed={isActive}
              >
                {/* Sliding active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeMainNav"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--surface-2) 85%, var(--accent) 15%)',
                      border: '1px solid var(--border)',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(255, 255, 255, 0.05)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Inactive hover background */}
                {!isActive && (
                  <span
                    className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none -z-10"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--surface-2) 50%, transparent)',
                      border: '1px solid var(--border)',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                )}

                <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'font-semibold' : 'group-hover:text-[var(--text)]'}`}>
                  {link.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* RIGHT SIDE: THEME TOGGLE + MOBILE BUTTON */}
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md overflow-hidden transition-all duration-300"
            style={pillSurface}
          >
            <span
              className="absolute inset-0 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at center, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 80%)',
                boxShadow:
                  '0 0 16px color-mix(in srgb, var(--accent) 15%, transparent)',
              }}
            />
            <span className="relative z-15">
              <ThemeToggle />
            </span>
          </div>

          <button
            type="button"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md md:hidden overflow-hidden transition-all duration-300"
            style={{ ...pillSurface, color: 'var(--text)' }}
            onClick={() => setOpen((value) => !value)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <span
              className="absolute inset-0 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at center, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 80%)',
                boxShadow:
                  '0 0 16px color-mix(in srgb, var(--accent) 15%, transparent)',
              }}
            />
            <span className="relative z-10 text-lg group-hover:text-[var(--accent)]">
              {open ? '×' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE MENU - EXACT MATCH TO DESKTOP STYLE */}
      {open && (
        <nav
          className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-3xl border p-2 backdrop-blur-md md:hidden relative"
          style={pillSurface}
        >
          {links.map((link) => {
            const isActive = link.tab
              ? activeId === link.id && activeTab === link.tab
              : activeId === link.id

            return (
              <button
                key={`mobile-${link.id}-${link.label}`}
                type="button"
                onClick={() => handleNavClick(link)}
                className="group relative w-full text-left rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 overflow-hidden z-10"
                style={{
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                }}
                aria-pressed={isActive}
              >
                {/* Active background pill for mobile */}
                {isActive && (
                  <motion.div
                    layoutId="activeMobileNav"
                    className="absolute inset-0 rounded-2xl -z-10"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--surface-2) 85%, var(--accent) 15%)',
                      border: '1px solid var(--border)',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(255, 255, 255, 0.05)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Inactive hover background for mobile */}
                {!isActive && (
                  <span
                    className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none -z-10"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--surface-2) 50%, transparent)',
                      border: '1px solid var(--border)',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                )}

                <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'font-semibold text-[var(--text)]' : 'group-hover:text-[var(--text)]'}`}>
                  {link.label}
                </span>
              </button>
            )
          })}
        </nav>
      )}
    </header>
  )
}
import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Nav from '../components/Nav'
import DataNetworkHero from '../components/DataNetworkHero'
import ProjectsGrid from '../components/ProjectsGrid'
import CertificateCard from '../components/CertificateCard'
import { useContent } from '../hooks/useContent'
import {
  profile as seedProfile,
  skills as seedSkills,
  projects as seedProjects,
  certificates as seedCertificates,
  experience as seedExperience,
  education as seedEducation,
  type Project,
  type Certificate,
  type Skill,
  type Experience,
  type Education,
  type Profile,
} from '../data/seed'
import {
  mapProjectRow,
  mapCertificateRow,
  mapSkillRow,
  mapExperienceRow,
  mapEducationRow,
  mapProfileRow,
} from '../data/mappers'

type PortfolioTab = 'projects' | 'certificates' | 'skills'

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.902.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconLinkedin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function IconGithub() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block overflow-visible"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <motion.g
        variants={{
          hover: {
            y: [0, 1.5, 0],
            transition: {
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut' as const,
            },
          },
        }}
      >
        <polyline points="7,10 12,15 17,10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </motion.g>
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block overflow-visible"
    >
      <motion.g
        variants={{
          hover: {
            x: [0, 1.5, 0],
            transition: {
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut' as const,
            },
          },
        }}
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12,5 19,12 12,19" />
      </motion.g>
    </svg>
  )
}

function IconCircle({
  href,
  label,
  children,
}: {
  href?: string | null
  label: string
  children: ReactNode
}) {
  if (!href) return null

  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      aria-label={label}
      title={label}
      className="group relative flex h-11 w-11 items-center justify-center rounded-full border transition-transform duration-200 hover:-translate-y-1 overflow-hidden"
      style={{ borderColor: 'var(--border)', color: 'var(--accent)', backgroundColor: 'var(--surface)' }}
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
      <span className="relative z-10 transition-colors duration-200 group-hover:text-[var(--text)]">
        {children}
      </span>
    </a>
  )
}

function CertificatesSection({
  certificates,
  fadeUp,
  staggerContainer,
}: {
  certificates: Certificate[]
  fadeUp: any
  staggerContainer: any
}) {
  const [showAll, setShowAll] = useState(false)

  const visibleCertificates = showAll ? certificates : certificates.slice(0, 8)
  const hasMore = certificates.length > 8

  return (
    <div className="w-full space-y-10">
      <motion.div
        className="flex flex-wrap justify-center gap-5"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {visibleCertificates.map((certificate) => (
            <motion.div
              key={certificate.id}
              variants={fadeUp}
              layout
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[280px] shrink-0"
            >
              <CertificateCard cert={certificate} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="secondary-button text-sm font-medium transition-transform duration-200 hover:scale-105"
          >
            {showAll
              ? 'See Less'
              : `See More (${certificates.length - 8} more)`}
          </button>
        </div>
      )}
    </div>
  )
}

function ProjectsSection({
  projects,
}: {
  projects: Project[]
}) {
  const [showAll, setShowAll] = useState(false)

  // تم التعديل لتكون 6 مشاريع كحد أقصى قبل ظهور See More
  const visibleProjects = showAll ? projects : projects.slice(0, 6)
  const hasMore = projects.length > 6

  return (
    <div className="w-full space-y-10">
      <ProjectsGrid projects={visibleProjects} />

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="secondary-button text-sm font-medium transition-transform duration-200 hover:scale-105"
          >
            {showAll
              ? 'See Less'
              : `See More (${projects.length - 6} more)`}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('projects')
  const [imgError, setImgError] = useState(false)
  const [eduImgError, setEduImgError] = useState(false)
  const [showAllExperience, setShowAllExperience] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeInOut' as const },
    },
  }

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 },
    },
  }

  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    function handleTabSelect(event: Event) {
      const tab = (event as CustomEvent<PortfolioTab>).detail
      if (tab) setActiveTab(tab)
    }

    window.addEventListener('portfolio-tab-select', handleTabSelect)
    return () => window.removeEventListener('portfolio-tab-select', handleTabSelect)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('portfolio-tab-changed', { detail: activeTab }))
  }, [activeTab])

  const { data: profile } = useContent<any, Profile>('profile', seedProfile, (rows) => {
    return rows && rows.length > 0 ? mapProfileRow(rows[0]) : seedProfile
  })

  useEffect(() => {
    if (profile?.name) {
      document.title = profile.title
        ? `${profile.name} — ${profile.title}`
        : profile.name
    }
  }, [profile?.name, profile?.title])

  const { data: skills } = useContent<any, Skill[]>(
    'skills',
    seedSkills,
    (rows) => rows.map(mapSkillRow),
    'sort_order'
  )

  const { data: projects } = useContent<any, Project[]>(
    'projects',
    seedProjects,
    (rows) => rows.map(mapProjectRow),
    'sort_order'
  )

  const { data: certificates } = useContent<any, Certificate[]>(
    'certificates',
    seedCertificates,
    (rows) => rows.map(mapCertificateRow),
    'sort_order'
  )

  const { data: experience } = useContent<any, Experience[]>(
    'experience',
    seedExperience,
    (rows) => rows.map(mapExperienceRow),
    'sort_order'
  )

  const { data: education } = useContent<any, Education[]>(
    'education',
    seedEducation,
    (rows) => rows.map(mapEducationRow),
    'sort_order'
  )

  const primaryEducation = education[0]
  const eduLogoUrl = primaryEducation?.logoUrl || ''

  const tabs: { id: PortfolioTab; label: string }[] = [
    { id: 'projects', label: 'Projects' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'skills', label: 'Skills' },
  ]

  const profileImageUrl =
    profile?.profileImage ||
    (profile as any)?.profile_image ||
    (profile as any)?.profile_image_url ||
    (profile as any)?.image_url ||
    ''

  const visibleExperience = showAllExperience ? experience : experience.slice(0, 4)
  const hasMoreExperience = experience.length > 4

  return (
    <div id="top" className="relative w-full">
      <Nav name={profile.name} />

      {/* About */}
      <section id="about" className="section-shell">
        <motion.div
          className="mx-auto grid max-w-[1400px] items-center gap-12 px-6 py-20 md:grid-cols-[1.15fr_0.85fr]"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="order-1 mx-auto flex justify-center md:order-2">
            <div className="animated-profile-frame shadow-2xl">
              <div
                className="relative h-80 w-80 overflow-hidden rounded-full sm:h-96 sm:w-96"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                {profileImageUrl && profileImageUrl.trim() !== '' && !imgError ? (
                  <img
                    src={profileImageUrl}
                    alt={profile.name || 'Profile'}
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center p-6 text-center font-mono text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span>No Profile Image Found in Admin</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} className="order-2 md:order-1">
            <motion.p variants={fadeUp} className="eyebrow">
              About Me
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl"
              style={{ color: 'var(--text)' }}
            >
              {profile.name}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-2xl leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {profile.bio}
            </motion.p>

            {profile.quote && (
              <motion.p
                variants={fadeUp}
                className="mt-5 rounded-2xl border-l-4 px-4 py-3 text-sm italic"
                style={{
                  borderColor: 'var(--accent)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-muted)',
                }}
              >
                “{profile.quote}”
              </motion.p>
            )}

            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
              {profile.cvUrl && (
                <motion.a
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  whileHover="hover"
                  className="primary-button gap-2"
                >
                  Download CV
                  <IconDownload />
                </motion.a>
              )}

              <motion.button
                type="button"
                onClick={scrollToProjects}
                whileHover="hover"
                className="secondary-button gap-2"
              >
                Explore Portfolio
                <IconArrowRight />
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-5 flex items-center justify-start gap-3 max-sm:justify-center">
              <div className="hidden sm:flex gap-3">
                <div className="w-11" />
                <div className="w-11" />
              </div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const }}
              >
                <IconCircle href={profile.github} label="GitHub">
                  <IconGithub />
                </IconCircle>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.35 }}
              >
                <IconCircle href={profile.linkedin} label="LinkedIn">
                  <IconLinkedin />
                </IconCircle>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Education */}
      <section id="education" className="section-shell relative overflow-hidden">
        <motion.div
          className="mx-auto grid max-w-[1400px] items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={fadeUp}>
            <p className="eyebrow">Education</p>

            <h1
              className="font-display mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl"
              style={{ color: 'var(--text)' }}
            >
              {primaryEducation?.degree || 'Academic background'}
            </h1>

            <p
              className="mt-5 max-w-lg text-base leading-relaxed sm:text-lg"
              style={{ color: 'var(--text-muted)' }}
            >
              {primaryEducation?.institution ||
                'Education details will appear here once added from the admin panel.'}
            </p>

            {primaryEducation && (primaryEducation.startDate || primaryEducation.endDate) && (
              <p className="mt-4 font-mono text-sm" style={{ color: 'var(--accent)' }}>
                {primaryEducation.startDate || '—'} – {primaryEducation.endDate || 'Present'}
              </p>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-0 -z-10 opacity-60">
              <DataNetworkHero />
            </div>

            <div
              className="glow-border soft-panel relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl p-8 sm:p-10"
              style={{ backgroundColor: 'var(--surface-2)' }}
            >
              {eduLogoUrl && eduLogoUrl.trim() !== '' && !eduImgError ? (
                <img
                  src={eduLogoUrl}
                  alt={primaryEducation?.institution || 'Institution logo'}
                  onError={() => setEduImgError(true)}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center p-6 text-center font-mono text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>No Education Logo Found in Admin</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Portfolio Showcase */}
      <section id="projects" className="section-shell">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <h2
              className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: 'var(--text)' }}
            >
              Portfolio Showcase
            </h2>
          </motion.div>

          <motion.div
            className="mt-10 flex justify-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <div
              className="inline-flex items-center gap-1.5 rounded-full border p-1.5 backdrop-blur-md relative"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'color-mix(in srgb, var(--surface) 75%, transparent)',
                boxShadow: 'var(--shadow)',
              }}
            >
              {tabs.map((tab) => {
                const selected = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="group relative rounded-full px-6 py-2 text-sm font-medium transition-colors duration-200 overflow-visible z-10"
                    style={{
                      color: selected ? 'var(--text)' : 'var(--text-muted)',
                    }}
                    aria-pressed={selected}
                  >
                    {/* Sliding active background pill */}
                    {selected && (
                      <motion.div
                        layoutId="activePortfolioTab"
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
                    {!selected && (
                      <span
                        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none -z-10"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--surface-2) 50%, transparent)',
                          border: '1px solid var(--border)',
                          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                    )}

                    <span className={`relative z-10 transition-colors duration-200 ${selected ? 'font-semibold' : 'group-hover:text-[var(--text)]'}`}>
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          <div className="mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeInOut' as const }}
              >
                {activeTab === 'projects' && <ProjectsSection projects={projects} />}

                {activeTab === 'certificates' && (
                  <CertificatesSection
                    certificates={certificates}
                    fadeUp={fadeUp}
                    staggerContainer={staggerContainer}
                  />
                )}

                {activeTab === 'skills' && (
                  <motion.div
                    className="flex flex-wrap items-center justify-center gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {skills.map((skill) => (
                      <motion.div
                        key={skill.id}
                        variants={fadeUp}
                        whileHover={{ y: -6, scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                        className="flex min-h-[7rem] w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center backdrop-blur-md shadow-lg"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--surface-2) 45%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)',
                        }}
                      >
                        {skill.image_url ? (
                          <img
                            src={skill.image_url}
                            alt={skill.name}
                            className="h-10 w-10 shrink-0 object-contain"
                          />
                        ) : (
                          <span
                            className="font-display text-xl font-semibold"
                            style={{ color: 'var(--accent)' }}
                          >
                            {skill.name.charAt(0).toUpperCase()}
                          </span>
                        )}

                        <p
                          className="w-full text-center text-xs font-medium leading-tight break-words whitespace-normal"
                          style={{ color: 'var(--text)' }}
                        >
                          {skill.name}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Experience */}
      {experience.length > 0 && (
        <section id="experience" className="section-shell relative overflow-hidden border-t" style={{ borderColor: 'var(--border)' }}>
          <motion.div
            className="mx-auto max-w-5xl"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.p variants={fadeUp} className="eyebrow">
              Career
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: 'var(--text)' }}
            >
              Work experience
            </motion.h2>

            <motion.p variants={fadeUp} className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              A quick look at where I've applied data analysis in practice.
            </motion.p>

            <div className="relative mt-14 overflow-hidden py-4">
              <div
                className="absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 sm:block"
                style={{ backgroundColor: 'var(--border)' }}
              />

              <div className="space-y-10 sm:space-y-14">
                {visibleExperience.map((item, index) => {
                  const isLeft = index % 2 === 0

                  return (
                    <motion.div
                      key={item.id}
                      className="relative sm:grid sm:grid-cols-2 sm:items-start sm:gap-x-10"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeInOut' as const }}
                    >
                      <div className="pointer-events-none absolute inset-0 hidden sm:block">
                        <span
                          className="absolute left-1/2 top-6 h-3 w-3 -translate-x-1/2 rounded-full border-2"
                          style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--bg)' }}
                        />
                        <span
                          className="absolute top-[1.6rem] h-px w-5"
                          style={
                            isLeft
                              ? { right: '50%', backgroundColor: 'var(--border)' }
                              : { left: '50%', backgroundColor: 'var(--border)' }
                          }
                        />
                      </div>

                      <article
                        className={`soft-panel rounded-2xl p-6 sm:p-7 ${
                          isLeft ? 'sm:col-start-1' : 'sm:col-start-2'
                        }`}
                      >
                        <h3 className="font-display text-lg font-semibold sm:text-xl" style={{ color: 'var(--text)' }}>
                          {item.position}
                        </h3>

                        <span className="mt-1 block font-mono text-xs" style={{ color: 'var(--accent)' }}>
                          {item.startDate} – {item.endDate ?? 'Present'}
                        </span>

                        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {item.organization}
                        </p>

                        {item.description.length > 0 && (
                          <ul className="mt-5 space-y-2.5">
                            {item.description.map((line, lineIndex) => (
                              <li
                                key={lineIndex}
                                className="flex gap-2.5 text-sm leading-relaxed"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <span style={{ color: 'var(--accent-2)' }}>—</span>
                                {line}
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    </motion.div>
                  )
                })}
              </div>

              {hasMoreExperience && (
                <div className="flex justify-center pt-10">
                  <button
                    type="button"
                    onClick={() => setShowAllExperience(!showAllExperience)}
                    className="secondary-button text-sm font-medium transition-transform duration-200 hover:scale-105"
                  >
                    {showAllExperience
                      ? 'See Less'
                      : `See More (${experience.length - 4} more)`}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="section-shell py-12">
        <div className="mx-auto max-w-4xl px6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, ease: 'easeInOut' as const }}
            className="soft-panel relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8"
            style={{
              borderColor: 'var(--border)',
              background: 'radial-gradient(circle at 0% 50%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%), var(--surface)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row text-center md:text-left">
              <div>
                <p className="eyebrow text-xs tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                  Contact
                </p>
                <h2
                  className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
                  style={{ color: 'var(--text)' }}
                >
                  Let&apos;s talk data.
                </h2>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="group relative inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'color-mix(in srgb, var(--surface-2) 60%, transparent)',
                      color: 'var(--text)',
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--surface-2) 50%, transparent)',
                        border: '1px solid var(--border)',
                        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                    <span className="relative z-10" style={{ color: 'var(--accent)' }}>
                      <IconMail />
                    </span>
                    <span className="relative z-10 group-hover:text-[var(--text)]">{profile.email}</span>
                  </a>
                )}

                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="group relative inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'color-mix(in srgb, var(--surface-2) 60%, transparent)',
                      color: 'var(--text)',
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--surface-2) 50%, transparent)',
                        border: '1px solid var(--border)',
                        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                    <span className="relative z-10" style={{ color: 'var(--accent)' }}>
                      <IconPhone />
                    </span>
                    <span className="relative z-10 group-hover:text-[var(--text)]">{profile.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
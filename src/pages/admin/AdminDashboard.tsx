import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FolderGit2,
  Award,
  Sparkles,
  Briefcase,
  GraduationCap,
  UserCog,
  ArrowLeft,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ThemeToggle from '../../components/ThemeToggle'
import ProjectsManager from './ProjectsManager'
import CertificatesManager from './CertificatesManager'
import SkillsManager from './SkillsManager'
import ExperienceManager from './ExperienceManager'
import EducationManager from './EducationManager'
import ProfileSettings from './ProfileSettings'
import { useContent } from '../../hooks/useContent'
import {
  certificates as seedCertificates,
  experience as seedExperience,
  education as seedEducation,
  projects as seedProjects,
  skills as seedSkills,
  type Certificate,
  type Experience,
  type Education,
  type Project,
  type Skill,
} from '../../data/seed'
import {
  mapCertificateRow,
  mapExperienceRow,
  mapEducationRow,
  mapProjectRow,
  mapSkillRow,
} from '../../data/mappers'

type Section =
  | 'Dashboard'
  | 'Projects'
  | 'Certificates'
  | 'Skills'
  | 'Experience'
  | 'Education'
  | 'Profile Settings'

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Projects', label: 'Projects', icon: FolderGit2 },
  { id: 'Certificates', label: 'Certificates', icon: Award },
  { id: 'Skills', label: 'Skills', icon: Sparkles },
  { id: 'Experience', label: 'Experience', icon: Briefcase },
  { id: 'Education', label: 'Education', icon: GraduationCap },
  { id: 'Profile Settings', label: 'Profile Settings', icon: UserCog },
]

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>('Dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

  const { data: skills } = useContent<any, Skill[]>(
    'skills',
    seedSkills,
    (rows) => rows.map(mapSkillRow),
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

  async function handleSignOut() {
    await signOut()
    navigate('/admin')
  }

  const statistics = [
    { label: 'Total Projects', value: projects.length, icon: FolderGit2 },
    { label: 'Certificates', value: certificates.length, icon: Award },
    { label: 'Skills', value: skills.length, icon: Sparkles },
    { label: 'Experience', value: experience.length, icon: Briefcase },
    { label: 'Education', value: education.length, icon: GraduationCap },
  ]

  const pillSurface = {
    borderColor: 'var(--border)',
    backgroundColor: 'color-mix(in srgb, var(--surface) 75%, transparent)',
    boxShadow: 'var(--shadow)',
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* =========================
          TOP HEADER
      ========================== */}
      <header
        className="sticky top-0 z-50 flex h-[78px] items-center justify-between border-b px-5 sm:px-7"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-opacity hover:opacity-75"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            aria-label="Back to portfolio"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <p
              className="font-display text-base font-semibold"
              style={{ color: 'var(--text)' }}
            >
              Admin Panel
            </p>

            <p
              className="hidden font-mono text-[10px] tracking-wide sm:block"
              style={{ color: 'var(--text-muted)' }}
            >
              PORTFOLIO MANAGEMENT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-opacity hover:opacity-75 sm:px-4"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* =========================
          ADMIN LAYOUT
      ========================== */}
      <div className="flex min-h-[calc(100vh-78px)] w-full">
        {/* =========================
            LEFT NAVIGATION (DESKTOP SIDEBAR) - MATCHING EXTERNAL NAV STYLE
        ========================== */}
        <aside
          className={`hidden shrink-0 border-r transition-[width] duration-500 ease-in-out lg:flex lg:flex-col ${
            isSidebarCollapsed ? 'w-[80px]' : 'w-64'
          }`}
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div className="sticky top-[78px] flex h-[calc(100vh-78px)] flex-col p-3.5 overflow-hidden">
            {/* Sidebar Header Toggle Button */}
            <div className="flex h-10 items-center justify-between px-1.5 mb-2">
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100'
                }`}
              >
                <p
                  className="font-mono text-[10px] tracking-[0.16em] whitespace-nowrap"
                  style={{ color: 'var(--text-muted)' }}
                >
                  MANAGEMENT
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-opacity hover:opacity-80"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Navigation Items - Exact External Nav Style with Preserved Borders */}
            <nav className="flex flex-col gap-1.5 relative">
              {sections.map((item) => {
                const isActive = section === item.id
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className="group relative flex h-12 w-full items-center rounded-full px-3.5 transition-colors duration-200 overflow-visible z-10 border"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: isActive ? 'color-mix(in srgb, var(--surface-2) 85%, var(--accent) 15%)' : 'transparent',
                      color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    }}
                    aria-pressed={isActive}
                  >
                    {/* Sliding active background pill using layoutId matching external Nav */}
                    {isActive && (
                      <motion.div
                        layoutId="activeAdminSidebar"
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

                    {/* Fixed Icon Container */}
                    <span 
                      className="flex h-6 w-6 shrink-0 items-center justify-center relative z-10 transition-colors duration-200" 
                      style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    {/* Label with Smooth Max-Width & Opacity Transition */}
                    <div
                      className={`ml-3 overflow-hidden transition-all duration-500 ease-in-out relative z-10 ${
                        isSidebarCollapsed
                          ? 'max-w-0 opacity-0'
                          : 'max-w-[160px] opacity-100'
                      }`}
                    >
                      <span className={`text-sm whitespace-nowrap block transition-colors duration-200 ${isActive ? 'font-semibold text-[var(--text)]' : 'font-medium group-hover:text-[var(--text)]'}`}>
                        {item.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* Portfolio Status Box */}
            <div className="mt-auto">
              <div
                className="flex h-12 w-full items-center rounded-full border px-3.5 transition-all duration-500 ease-in-out"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg)',
                }}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                </span>

                <div
                  className={`ml-3 overflow-hidden transition-all duration-500 ease-in-out ${
                    isSidebarCollapsed
                      ? 'max-w-0 opacity-0'
                      : 'max-w-[150px] opacity-100'
                  }`}
                >
                  <p
                    className="text-xs font-medium whitespace-nowrap"
                    style={{ color: 'var(--text)' }}
                  >
                    Ready to update
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* =========================
            MOBILE NAVIGATION (MATCHING EXTERNAL NAV STYLE)
        ========================== */}
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t lg:hidden p-2 backdrop-blur-md"
          style={pillSurface}
        >
          <nav className="flex gap-1.5 overflow-x-auto relative">
            {sections.map((item) => {
              const isActive = section === item.id
              const Icon = item.icon

              return (
                <button
                  key={`mobile-${item.id}`}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className="group relative flex min-w-[95px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5 text-center text-[11px] font-medium transition-colors duration-200 overflow-visible z-10 border"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: isActive ? 'color-mix(in srgb, var(--surface-2) 85%, var(--accent) 15%)' : 'transparent',
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  }}
                  aria-pressed={isActive}
                >
                  {/* Active background pill for mobile */}
                  {isActive && (
                    <motion.div
                      layoutId="activeAdminMobileNav"
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

                  <Icon className="h-4 w-4 relative z-10 transition-colors duration-200" style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }} />
                  <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'font-semibold text-[var(--text)]' : 'group-hover:text-[var(--text)]'}`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* =========================
            MAIN CONTENT AREA
        ========================== */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1450px] px-5 py-7 pb-24 sm:px-7 lg:px-10 lg:py-9 lg:pb-10">
            {/* =========================
                DASHBOARD
            ========================== */}
            {section === 'Dashboard' && (
              <section>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">Overview</p>

                    <h1
                      className="font-display mt-2 text-3xl font-semibold tracking-tight"
                      style={{ color: 'var(--text)' }}
                    >
                      Dashboard
                    </h1>

                    <p
                      className="mt-2 text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Manage the content that appears on your portfolio.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSection('Projects')}
                    className="primary-button"
                  >
                    Manage Projects
                  </button>
                </div>

                {/* Statistics */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {statistics.map((item) => {
                    const Icon = item.icon
                    return (
                      <article
                        key={item.label}
                        className="soft-panel rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: 'var(--surface-2)',
                              color: 'var(--accent)',
                            }}
                          >
                            <Icon className="h-5 w-5" />
                          </span>

                          <span
                            className="font-mono text-[10px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            LIVE
                          </span>
                        </div>

                        <p
                          className="font-display mt-6 text-3xl font-semibold"
                          style={{ color: 'var(--text)' }}
                        >
                          {item.value}
                        </p>

                        <p
                          className="mt-1 text-sm"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {item.label}
                        </p>
                      </article>
                    )
                  })}
                </div>

                {/* Recent Content + Quick Actions */}
                <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <section className="soft-panel rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="eyebrow">Recent Content</p>

                        <h2
                          className="font-display mt-2 text-xl font-semibold"
                          style={{ color: 'var(--text)' }}
                        >
                          Latest projects
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSection('Projects')}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        View all →
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {projects.slice(0, 3).map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between gap-4 rounded-xl border p-4"
                          style={{
                            borderColor: 'var(--border)',
                            backgroundColor: 'var(--bg)',
                          }}
                        >
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-medium"
                              style={{ color: 'var(--text)' }}
                            >
                              {project.title}
                            </p>

                            <p
                              className="mt-1 text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {project.category} · {project.date}
                            </p>
                          </div>

                          <span
                            className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[9px]"
                            style={{
                              backgroundColor: 'var(--surface-2)',
                              color: 'var(--accent)',
                            }}
                          >
                            {project.featured ? 'FEATURED' : 'PROJECT'}
                          </span>
                        </div>
                      ))}

                      {projects.length === 0 && (
                        <p
                          className="py-6 text-center text-sm"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          No projects yet.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="soft-panel rounded-2xl p-6">
                    <p className="eyebrow">Quick Actions</p>

                    <h2
                      className="font-display mt-2 text-xl font-semibold"
                      style={{ color: 'var(--text)' }}
                    >
                      Update portfolio
                    </h2>

                    <div className="mt-5 space-y-3">
                      {[
                        {
                          label: 'Add a new project',
                          section: 'Projects' as Section,
                        },
                        {
                          label: 'Manage certificates',
                          section: 'Certificates' as Section,
                        },
                        {
                          label: 'Update technical skills',
                          section: 'Skills' as Section,
                        },
                      ].map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => setSection(action.section)}
                          className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-opacity hover:opacity-80"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--text)',
                          }}
                        >
                          {action.label}

                          <ChevronRight
                            className="h-4 w-4"
                            style={{ color: 'var(--accent)' }}
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </section>
            )}

            {/* =========================
                PROJECTS
            ========================== */}
            {section === 'Projects' && <ProjectsManager />}

            {/* =========================
                CERTIFICATES
            ========================== */}
            {section === 'Certificates' && <CertificatesManager />}

            {/* =========================
                SKILLS
            ========================== */}
            {section === 'Skills' && <SkillsManager />}

            {/* =========================
                EXPERIENCE
            ========================== */}
            {section === 'Experience' && <ExperienceManager />}

            {/* =========================
                EDUCATION
            ========================== */}
            {section === 'Education' && <EducationManager />}

            {/* =========================
                PROFILE SETTINGS
            ========================== */}
            {section === 'Profile Settings' && <ProfileSettings />}

            {/* =========================
                FALLBACK
            ========================== */}
            {section !== 'Dashboard' &&
              section !== 'Projects' &&
              section !== 'Certificates' &&
              section !== 'Skills' &&
              section !== 'Experience' &&
              section !== 'Education' &&
              section !== 'Profile Settings' && (
                <section className="soft-panel rounded-2xl p-8 text-center sm:p-12">
                  <p className="eyebrow">{section}</p>

                  <h1
                    className="font-display mt-3 text-2xl font-semibold"
                    style={{ color: 'var(--text)' }}
                  >
                    {section} manager
                  </h1>

                  <p
                    className="mx-auto mt-3 max-w-md text-sm leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    This section is prepared in the dashboard. We will add
                    its editing form in the next step, following the same
                    clean layout as the Projects manager.
                  </p>
                </section>
              )}
          </div>
        </main>
      </div>
    </div>
  )
}
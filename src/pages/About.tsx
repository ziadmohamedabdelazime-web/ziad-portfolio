import Nav from '../components/Nav'
import TerminalWidget from '../components/TerminalWidget'
import { useContent } from '../hooks/useContent'
import {
  profile as seedProfile,
  skills as seedSkills,
  projects as seedProjects,
  certificates as seedCertificates,
  experience as seedExperience,
  education as seedEducation,
  type Skill,
  type Project,
  type Certificate,
  type Experience,
  type Education,
  type Profile,
} from '../data/seed'
import {
  mapProfileRow,
  mapSkillRow,
  mapProjectRow,
  mapCertificateRow,
  mapExperienceRow,
  mapEducationRow,
} from '../data/mappers'

export default function About() {
  const { data: profile } = useContent<any, Profile>('profile', seedProfile, (rows) =>
    rows[0] ? mapProfileRow(rows[0]) : seedProfile
  )
  const { data: skills } = useContent<any, Skill[]>('skills', seedSkills, (rows) => rows.map(mapSkillRow), 'sort_order')
  const { data: projects } = useContent<any, Project[]>('projects', seedProjects, (rows) => rows.map(mapProjectRow), 'sort_order')
  const { data: certificates } = useContent<any, Certificate[]>('certificates', seedCertificates, (rows) => rows.map(mapCertificateRow), 'sort_order')
  const { data: experience } = useContent<any, Experience[]>('experience', seedExperience, (rows) => rows.map(mapExperienceRow), 'sort_order')
  const { data: education } = useContent<any, Education[]>('education', seedEducation, (rows) => rows.map(mapEducationRow), 'sort_order')

  const skillCategories = Array.from(new Set(skills.map((s) => s.category)))

  return (
    <div>
      <Nav name={profile.name} />

      {/* Full Stack / role intro */}
      <section className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 md:grid-cols-2">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
              {profile.title}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {profile.bio}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.slice(0, 6).map((s) => (
                <span key={s.id} className="rounded-full border px-3 py-1 font-mono text-xs" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                  {s.name}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {profile.cvUrl && (
                <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="glow-border rounded-full px-5 py-2.5 text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)' }}>
                  Download CV
                </a>
              )}
              <a href="/portfolio" className="rounded-full border px-5 py-2.5 text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                View Projects
              </a>
            </div>
            <div className="mt-6 flex gap-3">
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  in
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  gh
                </a>
              )}
            </div>
          </div>

          <TerminalWidget />
        </div>
      </section>

      {/* Bio + quote + stats */}
      <section className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="max-w-3xl">
            {profile.quote && (
              <blockquote className="rounded-2xl border-l-4 p-4 text-sm italic" style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                "{profile.quote}"
              </blockquote>
            )}
            <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>{profile.bio}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="font-display text-3xl font-semibold" style={{ color: 'var(--accent)' }}>{projects.length}</p>
              <p className="mt-1 font-mono text-xs tracking-wide" style={{ color: 'var(--text-muted)' }}>TOTAL PROJECTS</p>
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="font-display text-3xl font-semibold" style={{ color: 'var(--accent)' }}>{certificates.length}</p>
              <p className="mt-1 font-mono text-xs tracking-wide" style={{ color: 'var(--text-muted)' }}>CERTIFICATES</p>
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="font-display text-3xl font-semibold" style={{ color: 'var(--accent)' }}>{skills.length}</p>
              <p className="mt-1 font-mono text-xs tracking-wide" style={{ color: 'var(--text-muted)' }}>SKILLS</p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills detail */}
      <section className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text)' }}>Tools & methods</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {skillCategories.map((cat) => (
              <div key={cat}>
                <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--text)' }}>{cat}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.filter((s) => s.category === cat).map((s) => (
                    <span key={s.id} className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text)' }}>Education</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {education.map((ed) => (
              <div key={ed.id} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <p className="font-display text-sm font-semibold" style={{ color: 'var(--text)' }}>{ed.degree}</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{ed.institution}</p>
                {(ed.startDate || ed.endDate) && (
                  <p className="font-mono mt-2 text-xs" style={{ color: 'var(--accent)' }}>
                    {ed.startDate || '—'} – {ed.endDate ?? 'Present'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text)' }}>Experience</h2>
          <div className="mt-6 space-y-6">
            {experience.map((e) => (
              <div key={e.id} className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-semibold" style={{ color: 'var(--text)' }}>{e.position}</h3>
                  <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                    {e.startDate} – {e.endDate ?? 'Present'}
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{e.organization}</p>
                <ul className="mt-4 space-y-2">
                  {e.description.map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--accent-2)' }}>—</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
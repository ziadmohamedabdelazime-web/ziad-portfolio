import Nav from '../components/Nav'
import SectionHeading from '../components/SectionHeading'
import ProjectCard from '../components/ProjectCard'
import CertificateCard from '../components/CertificateCard'
import { useContent } from '../hooks/useContent'
import { profile as seedProfile, projects as seedProjects, certificates as seedCertificates, type Project, type Certificate, type Profile } from '../data/seed'
import { mapProfileRow, mapProjectRow, mapCertificateRow } from '../data/mappers'

// Temporary version — full tabbed Projects/Certificates/Tech Stack showcase
// (matching the reference) lands in Phase 2.
export default function Portfolio() {
  const { data: profile } = useContent<any, Profile>('profile', seedProfile, (rows) => rows[0] ? mapProfileRow(rows[0]) : seedProfile)
  const { data: projects } = useContent<any, Project[]>('projects', seedProjects, (rows) => rows.map(mapProjectRow), 'sort_order')
  const { data: certificates } = useContent<any, Certificate[]>('certificates', seedCertificates, (rows) => rows.map(mapCertificateRow), 'sort_order')

  return (
    <div>
      <Nav name={profile.name} />
      <section className="mx-auto max-w-6xl px-5 py-16">
        <SectionHeading kicker="Work" title="Portfolio Showcase" description="Tabbed Projects / Certificates / Tech Stack view is coming in the next phase." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
        <h2 className="font-display mt-14 text-2xl font-semibold" style={{ color: 'var(--text)' }}>Certifications</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {certificates.map((c) => <CertificateCard key={c.id} cert={c} />)}
        </div>
      </section>
    </div>
  )
}
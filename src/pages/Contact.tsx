import Nav from '../components/Nav'
import SectionHeading from '../components/SectionHeading'
import { useContent } from '../hooks/useContent'
import { profile as seedProfile, type Profile } from '../data/seed'
import { mapProfileRow } from '../data/mappers'

// Temporary version — full contact form UI matching the reference lands in
// Phase 3.
export default function Contact() {
  const { data: profile } = useContent<any, Profile>('profile', seedProfile, (rows) => rows[0] ? mapProfileRow(rows[0]) : seedProfile)

  return (
    <div>
      <Nav name={profile.name} />
      <section className="mx-auto max-w-6xl px-5 py-16">
        <SectionHeading kicker="Contact" title="Let's talk data" />
        <div className="flex flex-wrap gap-4">
          <a href={`mailto:${profile.email}`} className="glow-border rounded-full px-5 py-2.5 text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)' }}>
            {profile.email}
          </a>
          {profile.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="rounded-full border px-5 py-2.5 text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              LinkedIn
            </a>
          )}
        </div>
      </section>
    </div>
  )
}
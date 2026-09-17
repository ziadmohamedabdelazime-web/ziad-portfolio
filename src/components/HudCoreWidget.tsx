interface Props {
  projectsCount: number
  skillsCount: number
}

// Circular "CORE UI" status widget for the Hero, matching the cyber-HUD
// reference: ring, center label, ONLINE badge, two stat boxes below.
export default function HudCoreWidget({ projectsCount, skillsCount }: Props) {
  return (
    <div
      className="glow-border relative w-full max-w-sm rounded-2xl p-5"
      style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>CORE UI</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest" style={{ color: 'var(--accent)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          ONLINE
        </span>
      </div>

      <div className="relative mx-auto my-6 flex h-40 w-40 items-center justify-center">
        <svg viewBox="0 0 160 160" className="absolute h-full w-full animate-[spin_18s_linear_infinite]" style={{ opacity: 0.5 }}>
          <circle cx="80" cy="80" r="70" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 10" />
        </svg>
        <svg viewBox="0 0 160 160" className="absolute h-full w-full">
          <circle cx="80" cy="80" r="56" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        </svg>
        <div
          className="glow-border flex h-20 w-20 items-center justify-center rounded-full font-mono text-[10px] tracking-widest"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}
        >
          READY
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          <p className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>PROJECTS</p>
          <p className="font-display mt-1 text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {String(projectsCount).padStart(2, '0')} <span className="font-mono text-xs font-normal" style={{ color: 'var(--text-muted)' }}>Loaded</span>
          </p>
        </div>
        <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          <p className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>SKILLS</p>
          <p className="font-display mt-1 text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {String(skillsCount).padStart(2, '0')} <span className="font-mono text-xs font-normal" style={{ color: 'var(--text-muted)' }}>Tracked</span>
          </p>
        </div>
      </div>
    </div>
  )
}
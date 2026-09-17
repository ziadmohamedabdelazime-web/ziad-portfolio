// Decorative "system terminal" HUD panel for the About page, matching the
// reference's right-column widget. Purely stylistic chrome (not a claim
// about real infrastructure) — mirrors the cyber-HUD aesthetic.
export default function TerminalWidget() {
  const chips = ['CLI Shell', 'Cloud Sync', 'Secure']

  return (
    <div
      className="glow-border rounded-2xl p-5"
      style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)' }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest" style={{ color: 'var(--accent)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          SYSTEM ONLINE
        </span>
        <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>IT CORE</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <span key={c} className="rounded-full border px-2.5 py-1 font-mono text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            {c}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent-2)' }} />
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent-2)' }} />
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent-2)' }} />
        </div>
        <div className="mt-3 space-y-1.5 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <p>&gt; analyzing dataset...</p>
          <p>&gt; building dashboard...</p>
          <p style={{ color: 'var(--accent)' }}>&gt; build ok</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
        <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>Server Node</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: 'var(--accent)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          Healthy
        </span>
      </div>
    </div>
  )
}
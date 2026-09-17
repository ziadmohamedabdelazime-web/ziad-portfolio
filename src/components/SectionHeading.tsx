export default function SectionHeading({ kicker, title, description }: { kicker: string; title: string; description?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="font-mono text-sm" style={{ color: 'var(--accent)' }}>{kicker}</p>
      <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
    </div>
  )
}

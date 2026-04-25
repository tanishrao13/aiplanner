export default function ProgressCard({ icon, label, value, subtext, color = 'var(--accent-light)' }) {
  return (
    <div className="card" style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1.25rem 1.5rem',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
        background: `${color}15`,
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
          {label}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

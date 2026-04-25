export default function ProblemCard({ topic, score, difficulty, correct, timeTaken, createdAt }) {
  const date = new Date(createdAt);
  const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.85rem 1rem',
      background: 'var(--bg-secondary)',
      borderRadius: '10px',
      border: '1px solid var(--border)',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.2rem' }}>{correct ? '✅' : '❌'}</span>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {topic}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {timeStr} · {timeTaken}s
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className={`badge ${correct ? 'badge-success' : 'badge-danger'}`}>
          {correct ? 'Correct' : 'Wrong'}
        </span>
        <span className="badge badge-accent">Lvl {difficulty}</span>
      </div>
    </div>
  );
}

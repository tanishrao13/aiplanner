const MASTERY_COLORS = [
  { min: 0, max: 0, bg: '#1e1e2e', text: '#5a5a78', label: 'Not Started' },
  { min: 1, max: 25, bg: '#1a1a3e', text: '#6c5ce7', label: 'Beginner' },
  { min: 26, max: 50, bg: '#1a2a4e', text: '#74b9ff', label: 'Learning' },
  { min: 51, max: 75, bg: '#1a3a3e', text: '#00cec9', label: 'Intermediate' },
  { min: 76, max: 100, bg: '#1a3e2e', text: '#55efc4', label: 'Mastered' },
];

const getColor = (score) => {
  return MASTERY_COLORS.find(c => score >= c.min && score <= c.max) || MASTERY_COLORS[0];
};

export default function TopicHeatmap({ heatmapData = {} }) {
  const topics = Object.entries(heatmapData);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{
        fontSize: '1rem', fontWeight: 700, marginBottom: '1rem',
        color: 'var(--text-primary)'
      }}>
        🗺️ Topic Mastery Map
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.75rem'
      }}>
        {topics.map(([topic, score]) => {
          const color = getColor(score);
          return (
            <div key={topic} style={{
              background: color.bg,
              border: `1px solid ${color.text}22`,
              borderRadius: '12px',
              padding: '0.85rem',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = color.text; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = `${color.text}22`; }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: color.text }}>
                {score}
              </div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 600, marginTop: '0.2rem',
                color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {topic}
              </div>
              <div style={{
                fontSize: '0.6rem', fontWeight: 500, marginTop: '0.15rem',
                color: color.text, opacity: 0.8
              }}>
                {color.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

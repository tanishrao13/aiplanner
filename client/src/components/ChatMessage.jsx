export default function ChatMessage({ role, content, confidence, citations }) {
  const isUser = role === 'user';

  const getConfidenceBadge = () => {
    if (confidence === undefined || confidence === null) return null;
    const conf = parseFloat(confidence);
    let color = 'var(--danger)';
    let bg = 'var(--danger-glow)';
    let label = 'Low';
    if (conf >= 0.85) { color = 'var(--success)'; bg = 'var(--success-glow)'; label = 'High'; }
    else if (conf >= 0.6) { color = 'var(--warning)'; bg = 'rgba(253,203,110,0.15)'; label = 'Medium'; }

    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem',
        fontWeight: 600, color, background: bg
      }}>
        ● {label} ({(conf * 100).toFixed(0)}%)
      </span>
    );
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
      animation: 'fadeSlideIn 0.3s ease-out'
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '1rem 1.25rem',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--accent)' : 'var(--bg-card)',
        border: isUser ? 'none' : '1px solid var(--border)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {content}

        {!isUser && (confidence !== undefined || (citations && citations.length > 0)) && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
            marginTop: '0.75rem', paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)'
          }}>
            {getConfidenceBadge()}
            {citations && citations.map((src, i) => (
              <span key={i} style={{
                padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem',
                fontWeight: 500, background: 'rgba(108,92,231,0.1)', color: 'var(--accent-light)',
                cursor: 'pointer'
              }}>📄 {src}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';

export default function StreamingText({ response }) {
  // response is the accumulated text so far
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [response]);

  if (!response) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Thinking...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{
      whiteSpace: 'pre-wrap',
      lineHeight: 1.7,
      fontSize: '0.9rem',
      color: 'var(--text-primary)'
    }}>
      {response}
      <span style={{
        display: 'inline-block',
        width: '2px',
        height: '1em',
        background: 'var(--accent)',
        marginLeft: '2px',
        animation: 'pulse-glow 1s ease-in-out infinite'
      }} />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateQuiz, gradeQuiz } from '../api/quizApi';

const DSA_TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
  'Stack', 'Queue', 'Linked Lists', 'Trees', 'Graphs',
  'Heaps', 'Dynamic Programming', 'Backtracking', 'Greedy'
];

export default function Quiz() {
  const { user } = useAuth();
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState(1);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setSelected(null);
    setResult(null);
    setShowHint(false);
    setTimer(0);

    try {
      const data = await generateQuiz(topic, difficulty);
      setQuestion(data);
      startTimeRef.current = Date.now();

      // Start timer
      if (timerRef.current) clearInterval(timerRef.current);
      const expected = data.expectedTime || 60;
      setTimer(expected);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selected === null || !question) return;
    setGrading(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const data = await gradeQuiz(question.conceptId, question.questionId, selected, timeTaken);
      setResult(data);
      if (data.newDifficulty) setDifficulty(data.newDifficulty);
    } catch (err) {
      console.error(err);
    } finally {
      setGrading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="page-enter" style={{ marginTop: '64px', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.3rem' }}>🧠 Quiz Arena</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Test your DSA knowledge with adaptive difficulty
        </p>

        {/* Topic / Difficulty Selector */}
        {!question && !loading && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Configure Quiz</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Topic</label>
                <select className="input-field" value={topic} onChange={e => setTopic(e.target.value)}>
                  {DSA_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Difficulty: {difficulty}/5
                </label>
                <input type="range" min={1} max={5} value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>
            </div>

            <button className="btn-primary" onClick={fetchQuestion} style={{ width: '100%', padding: '0.85rem' }}>
              Generate Question
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Generating question...</p>
          </div>
        )}

        {/* Question */}
        {question && !loading && (
          <div>
            {/* Timer Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '1rem', padding: '0.75rem 1rem',
              background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-accent">{question.topic}</span>
                <span className="badge badge-warning">Lvl {question.difficulty}</span>
              </div>
              <div style={{
                fontSize: '1.25rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                color: timer <= 10 ? 'var(--danger)' : timer <= 30 ? 'var(--warning)' : 'var(--text-primary)'
              }}>
                ⏱ {formatTime(timer)}
              </div>
            </div>

            {/* Question Card */}
            <div className="card" style={{ padding: '2rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.7, marginBottom: '1.5rem' }}>
                {question.question}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {question.options.map((opt, i) => {
                  let bg = 'var(--bg-secondary)';
                  let border = 'var(--border)';
                  let color = 'var(--text-primary)';

                  if (result) {
                    if (i === result.correct ? selected : null) {
                      // user's wrong answer
                    }
                    // Always show correct answer in green after result
                    // We don't have correctIndex from result, but we know if result.correct
                  }

                  if (selected === i && !result) {
                    bg = 'rgba(108, 92, 231, 0.15)';
                    border = 'var(--accent)';
                  }

                  if (result) {
                    // after grading, highlight based on correctness
                    if (result.correct && selected === i) {
                      bg = 'rgba(0, 206, 201, 0.15)'; border = 'var(--success)'; color = 'var(--success)';
                    } else if (!result.correct && selected === i) {
                      bg = 'rgba(255, 107, 107, 0.15)'; border = 'var(--danger)'; color = 'var(--danger)';
                    }
                  }

                  return (
                    <button key={i}
                      disabled={!!result}
                      onClick={() => setSelected(i)}
                      style={{
                        width: '100%', padding: '0.85rem 1rem', textAlign: 'left',
                        background: bg, border: `1px solid ${border}`, borderRadius: '10px',
                        color, fontSize: '0.9rem', cursor: result ? 'default' : 'pointer',
                        transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Hint */}
              {question.hint && !result && (
                <div style={{ marginTop: '1rem' }}>
                  {!showHint ? (
                    <button onClick={() => setShowHint(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                      💡 Show Hint
                    </button>
                  ) : (
                    <div style={{
                      padding: '0.75rem 1rem', borderRadius: '8px',
                      background: 'rgba(108,92,231,0.08)', border: '1px solid rgba(108,92,231,0.2)',
                      fontSize: '0.85rem', color: 'var(--accent-light)'
                    }}>
                      💡 {question.hint}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {!result ? (
              <button className="btn-primary" onClick={handleSubmit}
                disabled={selected === null || grading}
                style={{ width: '100%', padding: '0.85rem' }}>
                {grading ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Submit Answer'}
              </button>
            ) : (
              <div>
                {/* Result Card */}
                <div className="card" style={{
                  padding: '1.5rem', marginBottom: '1rem',
                  borderColor: result.correct ? 'var(--success)' : 'var(--danger)'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
                    fontSize: '1.1rem', fontWeight: 700,
                    color: result.correct ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {result.correct ? '✅ Correct!' : '❌ Incorrect'}
                  </div>

                  <div style={{
                    fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {result.explanation}
                  </div>

                  <div style={{
                    display: 'flex', gap: '0.75rem', marginTop: '1rem',
                    paddingTop: '1rem', borderTop: '1px solid var(--border)'
                  }}>
                    <span className="badge badge-accent">Score: {(result.score * 100).toFixed(0)}%</span>
                    <span className="badge badge-warning">New Difficulty: {result.newDifficulty}</span>
                    {result.nextRecommendedTopic && (
                      <span className="badge badge-success">Next: {result.nextRecommendedTopic}</span>
                    )}
                  </div>
                </div>

                <button className="btn-primary" onClick={() => {
                  if (result.nextRecommendedTopic) setTopic(result.nextRecommendedTopic);
                  fetchQuestion();
                }}
                  style={{ width: '100%', padding: '0.85rem' }}>
                  Next Question →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

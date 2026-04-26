import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateCodingProblem, submitCodingProblem } from '../api/codingApi';
import CodeEditor from '../components/CodeEditor';

const DSA_TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
  'Stack', 'Queue', 'Linked Lists', 'Trees', 'Graphs',
  'Heaps', 'Dynamic Programming', 'Backtracking', 'Greedy'
];

export default function Coding() {
  const { user } = useAuth();
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState(1);
  const [problem, setProblem] = useState(null);
  
  const [language, setLanguage] = useState('javascript');
  const [codeJS, setCodeJS] = useState('');
  const [codePY, setCodePY] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const [hintIndex, setHintIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [showOptimal, setShowOptimal] = useState(false);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchProblem = async () => {
    setLoading(true);
    setProblem(null);
    setResult(null);
    setShowOptimal(false);
    setHintIndex(0);
    setTimer(0);

    try {
      const data = await generateCodingProblem(topic, difficulty);
      setProblem(data);
      setCodeJS(data.starterCode.javascript || '');
      setCodePY(data.starterCode.python || '');
      
      startTimeRef.current = Date.now();
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || error.message || 'Failed to generate coding problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleEditorChange = (value) => {
    if (language === 'javascript') setCodeJS(value);
    else setCodePY(value);
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setEvaluating(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const codeToSubmit = language === 'javascript' ? codeJS : codePY;

    try {
      const data = await submitCodingProblem(problem._id, codeToSubmit, language, timeTaken);
      setResult(data);
      if (data.newDifficulty) setDifficulty(data.newDifficulty);
    } catch (error) {
      console.error(error);
    } finally {
      setEvaluating(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const currentCode = language === 'javascript' ? codeJS : codePY;

  return (
    <div className="page-enter" style={{
      marginTop: '64px',
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {!problem && !loading ? (
        <div style={{ maxWidth: '800px', margin: '2rem auto', width: '100%' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.3rem' }}>💻 Coding Arena</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Practice DSA problems with AI evaluation
          </p>

          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Configure Problem</h3>

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

            <button className="btn-primary" onClick={fetchProblem} style={{ width: '100%', padding: '0.85rem' }}>
              Generate Problem
            </button>
          </div>
        </div>
      ) : loading ? (
        <div style={{ maxWidth: '800px', margin: '4rem auto', width: '100%', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flex: 1,
          padding: '1rem',
          gap: '1rem',
          overflow: 'hidden',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row'
        }}>
          {/* Left Panel */}
          <div className="card" style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-accent">{problem.topic}</span>
                <span className="badge badge-warning">Lvl {problem.difficulty}</span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>{problem.title}</h2>
            
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
              {problem.description}
            </p>

            {problem.examples?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Examples</h4>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} style={{ 
                    background: 'var(--bg-secondary)', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}>
                    <strong>Input:</strong> {ex.input}<br/>
                    <strong>Output:</strong> {ex.output}<br/>
                    {ex.explanation && <span><strong>Explanation:</strong> {ex.explanation}</span>}
                  </div>
                ))}
              </div>
            )}

            {problem.constraints?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Constraints</h4>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {problem.hints?.length > 0 && (
              <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Hints Revealed: {hintIndex}/{problem.hints.length}
                  </span>
                  <button 
                    onClick={() => setHintIndex(prev => Math.min(prev + 1, problem.hints.length))}
                    disabled={hintIndex >= problem.hints.length || result}
                    style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    💡 Get Hint (-5%)
                  </button>
                </div>
                {hintIndex > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {problem.hints.slice(0, hintIndex).map((hint, i) => (
                      <div key={i} style={{ padding: '0.5rem', background: 'rgba(0, 206, 201, 0.1)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--success)' }}>
                        Hint {i+1}: {hint}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Editor Header */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem' }}>
              <select 
                value={language} 
                onChange={handleLanguageChange}
                style={{ 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1rem', fontWeight: 600 }}>⏱ {formatTime(timer)}</span>
                <button 
                  className="btn-primary" 
                  onClick={handleSubmit} 
                  disabled={evaluating || result}
                  style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
                >
                  {evaluating ? 'Evaluating...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div style={{ flex: 1, position: 'relative' }}>
              <CodeEditor 
                language={language}
                value={currentCode}
                onChange={handleEditorChange}
              />
              {evaluating && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(10, 10, 15, 0.7)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10, borderRadius: '12px'
                }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>AI is evaluating your code...</p>
                </div>
              )}
            </div>

            {/* Results Panel */}
            {result && (
              <div className="card" style={{ 
                padding: '1.5rem',
                borderTop: `4px solid ${result.passed ? 'var(--success)' : 'var(--danger)'}`,
                animation: 'slideUp 0.3s ease-out',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: result.passed ? 'var(--success)' : 'var(--danger)' }}>
                    {result.passed ? '✅ Accepted!' : '❌ Did not pass all tests'}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-accent">Score: {Math.round(result.score * 100)}%</span>
                    <span className="badge badge-warning">New Lvl: {result.newDifficulty}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {result.testResults?.map((tr, i) => (
                    <span key={i} className={`badge ${tr.passed ? 'badge-success' : 'badge-danger'}`}>
                      Test {i + 1}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                  {result.feedback}
                </div>

                {result.optimalSolution && (
                  <div style={{ marginBottom: '1rem' }}>
                    <button 
                      onClick={() => setShowOptimal(!showOptimal)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      {showOptimal ? 'Hide Optimal Solution' : 'See Optimal Solution'}
                    </button>
                    {showOptimal && (
                      <pre style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.85rem', overflowX: 'auto', border: '1px solid var(--border)' }}>
                        <code>{result.optimalSolution}</code>
                      </pre>
                    )}
                  </div>
                )}

                <button className="btn-primary" onClick={fetchProblem} style={{ width: '100%', padding: '0.75rem' }}>
                  Next Problem →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

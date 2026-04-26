import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProgress } from '../api/progressApi';
import TopicHeatmap from '../components/TopicHeatmap';
import ProgressCard from '../components/ProgressCard';
import ProblemCard from '../components/ProblemCard';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, quiz, coding

  useEffect(() => {
    if (user?.userId) {
      setLoading(true);
      getProgress(user.userId, filterType)
        .then(data => setProgress(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, filterType]);

  if (loading) {
    return (
      <div className="page-enter" style={{ marginTop: '64px', padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />)}
          </div>
          <div className="skeleton" style={{ height: '250px', borderRadius: '16px', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  const p = progress || {};
  const topicsMastered = p.topicBreakdown?.filter(t => t.accuracy >= 0.8 && t.attempts >= 5).length || 0;

  return (
    <div className="page-enter" style={{ marginTop: '64px', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Welcome back, <span className="gradient-text">{user?.name}</span> 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Here's your DSA progress overview
            </p>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
            {['all', 'quiz', 'coding'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: filterType === t ? 'var(--bg-card)' : 'transparent',
                  color: filterType === t ? 'var(--accent-light)' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: filterType === t ? 700 : 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  boxShadow: filterType === t ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem', marginBottom: '1.5rem'
        }}>
          <ProgressCard
            icon="🎯"
            label="Overall Accuracy"
            value={`${Math.round((p.overallAccuracy || 0) * 100)}%`}
            color="var(--accent-light)"
          />
          <ProgressCard
            icon="🔥"
            label="Current Streak"
            value={p.currentStreak || 0}
            color="var(--warning)"
          />
          <ProgressCard
            icon="🏆"
            label="Topics Mastered"
            value={topicsMastered}
            subtext="of 14 topics"
            color="var(--success)"
          />
          <ProgressCard
            icon="📝"
            label="Total Attempts"
            value={p.totalAttempts || 0}
            color="#fd79a8"
          />
        </div>

        {/* Heatmap + Weak Topics */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <TopicHeatmap heatmapData={p.heatmapData || {}} />

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              ⚠️ Weak Topics
            </h3>
            {(!p.weakTopics || p.weakTopics.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                No weak topics identified yet. Complete more quizzes to get personalized insights!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {p.weakTopics.map(topic => (
                  <div key={topic} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem', borderRadius: '8px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{topic}</span>
                    <button className="btn-primary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}
                      onClick={() => navigate('/quiz')}>
                      Practice
                    </button>
                  </div>
                ))}
              </div>
            )}

            {p.estimatedMasteryDate && (
              <div style={{
                marginTop: '1.5rem', padding: '0.8rem',
                borderRadius: '10px', background: 'rgba(0,206,201,0.08)',
                border: '1px solid rgba(0,206,201,0.2)'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--success)', marginBottom: '0.2rem' }}>
                  📅 Estimated Mastery
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {new Date(p.estimatedMasteryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            📋 Recent Activity
          </h3>
          {(!p.recentActivity || p.recentActivity.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recent activity. Start a quiz to begin tracking!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {p.recentActivity.slice(0, 5).map((a, i) => (
                <ProblemCard
                  key={i}
                  topic={a.topic}
                  score={a.accuracy}
                  difficulty={a.difficulty}
                  correct={a.correct}
                  timeTaken={a.timeTaken}
                  createdAt={a.createdAt}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

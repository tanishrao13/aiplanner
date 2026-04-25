import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPlan, getTodayTasks, generatePlan, completeTask } from '../api/progressApi';

const TASK_TYPE_COLORS = {
  learn: { bg: 'rgba(108,92,231,0.15)', text: 'var(--accent-light)', icon: '📖' },
  practice: { bg: 'rgba(0,206,201,0.15)', text: 'var(--success)', icon: '💪' },
  revise: { bg: 'rgba(253,203,110,0.15)', text: 'var(--warning)', icon: '🔄' },
  mock: { bg: 'rgba(253,121,168,0.15)', text: '#fd79a8', icon: '🏆' }
};

export default function Plan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ daysAvailable: 30, currentLevel: 'beginner', targetRole: 'SDE' });

  const fetchData = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const [planData, todayData] = await Promise.all([
        getPlan(user.userId),
        getTodayTasks(user.userId)
      ]);
      setPlan(planData);
      setTodayTasks(todayData.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await generatePlan(form);
      setShowGenerate(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await completeTask(taskId);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ marginTop: '64px', padding: '2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="skeleton" style={{ height: '150px', borderRadius: '16px', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  const progress = plan?.progress || 0;

  return (
    <div className="page-enter" style={{ marginTop: '64px', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>📅 Study Plan</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Your personalized DSA learning roadmap
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowGenerate(!showGenerate)}>
            {showGenerate ? 'Cancel' : '+ New Plan'}
          </button>
        </div>

        {/* Generate Plan Form */}
        {showGenerate && (
          <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', animation: 'fadeSlideIn 0.3s ease' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Generate Study Plan</h3>
            <form onSubmit={handleGenerate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Days Available</label>
                  <input type="number" className="input-field" min={7} max={365} value={form.daysAvailable}
                    onChange={e => setForm(prev => ({ ...prev, daysAvailable: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Current Level</label>
                  <select className="input-field" value={form.currentLevel}
                    onChange={e => setForm(prev => ({ ...prev, currentLevel: e.target.value }))}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Target Role</label>
                  <select className="input-field" value={form.targetRole}
                    onChange={e => setForm(prev => ({ ...prev, targetRole: e.target.value }))}>
                    <option value="SDE">SDE</option>
                    <option value="SDE-2">SDE-2</option>
                    <option value="Senior SDE">Senior SDE</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={generating}>
                {generating ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Generate Plan'}
              </button>
            </form>
          </div>
        )}

        {/* Today's Tasks */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'var(--accent)', borderWidth: '1px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
            🎯 Today's Tasks
          </h3>
          {todayTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No tasks for today. Generate a new plan to get started!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {todayTasks.map(task => {
                const style = TASK_TYPE_COLORS[task.taskType] || TASK_TYPE_COLORS.learn;
                return (
                  <div key={task._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1rem', borderRadius: '10px',
                    background: task.completed ? 'rgba(0,206,201,0.05)' : 'var(--bg-secondary)',
                    border: `1px solid ${task.completed ? 'var(--success)' : 'var(--border)'}`,
                    opacity: task.completed ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{style.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {task.topic}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)} · {task.problemCount} problems · Lvl {task.difficulty}
                        </div>
                      </div>
                    </div>
                    {!task.completed && (
                      <button className="btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
                        onClick={() => handleComplete(task._id)}>
                        ✓ Done
                      </button>
                    )}
                    {task.completed && (
                      <span className="badge badge-success">Completed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {plan && plan.totalTasks > 0 && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Plan Progress</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)' }}>
                {progress}% ({plan.completedTasks}/{plan.totalTasks})
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`, height: '100%',
                background: 'var(--gradient-1)', borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        )}

        {/* Weekly Calendar Strip */}
        {plan && plan.plan && plan.plan.length > 0 && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📆 Upcoming Schedule</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {plan.plan.slice(0, 14).map((task, i) => {
                const style = TASK_TYPE_COLORS[task.taskType] || TASK_TYPE_COLORS.learn;
                const d = new Date(task.date);
                return (
                  <div key={i} style={{
                    padding: '0.6rem', borderRadius: '10px', textAlign: 'center',
                    background: task.completed ? 'rgba(0,206,201,0.1)' : style.bg,
                    border: `1px solid ${task.completed ? 'var(--success)' : 'transparent'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: style.text, margin: '0.15rem 0' }}>
                      {d.getDate()}
                    </div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.topic}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { StudyPlan } from '../models/StudyPlan.js';
import { generatePlan, getTodaysTasks } from '../services/planner.js';
import { getWeakTopics } from '../services/adaptive.js';

const router = express.Router();

// POST /api/plan/generate
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { daysAvailable, currentLevel, targetRole } = req.body;
    const userId = req.user.userId;

    if (!daysAvailable || !currentLevel) {
      return res.status(400).json({ error: 'daysAvailable and currentLevel are required' });
    }

    // Get weak topics from adaptive engine
    const weakTopicsData = await getWeakTopics(userId);
    const weakTopics = weakTopicsData.map(w => w.topic);

    const plan = await generatePlan({
      userId,
      daysAvailable: parseInt(daysAvailable),
      currentLevel,
      targetRole: targetRole || 'SDE',
      weakTopics
    });

    res.status(200).json({
      totalTasks: plan.length,
      plan: plan.slice(0, 30) // Return first 30 tasks for preview
    });
  } catch (error) {
    console.error('Plan generate error:', error);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// GET /api/plan/today/:userId
router.get('/today/:userId', requireAuth, async (req, res) => {
  try {
    const tasks = await getTodaysTasks(req.params.userId);
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get today tasks error:', error);
    res.status(500).json({ error: 'Failed to get today\'s tasks' });
  }
});

// GET /api/plan/:userId — full plan
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const plan = await StudyPlan.find({ userId: req.params.userId }).sort({ date: 1 });
    const completed = plan.filter(t => t.completed).length;
    res.status(200).json({
      plan,
      totalTasks: plan.length,
      completedTasks: completed,
      progress: plan.length > 0 ? Math.round((completed / plan.length) * 100) : 0
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: 'Failed to get study plan' });
  }
});

// PUT /api/plan/task/:taskId/complete
router.put('/task/:taskId/complete', requireAuth, async (req, res) => {
  try {
    const task = await StudyPlan.findByIdAndUpdate(
      req.params.taskId,
      { completed: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ task });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

export default router;

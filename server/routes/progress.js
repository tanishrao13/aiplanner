import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { Attempt } from '../models/Attempt.js';
import { getWeakTopics, getOverallStats } from '../services/adaptive.js';

const router = express.Router();

const DSA_TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
  'Stack', 'Queue', 'Linked Lists', 'Trees', 'Graphs',
  'Heaps', 'Dynamic Programming', 'Backtracking', 'Greedy'
];

// GET /api/progress/:userId
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Overall stats
    const overall = await getOverallStats(userId);

    // Topic breakdown
    const topicBreakdown = [];
    const heatmapData = {};

    for (const topic of DSA_TOPICS) {
      const attempts = await Attempt.find({ userId, topic }).sort({ createdAt: -1 });
      const count = attempts.length;

      if (count === 0) {
        topicBreakdown.push({
          topic,
          accuracy: 0,
          attempts: 0,
          difficulty: 1,
          trend: 'stable'
        });
        heatmapData[topic] = 0;
        continue;
      }

      const avgAccuracy = attempts.reduce((s, a) => s + a.accuracy, 0) / count;
      const currentDifficulty = attempts[0].difficulty;

      // Trend calculation: compare last 3 vs previous 3
      let trend = 'stable';
      if (count >= 6) {
        const recent3 = attempts.slice(0, 3).reduce((s, a) => s + a.accuracy, 0) / 3;
        const prev3 = attempts.slice(3, 6).reduce((s, a) => s + a.accuracy, 0) / 3;
        if (recent3 > prev3 + 0.1) trend = 'up';
        else if (recent3 < prev3 - 0.1) trend = 'down';
      }

      topicBreakdown.push({
        topic,
        accuracy: Math.round(avgAccuracy * 100) / 100,
        attempts: count,
        difficulty: currentDifficulty,
        trend
      });

      // Mastery score (0-100) based on accuracy and difficulty achieved
      const masteryScore = Math.round(avgAccuracy * (currentDifficulty / 5) * 100);
      heatmapData[topic] = masteryScore;
    }

    // Weak topics
    const weakTopicsData = await getWeakTopics(userId);
    const weakTopics = weakTopicsData.map(w => w.topic);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await Attempt.find({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).limit(20);

    // Estimated mastery date
    // Calculate based on current rate: if user averages X mastery gain per day
    const allAttempts = await Attempt.find({ userId }).sort({ createdAt: 1 });
    let estimatedMasteryDate = null;

    if (allAttempts.length >= 5) {
      const firstAttempt = allAttempts[0].createdAt;
      const daysActive = Math.max(1, (Date.now() - firstAttempt.getTime()) / (1000 * 60 * 60 * 24));
      const totalMastery = Object.values(heatmapData).reduce((s, v) => s + v, 0);
      const maxMastery = DSA_TOPICS.length * 100;
      const remainingMastery = maxMastery - totalMastery;
      const dailyRate = totalMastery / daysActive;

      if (dailyRate > 0) {
        const daysRemaining = Math.ceil(remainingMastery / dailyRate);
        estimatedMasteryDate = new Date();
        estimatedMasteryDate.setDate(estimatedMasteryDate.getDate() + daysRemaining);
      }
    }

    res.status(200).json({
      overallAccuracy: Math.round(overall.overallAccuracy * 100) / 100,
      totalAttempts: overall.totalAttempts,
      currentStreak: overall.currentStreak,
      topicBreakdown,
      weakTopics,
      heatmapData,
      recentActivity,
      estimatedMasteryDate
    });
  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({ error: 'Failed to get progress data' });
  }
});

export default router;

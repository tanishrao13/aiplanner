import { Attempt } from '../models/Attempt.js';

/**
 * Calculate weighted score for an attempt.
 */
export const calculateWeightedScore = ({ accuracy, timeTaken, expectedTime, streakCount }) => {
  const speedBonus = Math.min(Math.max(expectedTime / timeTaken, 0), 1);
  const streakBonus = Math.min(streakCount / 5, 1);
  return (accuracy * 0.5) + (speedBonus * 0.3) + (streakBonus * 0.2);
};

/**
 * Get current difficulty and stats for a user+topic.
 */
export const getTopicStats = async (userId, topic, type) => {
  const query = { userId, topic };
  if (type && type !== 'all') query.type = type;
  const attempts = await Attempt.find(query).sort({ createdAt: -1 });
  const count = attempts.length;
  const avgScore = count > 0
    ? attempts.reduce((sum, a) => sum + a.accuracy, 0) / count
    : 0;

  // Determine current difficulty from latest attempt or default to 1
  const currentDifficulty = count > 0 ? attempts[0].difficulty : 1;

  return { currentDifficulty, attempts: count, avgScore };
};

/**
 * Calculate streak for a user+topic (consecutive correct answers from most recent).
 */
export const getStreak = async (userId, topic, type) => {
  const query = { userId, topic };
  if (type && type !== 'all') query.type = type;
  const attempts = await Attempt.find(query).sort({ createdAt: -1 });
  let streak = 0;
  for (const a of attempts) {
    if (a.correct) streak++;
    else break;
  }
  return streak;
};

/**
 * Update difficulty based on the latest attempt result.
 * Returns the new difficulty level.
 */
export const updateDifficulty = async (userId, topic, currentDifficulty, weightedScore, type) => {
  const stats = await getTopicStats(userId, topic, type);
  let newDifficulty = currentDifficulty;

  if (weightedScore > 0.8 && stats.attempts >= 3) {
    newDifficulty = Math.min(currentDifficulty + 1, 5);
  } else if (weightedScore < 0.5) {
    newDifficulty = Math.max(currentDifficulty - 1, 1);
  }

  return newDifficulty;
};

/**
 * Get weak topics for a user.
 * A topic is weak if avgScore < 0.6 after >= 5 attempts.
 */
export const getWeakTopics = async (userId, type) => {
  const DSA_TOPICS = [
    'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
    'Stack', 'Queue', 'Linked Lists', 'Trees', 'Graphs',
    'Heaps', 'Dynamic Programming', 'Backtracking', 'Greedy'
  ];

  const weakTopics = [];

  for (const topic of DSA_TOPICS) {
    const stats = await getTopicStats(userId, topic, type);
    if (stats.attempts >= 5 && stats.avgScore < 0.6) {
      weakTopics.push({ topic, avgScore: stats.avgScore, attempts: stats.attempts });
    }
  }

  // Sort by avgScore ascending (weakest first)
  weakTopics.sort((a, b) => a.avgScore - b.avgScore);
  return weakTopics;
};

/**
 * Get overall stats for a user across all topics.
 */
export const getOverallStats = async (userId, type) => {
  const query = { userId };
  if (type && type !== 'all') query.type = type;
  const attempts = await Attempt.find(query).sort({ createdAt: -1 });
  const totalAttempts = attempts.length;
  
  if (totalAttempts === 0) {
    return { overallAccuracy: 0, totalAttempts: 0, currentStreak: 0 };
  }

  const overallAccuracy = attempts.reduce((sum, a) => sum + a.accuracy, 0) / totalAttempts;

  // Global streak (consecutive correct from most recent)
  let currentStreak = 0;
  for (const a of attempts) {
    if (a.correct) currentStreak++;
    else break;
  }

  return { overallAccuracy, totalAttempts, currentStreak };
};

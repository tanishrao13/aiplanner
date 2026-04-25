import { StudyPlan } from '../models/StudyPlan.js';
import { getWeakTopics } from './adaptive.js';

const ALL_TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
  'Stack', 'Queue', 'Linked Lists', 'Trees', 'Graphs',
  'Heaps', 'Dynamic Programming', 'Backtracking', 'Greedy'
];

/**
 * Generate a structured DSA study plan.
 */
export const generatePlan = async ({ userId, daysAvailable, currentLevel, targetRole, weakTopics = [] }) => {
  // Clear any existing plan for this user
  await StudyPlan.deleteMany({ userId });

  const startDate = new Date();
  const tasks = [];

  // Calculate topic weights
  const topicWeights = {};
  const weakSet = new Set(weakTopics);

  ALL_TOPICS.forEach(t => {
    topicWeights[t] = weakSet.has(t) ? 1.4 : 1.0; // 40% more weight for weak topics
  });

  const totalWeight = Object.values(topicWeights).reduce((s, w) => s + w, 0);

  // Calculate days per topic
  const topicDays = {};
  let usedDays = 0;
  ALL_TOPICS.forEach(t => {
    const days = Math.max(1, Math.round((topicWeights[t] / totalWeight) * daysAvailable * 0.7)); // 70% for learning+practice
    topicDays[t] = days;
    usedDays += days;
  });

  // Distribute remaining days for revision and mocks
  const revisionDays = Math.floor(daysAvailable / 7); // every 7 days
  const mockDays = Math.floor(daysAvailable / 14); // every 14 days

  // Build day-by-day plan
  let dayIndex = 0;
  const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
  const baseDifficulty = difficultyMap[currentLevel] || 1;

  // Spread topics across available learning days
  const learningSchedule = [];
  ALL_TOPICS.forEach(topic => {
    const days = topicDays[topic];
    for (let d = 0; d < days; d++) {
      const taskType = d === 0 ? 'learn' : 'practice';
      const difficulty = Math.min(baseDifficulty + Math.floor(d / 2), 5);
      learningSchedule.push({ topic, taskType, difficulty });
    }
  });

  for (let day = 0; day < daysAvailable; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    // Insert revision day every 7 days (starting from day 7)
    if ((day + 1) % 7 === 0 && day > 0) {
      tasks.push({
        userId,
        date: currentDate,
        topic: 'Mixed Review',
        taskType: 'revise',
        problemCount: 10,
        difficulty: baseDifficulty,
        completed: false
      });
      continue;
    }

    // Insert mock test day every 14 days (starting from day 14)
    if ((day + 1) % 14 === 0 && day > 0) {
      tasks.push({
        userId,
        date: currentDate,
        topic: 'Full Mock Test',
        taskType: 'mock',
        problemCount: 20,
        difficulty: Math.min(baseDifficulty + 1, 5),
        completed: false
      });
      continue;
    }

    // Normal learning/practice day
    if (dayIndex < learningSchedule.length) {
      const item = learningSchedule[dayIndex];
      tasks.push({
        userId,
        date: currentDate,
        topic: item.topic,
        taskType: item.taskType,
        problemCount: item.taskType === 'learn' ? 5 : 8,
        difficulty: item.difficulty,
        completed: false
      });
      dayIndex++;
    } else {
      // Extra days: practice weak topics or general review
      const weakList = weakTopics.length > 0 ? weakTopics : ALL_TOPICS;
      const topic = weakList[day % weakList.length];
      tasks.push({
        userId,
        date: currentDate,
        topic,
        taskType: 'practice',
        problemCount: 8,
        difficulty: Math.min(baseDifficulty + 1, 5),
        completed: false
      });
    }
  }

  // Bulk insert
  const saved = await StudyPlan.insertMany(tasks);
  return saved;
};

/**
 * Get today's tasks for a user.
 */
export const getTodaysTasks = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await StudyPlan.find({
    userId,
    date: { $gte: today, $lt: tomorrow }
  }).sort({ date: 1 });
};

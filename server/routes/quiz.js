import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { Concept } from '../models/Concept.js';
import { Attempt } from '../models/Attempt.js';
import { queryChunks } from '../services/chroma.js';
import { generateEmbedding } from '../services/rag.js';
import { gradeAnswer } from '../services/grader.js';
import { calculateWeightedScore, updateDifficulty, getStreak, getWeakTopics } from '../services/adaptive.js';
import OpenAI from 'openai';
import { config } from '../config.js';

const router = express.Router();
const openai = new OpenAI({ 
  apiKey: config.nvidiaApiKey,
  baseURL: config.nvidiaBaseUrl
});

// POST /api/quiz/generate
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const userId = req.user.userId;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const diff = difficulty || 1;

    // 1. Generate embedding for context retrieval & Query ChromaDB
    let contextStr = '';
    try {
      const queryEmbedding = await generateEmbedding(topic, 'query');
      const results = await queryChunks(queryEmbedding, 2);
      if (results.documents && results.documents[0]) {
        contextStr = results.documents[0].join('\n---\n');
      }
    } catch (err) {
      console.warn('Quiz context retrieval failed, proceeding with general generation:', err.message);
    }

    const prompt = `Generate a multiple choice quiz question about ${topic} in Data Structures and Algorithms.
Difficulty level: ${diff}/5 (1=beginner, 5=expert)

${contextStr ? `Use this context for reference (derived from the user's uploaded documents):\n${contextStr}\n\n` : ''}

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "explanation": "why the correct answer is right",
  "timeComplexity": "relevant time complexity if applicable",
  "hint": "a subtle hint without giving away the answer",
  "expectedTime": 60
}

expectedTime should be in seconds, scaled with difficulty (easy=30s, hard=120s).`;

    const response = await openai.chat.completions.create({
      model: config.llmModel,
      messages: [
        { role: 'system', content: 'You are a DSA quiz generator. Output ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    let questionData;
    const rawContent = response.choices[0].message.content.trim();
    // Strip possible markdown code fences
    const cleaned = rawContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    try {
      questionData = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: 'Failed to parse generated question' });
    }

    // Store in Concept collection
    let concept = await Concept.findOne({ topic });
    if (!concept) {
      concept = await Concept.create({ topic, description: `${topic} questions`, questions: [] });
    }

    concept.questions.push({
      questionText: questionData.question,
      options: questionData.options,
      correctIndex: questionData.correctIndex,
      explanation: questionData.explanation,
      timeComplexity: questionData.timeComplexity || '',
      hint: questionData.hint || '',
      difficulty: diff
    });
    await concept.save();

    const savedQ = concept.questions[concept.questions.length - 1];

    res.status(200).json({
      questionId: savedQ._id,
      conceptId: concept._id,
      question: questionData.question,
      options: questionData.options,
      hint: questionData.hint,
      expectedTime: questionData.expectedTime || 60,
      difficulty: diff,
      topic
    });
  } catch (error) {
    console.error('Quiz generate error:', error);
    res.status(500).json({ error: 'Failed to generate quiz question' });
  }
});

// POST /api/quiz/grade
router.post('/grade', requireAuth, async (req, res) => {
  try {
    const { conceptId, questionId, userAnswer, timeTaken } = req.body;
    const userId = req.user.userId;

    if (questionId === undefined || userAnswer === undefined || timeTaken === undefined) {
      return res.status(400).json({ error: 'questionId, userAnswer, and timeTaken are required' });
    }

    const concept = await Concept.findById(conceptId);
    if (!concept) {
      return res.status(404).json({ error: 'Concept not found' });
    }

    const question = concept.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const correct = userAnswer === question.correctIndex;
    const accuracy = correct ? 1 : 0;
    const expectedTime = 60; // default expected
    const streak = await getStreak(userId, concept.topic);

    const weightedScore = calculateWeightedScore({
      accuracy,
      timeTaken,
      expectedTime,
      streakCount: streak
    });

    const currentDifficulty = question.difficulty;
    const newDifficulty = await updateDifficulty(userId, concept.topic, currentDifficulty, weightedScore);

    // Store attempt
    await Attempt.create({
      userId,
      questionId: question._id,
      topic: concept.topic,
      difficulty: currentDifficulty,
      accuracy,
      timeTaken,
      expectedTime,
      correct
    });

    let explanation = question.explanation;
    if (!correct) {
      explanation = await gradeAnswer({
        question: question.questionText,
        options: question.options,
        correctIndex: question.correctIndex,
        userAnswerIndex: userAnswer,
        topic: concept.topic
      });
    }

    // Recommend next topic
    const weakTopics = await getWeakTopics(userId);
    const nextRecommendedTopic = weakTopics.length > 0 ? weakTopics[0].topic : concept.topic;

    res.status(200).json({
      correct,
      score: weightedScore,
      explanation,
      newDifficulty,
      nextRecommendedTopic
    });
  } catch (error) {
    console.error('Quiz grade error:', error);
    res.status(500).json({ error: 'Failed to grade quiz answer' });
  }
});

export default router;

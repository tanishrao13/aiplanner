import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { CodingProblem } from '../models/CodingProblem.js';
import { Attempt } from '../models/Attempt.js';
import { queryChunks } from '../services/chroma.js';
import { generateEmbedding } from '../services/rag.js';
import { calculateWeightedScore, updateDifficulty, getStreak } from '../services/adaptive.js';
import OpenAI from 'openai';
import { config } from '../config.js';

const router = express.Router();
const openai = new OpenAI({ 
  apiKey: config.nvidiaApiKey,
  baseURL: config.nvidiaBaseUrl
});

const parseJSON = (rawString) => {
  try {
    // Attempt to extract purely the JSON object matching { ... } anywhere in the string
    const match = rawString.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return JSON.parse(rawString);
  } catch (err) {
    console.error('JSON parsing failed. Raw response:', rawString);
    throw new Error('LLM did not return valid JSON');
  }
};

// POST /api/coding/generate
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const diff = difficulty || 1;

    let contextStr = '';
    try {
      const queryEmbedding = await generateEmbedding(topic, 'query');
      const results = await queryChunks(queryEmbedding, 2);
      if (results.documents && results.documents[0]) {
        contextStr = results.documents[0].join('\n---\n');
      }
    } catch (err) {
      console.warn('Coding RAG context retrieval failed:', err.message);
    }

    const prompt = `Generate a programming problem about ${topic} in Data Structures and Algorithms.
Difficulty level: ${diff}/5 (1=beginner, 5=expert).

CRITICAL: For the starterCode, you MUST provide ONLY the function signature and a comment saying "Your code here". DO NOT PROVIDE THE ACTUAL SOLUTION OR IMPLEMENTATION in the starterCode! The student needs to solve it themselves.

${contextStr ? `Use this context for reference:\n${contextStr}\n\n` : ''}

Return ONLY valid JSON in this exact format (no markdown, no code blocks).
**CRITICAL RULES FOR JSON:** 
1. DO NOT use backticks (\`) for strings anywhere.
2. All strings MUST be wrapped in double quotes (").
3. For multi-line strings like the starterCode, you MUST use exactly one string with explicit \\n for newlines. DO NOT write actual newlines inside the JSON string values.

{
  "title": "string",
  "description": "string",
  "examples": [{"input": "string", "output": "string", "explanation": "string"}],
  "constraints": ["string"],
  "starterCode": { "javascript": "function... \\n...", "python": "def... \\n..." },
  "testCases": [{"input": "string", "expectedOutput": "string", "hidden": boolean}],
  "hints": ["string"],
  "topic": "${topic}",
  "difficulty": ${diff},
  "timeComplexity": "string",
  "spaceComplexity": "string"
}`;

    const response = await openai.chat.completions.create({
      model: config.llmModel, // using configured model, falling back to NIM
      messages: [
        { role: 'system', content: 'You are an expert DSA problem setter. Output ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const parsedProblem = parseJSON(response.choices[0].message.content.trim());
    
    // Create new coding problem document
    const problem = await CodingProblem.create(parsedProblem);

    // Hide test cases
    const visibleProblem = problem.toObject();
    visibleProblem.testCases = visibleProblem.testCases.map(tc => tc.hidden ? { hidden: true } : tc);

    res.status(200).json(visibleProblem);
  } catch (error) {
    console.error('Coding generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate coding problem' });
  }
});

// GET /api/coding/problem/:problemId
router.get('/problem/:problemId', requireAuth, async (req, res) => {
  try {
    const problem = await CodingProblem.findById(req.params.problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const visibleProblem = problem.toObject();
    visibleProblem.testCases = visibleProblem.testCases.map(tc => tc.hidden ? { hidden: true } : tc);

    res.status(200).json(visibleProblem);
  } catch (error) {
    console.error('Fetch problem error:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// POST /api/coding/submit
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { problemId, code, language, timeTaken } = req.body;
    const userId = req.user.userId;

    if (!problemId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const evalPrompt = `Evaluate the following ${language} code submission for the problem "${problem.title}".

Problem Description: ${problem.description}
Starter Code: ${problem.starterCode[language]}
Expected Time Complexity: ${problem.timeComplexity}
Test Cases: ${JSON.stringify(problem.testCases)}

User Submission:
\`\`\`${language}
${code}
\`\`\`

Evaluate correctness, edge cases, time complexity, space complexity, and code quality.
If the solution is incorrect or suboptimal, provide a better/optimal solution.

Return ONLY valid JSON in this exact format (no markdown, no code blocks).
**CRITICAL RULES FOR JSON:** 
1. DO NOT use backticks (\`) for strings anywhere.
2. All strings MUST be wrapped in double quotes (").
3. For multi-line strings like the optimalSolution, you MUST use exactly one string with explicit \\n for newlines. DO NOT write actual newlines inside the JSON string values.

{
  "testResults": [{"input": "string", "passed": boolean, "actualOutput": "string"}],
  "score": 0.0 to 1.0,
  "passed": boolean,
  "feedback": "detailed feedback string. what's right, what's wrong, how it relates to expected complexity",
  "optimalSolution": "the optimal code if the user's is imperfect, else null"
}`;

    const response = await openai.chat.completions.create({
      model: config.llmModel,
      messages: [
        { role: 'system', content: 'You are an expert code reviewer and DSA tutor. Output ONLY valid JSON.' },
        { role: 'user', content: evalPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.2
    });

    const evaluation = parseJSON(response.choices[0].message.content.trim());
    
    // Scale standard expected time per difficulty (e.g., 60s per level)
    const expectedTime = problem.difficulty * 60;
    const streak = await getStreak(userId, problem.topic);

    const weightedScore = calculateWeightedScore({
      accuracy: evaluation.score,
      timeTaken,
      expectedTime,
      streakCount: streak
    });

    const newDifficulty = await updateDifficulty(userId, problem.topic, problem.difficulty, weightedScore);

    // Store Attempt
    await Attempt.create({
      userId,
      questionId: problem._id, // reuse but point to CodingProblem
      type: 'coding',
      topic: problem.topic,
      difficulty: problem.difficulty,
      accuracy: evaluation.score,
      timeTaken,
      expectedTime,
      correct: evaluation.passed
    });

    res.status(200).json({
      passed: evaluation.passed,
      score: evaluation.score,
      weightedScore,
      feedback: evaluation.feedback,
      optimalSolution: evaluation.optimalSolution,
      testResults: evaluation.testResults,
      newDifficulty
    });
  } catch (error) {
    console.error('Coding submission error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate code submission' });
  }
});

export default router;

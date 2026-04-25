import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({ 
  apiKey: config.nvidiaApiKey,
  baseURL: config.nvidiaBaseUrl
});

/**
 * Generate a personalized explanation for a wrong answer.
 */
export const gradeAnswer = async ({ question, options, correctIndex, userAnswerIndex, topic }) => {
  const userAnswer = options[userAnswerIndex];
  const correctAnswer = options[correctIndex];

  const prompt = `The student was asked: "${question}"
Topic: ${topic}

They chose: "${userAnswer}" (option ${userAnswerIndex + 1})
The correct answer is: "${correctAnswer}" (option ${correctIndex + 1})

Provide:
1. A clear, personalized explanation of WHY their answer is wrong
2. The correct approach to solve this problem
3. A similar example problem with solution to reinforce learning

Keep it concise but helpful. Format with markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: config.llmModel,
      messages: [
        { role: 'system', content: 'You are an expert DSA tutor. You provide clear, empathetic explanations when students get answers wrong.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.4
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Grader error:', error);
    return `The correct answer is "${correctAnswer}". ${options[correctIndex]} is the right choice because it correctly addresses the concept being tested.`;
  }
};

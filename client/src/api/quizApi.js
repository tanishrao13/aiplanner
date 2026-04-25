import api from './axios.js';

export const generateQuiz = async (topic, difficulty) => {
  const res = await api.post('/quiz/generate', { topic, difficulty });
  return res.data;
};

export const gradeQuiz = async (conceptId, questionId, userAnswer, timeTaken) => {
  const res = await api.post('/quiz/grade', { conceptId, questionId, userAnswer, timeTaken });
  return res.data;
};

import api from './axios.js';

export const generateCodingProblem = async (topic, difficulty) => {
  const res = await api.post('/coding/generate', { topic, difficulty });
  return res.data;
};

export const submitCodingProblem = async (problemId, code, language, timeTaken) => {
  const res = await api.post('/coding/submit', { problemId, code, language, timeTaken });
  return res.data;
};

export const getCodingProblem = async (problemId) => {
  const res = await api.get(`/coding/problem/${problemId}`);
  return res.data;
};

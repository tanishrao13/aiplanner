import api from './axios.js';

export const getProgress = async (userId) => {
  const res = await api.get(`/progress/${userId}`);
  return res.data;
};

export const getPlan = async (userId) => {
  const res = await api.get(`/plan/${userId}`);
  return res.data;
};

export const getTodayTasks = async (userId) => {
  const res = await api.get(`/plan/today/${userId}`);
  return res.data;
};

export const generatePlan = async (data) => {
  const res = await api.post('/plan/generate', data);
  return res.data;
};

export const completeTask = async (taskId) => {
  const res = await api.put(`/plan/task/${taskId}/complete`);
  return res.data;
};

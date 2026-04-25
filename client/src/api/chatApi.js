import api from './axios.js';

export const sendChatMessage = async (query) => {
  const token = localStorage.getItem('studyos_token');
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  });
  return response;
};

export const uploadFile = async (file) => {
  const token = localStorage.getItem('studyos_token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};

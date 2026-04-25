import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/studyos',
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  nvidiaBaseUrl: 'https://integrate.api.nvidia.com/v1',
  llmModel: 'meta/llama-3.1-8b-instruct',
  embeddingModel: 'nvidia/nv-embedqa-e5-v5',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  nodeEnv: process.env.NODE_ENV || 'development'
};

import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { upload } from '../middleware/uploadMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { addChunks } from '../services/chroma.js';
import { generateEmbedding } from '../services/rag.js';
import OpenAI from 'openai';
import { config } from '../config.js';

const router = express.Router();
const openai = new OpenAI({ 
  apiKey: config.nvidiaApiKey,
  baseURL: config.nvidiaBaseUrl
});

const DSA_TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
  'Stack', 'Queue', 'Linked Lists', 'Trees', 'Graphs',
  'Heaps', 'Dynamic Programming', 'Backtracking', 'Greedy', 'General'
];

// Lightweight classification using Llama
const classifyTopic = async (chunkText) => {
  try {
    const resp = await openai.chat.completions.create({
      model: config.llmModel,
      messages: [
        {
          role: 'system',
          content: `Classify the following text into exactly ONE of these DSA topics: ${DSA_TOPICS.join(', ')}. Respond with only the topic name, nothing else.`
        },
        { role: 'user', content: chunkText.substring(0, 500) }
      ],
      max_tokens: 20,
      temperature: 0
    });
    const topic = resp.choices[0].message.content.trim();
    return DSA_TOPICS.includes(topic) ? topic : 'General';
  } catch {
    return 'General';
  }
};

// Split text into chunks with overlap
const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }
  return chunks;
};

// POST /api/upload
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer } = req.file;
    let text = '';

    if (mimetype === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'File is empty or could not be parsed' });
    }

    const chunks = chunkText(text);
    const topicsFound = new Set();

    // Process chunks in batches of 10
    const batchSize = 10;
    let totalChunks = 0;

    for (let b = 0; b < chunks.length; b += batchSize) {
      const batch = chunks.slice(b, b + batchSize);
      const ids = [];
      const embeddings = [];
      const metadatas = [];

      for (let i = 0; i < batch.length; i++) {
        const idx = b + i;
        const embedding = await generateEmbedding(batch[i], 'passage');
        const topic = await classifyTopic(batch[i]);
        topicsFound.add(topic);

        ids.push(`${originalname}_chunk_${idx}`);
        embeddings.push(embedding);
        metadatas.push({ source: originalname, chunkIndex: idx, topic });
      }

      await addChunks(batch, embeddings, metadatas, ids);
      totalChunks += batch.length;
    }

    res.status(200).json({
      chunksCreated: totalChunks,
      topics: [...topicsFound],
      status: 'indexed'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process and index file' });
  }
});

export default router;

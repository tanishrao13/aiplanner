import OpenAI from 'openai';
import { config } from '../config.js';
import { queryChunks } from './chroma.js';

const openai = new OpenAI({ 
  apiKey: config.nvidiaApiKey,
  baseURL: config.nvidiaBaseUrl
});

export const generateEmbedding = async (text, inputType = 'query') => {
  try {
    const response = await fetch(`${config.nvidiaBaseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.nvidiaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.embeddingModel,
        input: text.replace(/\n/g, ' '),
        encoding_format: "float",
        input_type: inputType
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || data.error?.message || JSON.stringify(data));
    }

    return data.data[0].embedding;
  } catch (err) {
    console.error('Embedding Error:', err.message);
    throw err;
  }
};

export const generateStreamingResponse = async (query, res) => {
  try {
    // 1. Generate query embedding & Query ChromaDB for context
    let context = '';
    try {
      const queryEmbedding = await generateEmbedding(query, 'query');
      const results = await queryChunks(queryEmbedding, 3);
      if (results.documents && results.documents[0]) {
        context = results.documents[0].join('\n---\n');
      }
    } catch (err) {
      console.warn('RAG Context retrieval failed, proceeding with base LLM:', err.message);
    }

    const messages = [
      { 
        role: "system", 
        content: `You are an expert DSA tutor. Use the following context from the user's uploaded studies to answer their questions. If the answer isn't in the context, use your general knowledge but prioritize the context.
        
Context:
${context}` 
      },
      { 
        role: "user", 
        content: query 
      }
    ];

    const stream = await openai.chat.completions.create({
      model: config.llmModel,
      messages,
      stream: true
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, citations: [], confidence: 1.0 })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Chat Error:', err.message || err);
    // Don't throw here, the caller handles it if needed but headers might be sent
    if (!res.headersSent) {
      res.status(500).send('Streaming error');
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
};

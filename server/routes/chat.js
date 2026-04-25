import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { generateStreamingResponse } from '../services/rag.js';

const router = express.Router();

// POST /api/chat — SSE streaming response
router.post('/', requireAuth, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    await generateStreamingResponse(query.trim(), res);
  } catch (error) {
    console.error('Chat error:', error);
    // If headers already sent, close the connection
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Chat service failed' });
    }
  }
});

export default router;

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage, uploadFile } from '../api/chatApi';
import ChatMessage from '../components/ChatMessage';
import StreamingText from '../components/StreamingText';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [streamMeta, setStreamMeta] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const query = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setStreaming(true);
    setStreamText('');
    setStreamMeta(null);

    try {
      const response = await sendChatMessage(query);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                setStreamMeta({ confidence: data.confidence, citations: data.citations });
              } else if (data.token) {
                accumulated += data.token;
                setStreamText(accumulated);
              } else if (data.error) {
                accumulated += `\n\n⚠️ ${data.error}`;
                setStreamText(accumulated);
              }
            } catch {}
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: accumulated,
        confidence: streamMeta?.confidence,
        citations: streamMeta?.citations
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Failed to get response. Please try again.'
      }]);
    } finally {
      setStreaming(false);
      setStreamText('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadFile(file);
      setUploadResult(result);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `📄 Indexed "${file.name}" successfully!\n\n📦 ${result.chunksCreated} chunks created\n🏷️ Topics: ${result.topics?.join(', ')}\n✅ Status: ${result.status}`
      }]);
    } catch (err) {
      setUploadResult({ error: true });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Failed to upload and index file.'
      }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="page-enter" style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 64px)', marginTop: '64px',
    }}>
      {/* Chat messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '2rem',
        maxWidth: '900px', width: '100%', margin: '0 auto'
      }}>
        {messages.length === 0 && !streaming && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', textAlign: 'center',
            opacity: 0.8
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              AI DSA Tutor
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6, fontSize: '0.9rem' }}>
              Ask about any data structure or algorithm. Upload PDFs to build your knowledge base, then query it with RAG-powered answers.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Explain quicksort', 'What is a red-black tree?', 'DP vs Greedy'].map(q => (
                <button key={q} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} {...msg} />
        ))}

        {streaming && (
          <div style={{
            maxWidth: '75%', padding: '1rem 1.25rem',
            borderRadius: '16px 16px 16px 4px',
            background: 'var(--bg-card)', border: '1px solid var(--border)'
          }}>
            <StreamingText response={streamText} />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        padding: '1rem 2rem'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="file" ref={fileInputRef} accept=".pdf,.txt" onChange={handleFileUpload}
            style={{ display: 'none' }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={uploading}
            style={{ padding: '0.7rem', flexShrink: 0, fontSize: '1.1rem', lineHeight: 1 }}
            title="Upload PDF/TXT to knowledge base"
          >
            {uploading ? <span className="spinner" /> : '📎'}
          </button>

          <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', gap: '0.75rem' }}>
            <input
              className="input-field"
              placeholder="Ask about DSA concepts..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={streaming}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={streaming || !input.trim()}
              style={{ flexShrink: 0 }}>
              {streaming ? <span className="spinner" /> : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

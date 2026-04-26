import React from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ language, value, onChange }) {
  return (
    <div style={{ height: '100%', width: '100%', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={onChange}
        options={{
          fontSize: 14,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
        }}
        loading={<div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading editor...</div>}
      />
    </div>
  );
}

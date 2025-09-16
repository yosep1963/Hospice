// src/components/ChatMessage.tsx
import React from 'react';

interface Props { content: string; role: 'user' | 'assistant' }

const ChatMessage: React.FC<Props> = ({ content, role }) => {
  const lines = content.split('\n');
  return (
    <div className={role === 'user' ? 'text-right' : 'text-left'}>
      {lines.map((ln, i) => (
        <p key={i} className="leading-relaxed whitespace-pre-wrap">{ln}</p>
      ))}
    </div>
  );
};

export default ChatMessage;
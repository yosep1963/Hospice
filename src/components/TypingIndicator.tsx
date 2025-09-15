import React from 'react';
import { TypingIndicatorProps } from '../types';

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  userName = 'Assistant',
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`typing-indicator ${className}`} role="status" aria-label={`${userName} is typing`}>
      <div className="typing-dots">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
      <span className="text-xs text-gray-500 ml-2">{userName} is typing...</span>
    </div>
  );
};

export default TypingIndicator;
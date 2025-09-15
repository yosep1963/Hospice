import React, { useState } from 'react';
import { MessageBubbleProps } from '../types';
import { Copy, RotateCcw, ExternalLink } from 'lucide-react';

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLast = false,
  showAvatar = true,
  onRetry,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const renderContent = () => {
    switch (message.type) {
      case 'document':
        return (
          <div className="space-y-2">
            <p className="message-content">{message.content}</p>
            {message.metadata?.documentName && (
              <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
                <ExternalLink className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{message.metadata.documentName}</span>
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            <p className="message-content">{message.content}</p>
            {/* Image rendering would go here */}
          </div>
        );
      default:
        return (
          <div className="message-content">
            {message.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < message.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        );
    }
  };

  const renderSources = () => {
    if (!message.metadata?.sources || message.metadata.sources.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <span>Sources:</span>
          {message.metadata.sources.map((source, index) => (
            <span key={index} className="bg-gray-200 px-2 py-1 rounded text-xs">
              {source}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderConfidence = () => {
    if (!message.metadata?.confidence) return null;

    const confidence = message.metadata.confidence;
    const getConfidenceColor = (confidence: number) => {
      if (confidence >= 0.8) return 'text-green-600';
      if (confidence >= 0.6) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="mt-1 text-xs">
        <span className={`${getConfidenceColor(confidence)}`}>
          Confidence: {Math.round(confidence * 100)}%
        </span>
      </div>
    );
  };

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${className}`}>
      {showAvatar && message.sender === 'bot' && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
          <span className="text-sm font-medium text-blue-600">AI</span>
        </div>
      )}

      <div className={`message-bubble ${message.sender} group relative`}>
        {renderContent()}

        {message.sender === 'bot' && (
          <>
            {renderSources()}
            {renderConfidence()}
          </>
        )}

        <div className="message-timestamp">
          {formatTimestamp(message.timestamp)}
        </div>

        {/* Action buttons */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-gray-200 hover:bg-opacity-20 transition-colors duration-200"
            title="Copy message"
            aria-label="Copy message"
          >
            <Copy className="w-3 h-3" />
          </button>

          {message.sender === 'bot' && onRetry && (
            <button
              onClick={onRetry}
              className="p-1 rounded hover:bg-gray-200 hover:bg-opacity-20 transition-colors duration-200"
              title="Regenerate response"
              aria-label="Regenerate response"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Copy success indicator */}
        {copied && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
            Copied!
          </div>
        )}
      </div>

      {showAvatar && message.sender === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-2">
          <span className="text-sm font-medium text-gray-600">U</span>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
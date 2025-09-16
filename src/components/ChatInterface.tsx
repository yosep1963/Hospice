import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatInterfaceProps, Message, ChatResponse } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { MessageSquare, RefreshCw, Trash2 } from 'lucide-react';

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId,
  onNewMessage,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Load existing messages when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadMessages(sessionId);
    } else {
      // Start with a welcome message
      setMessages([{
        id: 'welcome',
        content: "안녕하세요! 저는 호스피스 케어 어시스턴트입니다. 🏥\n\n다음과 같은 도움을 드릴 수 있습니다:\n• 호스피스 케어 정보 제공\n• 통증 관리 방법 안내\n• 사전연명의료의향서 관련 상담\n• 정서적 지원 및 상담\n• 문서 관리 및 검색\n\n어떤 것이 궁금하신가요?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }]);
    }
  }, [sessionId]);

  const loadMessages = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`);

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          sessionId: sessionId || `session-${Date.now()}`,
          history: messages.slice(-10) // 최근 10개 메시지만 전송
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const chatResponse: ChatResponse = await response.json();

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: chatResponse.message,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          confidence: chatResponse.confidence,
          sources: chatResponse.sources?.map(doc => doc.name) || [],
        }
      };

      setMessages(prev => [...prev, botMessage]);

      // Notify parent component
      if (onNewMessage) {
        onNewMessage(botMessage);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }

      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: '죄송합니다. 메시지 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
      setError('메시지 전송에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'user');
    if (lastUserMessage) {
      // Remove the last bot message (which might be an error)
      const messagesWithoutLastBot = messages.filter((msg, index) => {
        return !(index === messages.length - 1 && msg.sender === 'bot');
      });
      setMessages(messagesWithoutLastBot);
      sendMessage(lastUserMessage.content);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear this chat? This action cannot be undone.')) {
      setMessages([{
        id: 'welcome-new',
        content: "Chat cleared. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }]);
      setError(null);
    }
  };

  const regenerateResponse = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1];
      if (previousUserMessage.sender === 'user') {
        // Remove messages from the bot message onwards
        const messagesUpToUser = messages.slice(0, messageIndex);
        setMessages(messagesUpToUser);
        sendMessage(previousUserMessage.content);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`chat-container ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
          <span className="ml-2">Loading chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-container ${className}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Hospice Care Assistant</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={retryLastMessage}
            disabled={isTyping || messages.length === 0}
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200 disabled:opacity-50"
            title="Retry last message"
            aria-label="Retry last message"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={clearChat}
            disabled={isTyping}
            className="p-2 text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors duration-200 disabled:opacity-50"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message mx-4 mt-4">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-800 hover:text-red-900"
            aria-label="Dismiss error"
          >
            �
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
            showAvatar={true}
            onRetry={message.sender === 'bot' ? () => regenerateResponse(message.id) : undefined}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <TypingIndicator
            isVisible={true}
            userName="Assistant"
          />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isTyping}
        placeholder="Ask me about hospice care, pain management, or upload a document..."
        maxLength={2000}
      />
    </div>
  );
};

export default ChatInterface;
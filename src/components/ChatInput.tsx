import React, { useState, useRef, useEffect } from 'react';
import { ChatInputProps } from '../types';
import { Send, Paperclip, Mic, MicOff } from 'lucide-react';

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 2000,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || disabled) return;

    onSendMessage(message.trim());
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file);
      // You could integrate with the document processor here
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        // Handle audio data here
        console.log('Audio data available:', event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < 100;

  return (
    <form onSubmit={handleSubmit} className={`chat-input-container ${className}`}>
      <div className="chat-input">
        {/* File attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200 disabled:opacity-50"
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Please wait...' : placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className="chat-input-field"
            rows={1}
            aria-label="Message input"
          />

          {/* Character count */}
          {isNearLimit && (
            <div className={`absolute -top-6 right-0 text-xs ${remainingChars < 20 ? 'text-red-500' : 'text-yellow-500'}`}>
              {remainingChars} characters remaining
            </div>
          )}
        </div>

        {/* Voice recording button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={disabled}
          className={`p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200 disabled:opacity-50 ${
            isRecording
              ? 'text-red-500 hover:text-red-700 bg-red-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
          aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="chat-input-button"
          title="Send message"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center mt-2 space-x-2 text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Recording...</span>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> to send,
        <kbd className="px-1 py-0.5 bg-gray-100 rounded ml-1">Shift+Enter</kbd> for new line
      </div>
    </form>
  );
};

export default ChatInput;
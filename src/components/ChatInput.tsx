// src/components/ChatInput.tsx
import React, { useRef, useState } from 'react';
import { DocumentProcessor } from '../services/DocumentProcessor';
import type { ChatInputProps } from '../types';

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
  maxLength = 2000,
  className = ""
}) => {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const meta = await DocumentProcessor.upload(file);
      // 업로드 완료 후 메시지 전송
      onSendMessage(`파일 업로드: ${meta.name} (${meta.type})`);
    } catch (err: any) {
      alert(`파일 업로드 실패: ${err.message || err}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={`flex gap-2 items-center p-4 bg-white border-t ${className}`}>
      <input
        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        placeholder={disabled ? "Please wait..." : placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || uploading}
        maxLength={maxLength}
      />
      <button
        className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg transition-colors disabled:opacity-50"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || uploading}
        title="파일 첨부"
      >
        📎
      </button>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFile}
        accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif"
      />
      <button
        className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={submit}
        disabled={disabled || uploading || !text.trim()}
      >
        {uploading ? '업로드중...' : '전송'}
      </button>
    </div>
  );
};

export default ChatInput;
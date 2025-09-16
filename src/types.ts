// src/types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface DocumentMeta {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  createdAt: string;
  path?: string; // 서버 내부 경로(클라이언트에서 사용 안 함)
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  path?: string;
  tags?: string[];
  content?: string;
  category?: string;
  uploadDate?: string;
  summary?: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  data?: DocumentMeta;
  document?: Document;
  error?: string;
}

export interface SearchFilters {
  query?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'document';
  metadata?: {
    confidence?: number;
    sources?: string[];
    fileId?: string;
    fileName?: string;
    documentName?: string;
  };
}

export interface ChatResponse {
  message: string;
  confidence: number;
  sources?: Document[];
  timestamp: string;
  sessionId: string;
}

export interface ChatInterfaceProps {
  sessionId?: string;
  onNewMessage?: (message: Message) => void;
  className?: string;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
  showAvatar?: boolean;
  onRetry?: () => void;
  className?: string;
}

export interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
  className?: string;
}

export interface PWAInstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAInstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
  className?: string;
}

// PWA beforeinstallprompt 이벤트 타입(커스텀)
export interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  notifications: boolean;
  autoSave: boolean;
}
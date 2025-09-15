export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'document' | 'image';
  metadata?: {
    documentId?: string;
    documentName?: string;
    confidence?: number;
    sources?: string[];
  };
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: Date;
  category?: string;
  tags?: string[];
  content?: string;
  summary?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  notifications: boolean;
  autoSave: boolean;
  language: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatResponse {
  message: string;
  confidence: number;
  sources?: Document[];
  suggestedActions?: string[];
  followUpQuestions?: string[];
}

export interface DocumentUploadResponse {
  document: Document;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  summary?: string;
}

export interface PWAInstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ServiceWorkerRegistration {
  installing?: ServiceWorker;
  waiting?: ServiceWorker;
  active?: ServiceWorker;
  scope: string;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
}

// Component Props Types
export interface ChatInterfaceProps {
  sessionId?: string;
  onNewMessage?: (message: Message) => void;
  className?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
  showAvatar?: boolean;
  onRetry?: () => void;
  className?: string;
}

export interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
  className?: string;
}

export interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
  onDownload?: () => void;
  className?: string;
}

export interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

// Utility Types
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';
export type DocumentCategory = 'medical' | 'administrative' | 'educational' | 'personal' | 'other';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  category?: DocumentCategory;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  type?: string;
}

export interface SearchResult {
  documents: Document[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}
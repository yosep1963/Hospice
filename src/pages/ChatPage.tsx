import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { Message } from '../types';
import { MessageSquare, Users, FileText } from 'lucide-react';

const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [showPWAPrompt, setShowPWAPrompt] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = sessionId
      ? `Chat Session - Hospice Care Assistant`
      : 'Chat - Hospice Care Assistant';

    // Update meta description for better SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content',
        'Get compassionate support and answers about hospice care, pain management, and emotional guidance through our AI-powered assistant.'
      );
    }
  }, [sessionId]);

  const handleNewMessage = (message: Message) => {
    // Handle new message events (e.g., analytics, notifications)
    console.log('New message:', message);

    // You could add analytics tracking here
    // analytics.track('message_sent', { sender: message.sender, type: message.type });
  };

  const handlePWAInstall = () => {
    console.log('PWA installation started');
    setShowPWAPrompt(false);
  };

  const handlePWADismiss = () => {
    console.log('PWA prompt dismissed');
    setShowPWAPrompt(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Hospice Care Assistant
              </h1>
              <p className="text-sm text-gray-500">
                Compassionate support and guidance
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="hidden sm:flex items-center space-x-2">
            <a
              href="/documents"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="View documents"
              aria-label="View documents"
            >
              <FileText className="w-5 h-5" />
            </a>
            <a
              href="/about"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="About"
              aria-label="About this application"
            >
              <Users className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto">
        <ChatInterface
          sessionId={sessionId || undefined}
          onNewMessage={handleNewMessage}
          className="h-full"
        />
      </main>

      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <PWAInstallPrompt
          onInstall={handlePWAInstall}
          onDismiss={handlePWADismiss}
        />
      )}

      {/* Mobile Quick Actions */}
      <div className="sm:hidden fixed bottom-4 right-4 z-30">
        <div className="flex flex-col space-y-2">
          <a
            href="/documents"
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
            title="View documents"
            aria-label="View documents"
          >
            <FileText className="w-5 h-5" />
          </a>
          <a
            href="/about"
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
            title="About"
            aria-label="About this application"
          >
            <Users className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Loading states and offline indicator */}
      <div id="network-status" className="hidden">
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          You are currently offline. Some features may be limited.
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
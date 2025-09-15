import React, { useState, useEffect } from 'react';
import { PWAInstallPromptProps, PWAInstallEvent } from '../types';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  className = ''
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already running in standalone mode (PWA is installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone ||
                     document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAInstallEvent);

      // Check if user has previously dismissed the prompt
      const lastDismissed = localStorage.getItem('pwa-install-dismissed');
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;

      if (!lastDismissed || (now - parseInt(lastDismissed)) > dayInMs) {
        setIsVisible(true);
      }
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show prompt if not in standalone mode and not recently dismissed
    if (iOS && !standalone) {
      const lastDismissed = localStorage.getItem('pwa-install-dismissed');
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;

      if (!lastDismissed || (now - parseInt(lastDismissed)) > dayInMs) {
        setIsVisible(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) return;

    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        // For Chrome/Edge
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          if (onInstall) onInstall();
        } else {
          console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setIsVisible(false);
      } else if (isIOS) {
        // For iOS, we can't programmatically trigger install, just show instructions
        // The prompt already shows instructions, so just call onInstall if provided
        if (onInstall) onInstall();
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    if (onDismiss) onDismiss();
  };

  // Don't show if already installed or not visible
  if (isStandalone || !isVisible) {
    return null;
  }

  const renderIOSInstructions = () => (
    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
          1
        </div>
        <p className="text-sm text-gray-600">
          Tap the share button in Safari <span className="font-mono bg-gray-100 px-1 rounded">™</span>
        </p>
      </div>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
          2
        </div>
        <p className="text-sm text-gray-600">
          Scroll down and tap "Add to Home Screen" <span className="font-mono bg-gray-100 px-1 rounded">ž</span>
        </p>
      </div>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
          3
        </div>
        <p className="text-sm text-gray-600">
          Tap "Add" to install the app on your home screen
        </p>
      </div>
    </div>
  );

  return (
    <div className={`pwa-install-prompt ${className}`}>
      <div className="pwa-install-content">
        <div className="pwa-install-icon">
          {isIOS ? (
            <Smartphone className="w-6 h-6 text-blue-600" />
          ) : (
            <Download className="w-6 h-6 text-blue-600" />
          )}
        </div>

        <div className="pwa-install-text">
          <h4 className="pwa-install-title">
            Install Hospice Care Assistant
          </h4>
          <p className="pwa-install-description">
            {isIOS
              ? "Add this app to your home screen for quick and easy access."
              : "Install this app for a better experience with offline access and push notifications."
            }
          </p>

          {isIOS && (
            <div className="mt-3">
              {renderIOSInstructions()}
            </div>
          )}

          <div className="pwa-install-actions">
            {!isIOS && (
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="btn btn-primary"
              >
                {isInstalling ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="btn btn-secondary"
            >
              {isIOS ? 'Got it' : 'Maybe later'}
            </button>
          </div>

          {!isIOS && (
            <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Monitor className="w-3 h-3" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center space-x-1">
                <Smartphone className="w-3 h-3" />
                <span>Mobile friendly</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Dismiss installation prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Auto-suggest after 1.5s delay if user hasn't installed or dismissed recently
      const dismissed = sessionStorage.getItem('ust_pwa_dismissed');
      if (!dismissed && !isStandalone) {
        setTimeout(() => {
          setShowAutoPrompt(true);
        }, 1500);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowAutoPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If on iOS and not standalone, also suggest after 2s
    if (isIOSDevice && !isStandalone) {
      const dismissed = sessionStorage.getItem('ust_pwa_dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowAutoPrompt(true);
        }, 2000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowAutoPrompt(false);
        return true;
      }
    } catch (err) {
      console.error('PWA install prompt error:', err);
    }
    return false;
  };

  const dismissAutoPrompt = () => {
    setShowAutoPrompt(false);
    sessionStorage.setItem('ust_pwa_dismissed', 'true');
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    showAutoPrompt,
    install,
    dismissAutoPrompt,
    setShowAutoPrompt,
  };
}

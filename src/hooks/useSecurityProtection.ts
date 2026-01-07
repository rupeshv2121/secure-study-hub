import { useEffect, useCallback, useState, useRef } from 'react';

interface UseSecurityProtectionOptions {
  onSecurityWarning: (message: string) => void;
  onBlurChange: (isBlurred: boolean) => void;
}

export const useSecurityProtection = ({
  onSecurityWarning,
  onBlurChange,
}: UseSecurityProtectionOptions) => {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const devToolsCheckInterval = useRef<number | null>(null);

  // Block keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Block: Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+U, Ctrl+A
      if (e.ctrlKey && ['s', 'p', 'c', 'u', 'a'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        onSecurityWarning('This action is disabled for content protection.');
        return false;
      }

      // Block: Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspect)
      if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        onSecurityWarning('Developer tools are disabled.');
        return false;
      }

      // Block: F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        onSecurityWarning('Developer tools are disabled.');
        return false;
      }

      // Block: PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        // Blur content and show warning
        onBlurChange(true);
        onSecurityWarning('Screenshot blocked! Content hidden.');
        setTimeout(() => onBlurChange(false), 3000);
        return false;
      }

      // Block: Ctrl+Shift+S (Screenshot in some browsers)
      if (e.ctrlKey && e.shiftKey && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        onBlurChange(true);
        onSecurityWarning('Screenshot blocked! Content hidden.');
        setTimeout(() => onBlurChange(false), 3000);
        return false;
      }

      // Block: Windows + Shift + S (Windows Snipping Tool)
      if (e.metaKey && e.shiftKey && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        onBlurChange(true);
        onSecurityWarning('Screenshot blocked! Content hidden.');
        setTimeout(() => onBlurChange(false), 3000);
        return false;
      }

      // Block: Command+Shift+4/5 (Mac screenshot)
      if (e.metaKey && e.shiftKey && ['4', '5', '3'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        onBlurChange(true);
        onSecurityWarning('Screenshot blocked! Content hidden.');
        setTimeout(() => onBlurChange(false), 3000);
        return false;
      }
    },
    [onSecurityWarning, onBlurChange]
  );

  // Handle visibility change (tab switch, minimize)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      onBlurChange(true);
      onSecurityWarning('Content hidden. Return to view.');
    } else {
      setTimeout(() => onBlurChange(false), 500);
    }
  }, [onBlurChange, onSecurityWarning]);

  // Handle window blur (clicking outside browser)
  const handleWindowBlur = useCallback(() => {
    onBlurChange(true);
    onSecurityWarning('Content hidden. Click here to view.');
  }, [onBlurChange, onSecurityWarning]);

  // Handle window focus
  const handleWindowFocus = useCallback(() => {
    setTimeout(() => onBlurChange(false), 300);
  }, [onBlurChange]);

  // Block right-click context menu
  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      onSecurityWarning('Right-click is disabled for content protection.');
      return false;
    },
    [onSecurityWarning]
  );

  // Detect DevTools using various methods
  const checkDevTools = useCallback(() => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      if (!devToolsOpen) {
        setDevToolsOpen(true);
        onBlurChange(true);
        onSecurityWarning('Developer tools detected. Content hidden.');
      }
    } else {
      if (devToolsOpen) {
        setDevToolsOpen(false);
        onBlurChange(false);
      }
    }
  }, [devToolsOpen, onBlurChange, onSecurityWarning]);

  // Block copy event
  const handleCopy = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();
      onSecurityWarning('Copying is disabled for content protection.');
      return false;
    },
    [onSecurityWarning]
  );

  // Block print
  const handleBeforePrint = useCallback(() => {
    onBlurChange(true);
    onSecurityWarning('Printing is disabled for content protection.');
  }, [onBlurChange, onSecurityWarning]);

  const handleAfterPrint = useCallback(() => {
    onBlurChange(false);
  }, [onBlurChange]);

  // Block drag and drop
  const handleDragStart = useCallback((e: DragEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Detect screen capture API access
  useEffect(() => {
    // Override getDisplayMedia to detect screen recording attempts
    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
    if (navigator.mediaDevices && originalGetDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = async function (constraints) {
        onBlurChange(true);
        onSecurityWarning('Screen recording detected! Content hidden.');
        // Still throw error to prevent capture
        throw new Error('Screen capture is not allowed');
      };

      return () => {
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
        }
      };
    }
  }, [onBlurChange, onSecurityWarning]);

  // Set up all event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    // Start DevTools detection interval
    devToolsCheckInterval.current = window.setInterval(checkDevTools, 1000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);

      if (devToolsCheckInterval.current) {
        clearInterval(devToolsCheckInterval.current);
      }
    };
  }, [
    handleKeyDown,
    handleVisibilityChange,
    handleWindowBlur,
    handleWindowFocus,
    handleContextMenu,
    handleCopy,
    handleDragStart,
    handleBeforePrint,
    handleAfterPrint,
    checkDevTools,
  ]);

  return {
    devToolsOpen,
  };
};

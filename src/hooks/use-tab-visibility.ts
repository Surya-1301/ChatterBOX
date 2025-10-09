import { useState, useEffect } from 'react';

/**
 * Hook to detect if the browser tab is currently active/focused
 * Useful for determining whether to show notifications or play sounds
 */
export function useTabVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if Page Visibility API is supported
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Initial state
    setIsVisible(!document.hidden);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Hook to detect if the window is focused
 * Alternative approach that can be used alongside tab visibility
 */
export function useWindowFocus() {
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    // Initial state
    setIsFocused(document.hasFocus());

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isFocused;
}
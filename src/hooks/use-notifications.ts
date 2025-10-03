import { useState, useEffect, useCallback } from 'react';
import { notificationManager } from '@/lib/notifications';
import type { User } from '@/lib/types';

interface UseNotificationsOptions {
  currentUser: User;
  isActive?: boolean; // Whether the current tab/conversation is active
}

export function useNotifications({ currentUser, isActive = true }: UseNotificationsOptions) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(notificationManager.isSupported());
    if (notificationManager.isSupported()) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await notificationManager.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const showMessageNotification = useCallback((
    senderName: string,
    message: string,
    avatar?: string,
    conversationId?: string
  ) => {
    // Only show notification if:
    // 1. User has notifications enabled
    // 2. Browser has permission
    // 3. Tab is not active (optional - you might want notifications even when active)
    const notificationsEnabled = currentUser.notificationSettings?.messageNotifications !== false;
    
    if (notificationsEnabled && permission === 'granted' && !isActive) {
      return notificationManager.showMessageNotification(senderName, message, avatar, conversationId);
    }
    return null;
  }, [currentUser.notificationSettings, permission, isActive]);

  const playNotificationSound = useCallback((type: 'incoming' | 'outgoing' = 'incoming') => {
    const soundsEnabled = type === 'incoming' 
      ? currentUser.notificationSettings?.incomingSounds !== false
      : currentUser.notificationSettings?.outgoingSounds === true;
    
    if (soundsEnabled) {
      notificationManager.playNotificationSound(type);
    }
  }, [currentUser.notificationSettings]);

  return {
    permission,
    isSupported,
    requestPermission,
    showMessageNotification,
    playNotificationSound,
    hasPermission: permission === 'granted',
    canShowNotifications: isSupported && permission === 'granted',
  };
}
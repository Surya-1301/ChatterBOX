// Browser notification utility functions

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

class NotificationManager {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are supported and permitted
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Check if user has granted notification permission
   */
  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Show a notification
   */
  show(options: NotificationOptions): Notification | null {
    if (!this.isSupported() || !this.hasPermission()) {
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show notification for new message
   */
  showMessageNotification(
    senderName: string,
    message: string,
    avatar?: string,
    conversationId?: string
  ): Notification | null {
    return this.show({
      title: senderName,
      body: message,
      icon: avatar || '/favicon.ico',
      tag: conversationId || 'message',
      requireInteraction: false,
    });
  }

  /**
   * Play notification sound
   */
  playNotificationSound(type: 'incoming' | 'outgoing' = 'incoming'): void {
    if (typeof window === 'undefined') return;

    try {
      // Create audio element for notification sound
      const audio = new Audio();
      
      // Use different sounds for incoming vs outgoing
      if (type === 'incoming') {
        // Simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else {
        // Simpler outgoing sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }
}

export const notificationManager = new NotificationManager();
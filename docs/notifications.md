# ChatterBox Notification System

## Overview

ChatterBox now includes a comprehensive notification system that alerts users to new messages through browser notifications and audio cues.

## Features

### Browser Notifications
- **Desktop Notifications**: Native browser notifications for new messages
- **Permission Management**: Automatic permission requests and status tracking
- **Smart Display**: Notifications only show when the tab is not active
- **Message Preview**: Shows sender name and message content
- **Conversation Grouping**: Groups notifications by conversation

### Audio Notifications
- **Incoming Message Sounds**: Play notification sounds for received messages
- **Outgoing Message Sounds**: Optional sounds for sent messages
- **Web Audio API**: Uses browser's audio capabilities for cross-platform compatibility

### Settings & Controls
- **Notification Settings Panel**: Comprehensive settings in the app
- **Permission Status**: Visual indicators for browser permission status
- **Test Functionality**: Built-in notification testing
- **Mute Controls**: Per-conversation notification muting

## How It Works

### Notification Flow
1. **Message Reception**: App polls for new messages every 3 seconds
2. **Permission Check**: Verifies browser notification permissions
3. **Settings Validation**: Checks user preferences and conversation mute status
4. **Display Logic**: Shows notifications only for inactive tabs
5. **Audio Playback**: Plays sounds based on user settings

### Key Components

#### NotificationManager (`/src/lib/notifications.ts`)
- Core notification functionality
- Permission handling
- Sound generation via Web Audio API
- Browser compatibility checks

#### useNotifications Hook (`/src/hooks/use-notifications.ts`)
- React hook for notification management
- Integrates with user settings
- Provides convenient methods for components

#### useTabVisibility Hook (`/src/hooks/use-tab-visibility.ts`)
- Detects when browser tab is active/inactive
- Uses Page Visibility API
- Prevents spam notifications when user is actively chatting

## Usage

### For Users

1. **Enable Notifications**:
   - Go to Settings > Notifications
   - Toggle "Message notifications" on
   - Allow browser permission when prompted

2. **Test Notifications**:
   - Use the "Test Notification" button in settings
   - Verify you receive the test notification

3. **Customize Settings**:
   - Toggle notification previews on/off
   - Enable/disable incoming and outgoing sounds
   - Mute specific conversations

### For Developers

```typescript
import { useNotifications } from '@/hooks/use-notifications';
import { useTabVisibility } from '@/hooks/use-tab-visibility';

// In your component
const isTabVisible = useTabVisibility();
const { showMessageNotification, playNotificationSound } = useNotifications({
  currentUser,
  isActive: isTabVisible,
});

// Show a notification
showMessageNotification('John Doe', 'Hello there!', avatarUrl, conversationId);

// Play a sound
playNotificationSound('incoming');
```

## Browser Compatibility

- **Notifications**: All modern browsers (Chrome 22+, Firefox 22+, Safari 7+)
- **Web Audio API**: All modern browsers (Chrome 10+, Firefox 25+, Safari 6+)
- **Page Visibility API**: All modern browsers (Chrome 13+, Firefox 18+, Safari 7+)

## Troubleshooting

### Common Issues

1. **Notifications Not Showing**:
   - Check browser notification permissions
   - Ensure notifications are enabled in app settings
   - Verify conversation is not muted

2. **Sounds Not Playing**:
   - Check browser audio permissions
   - Ensure sound settings are enabled
   - Try interacting with the page first (some browsers require user interaction)

3. **Permission Denied**:
   - Reset browser notification permissions
   - Clear browser data and reload
   - Check browser notification settings

### Browser-Specific Notes

- **Chrome**: May require HTTPS for notifications in production
- **Safari**: Requires user interaction before requesting permissions
- **Firefox**: Full support for all features
- **Mobile Browsers**: Limited notification support on iOS Safari

## Security & Privacy

- **No Data Storage**: Notifications don't store message content
- **Local Processing**: All notification logic runs client-side
- **Permission Respect**: Honors user's browser permission choices
- **Privacy Settings**: Integrates with app privacy controls

## Future Enhancements

- **Push Notifications**: Server-sent push notifications for offline users
- **Custom Sounds**: User-uploadable notification sounds
- **Rich Notifications**: Action buttons in notifications
- **Background Sync**: Service worker integration for better reliability
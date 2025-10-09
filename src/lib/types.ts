


export type PrivacySetting = 'everyone' | 'myContacts' | 'nobody';

export type ChatTheme = 'system' | 'light' | 'dark';
export type MediaUploadQuality = 'auto' | 'best' | 'dataSaver';
export type MediaAutoDownload = 'wifi' | 'cellular' | 'never';


export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline';
  about?: string;
  usernameLastChanged?: string;
  contacts?: string[];
  privacySettings?: {
    lastSeen?: PrivacySetting;
    profilePhoto?: PrivacySetting;
    about?: PrivacySetting;
    readReceipts?: boolean;
  };
  chatSettings?: {
    theme?: ChatTheme;
    wallpaper?: string;
    mediaUploadQuality?: MediaUploadQuality;
    mediaAutoDownload?: MediaAutoDownload;
    spellCheck?: boolean;
    replaceTextWithEmoji?: boolean;
    enterIsSend?: boolean;
  };
  notificationSettings?: {
    messageNotifications?: boolean;
    showPreviews?: boolean;
    showReactionNotifications?: boolean;
    backgroundSync?: boolean;
    incomingSounds?: boolean;
    outgoingSounds?: boolean;
  };
  blockedUsers?: string[];
};

export type Message = {
  _id: string;
  content: string;
  from: string; // User ID
  conversationId: string;
  timestamp: string;
  deliveredTo?: string[];
  readBy?: string[];
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  isOffline?: boolean;
  audioWaveform?: number[];
};

export type Conversation = {
  id:string;
  type: 'private' | 'group';
  name: string;
  avatar: string;
  lastMessage?: string;
  timestamp?: string | Timestamp;
  unreadCount?: number;
  participants: string[]; // Array of User IDs
  messages?: Message[];
  archived?: boolean;
  muted?: boolean;
};


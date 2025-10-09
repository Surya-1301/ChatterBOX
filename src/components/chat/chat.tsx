
'use client';

import type { Conversation, Message, User } from '@/lib/types';
import { useEffect, useState, useMemo, useRef } from 'react';
import ChatHeader from './chat-header';
import MessageList from './message-list';
import MessageInput from './message-input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { app } from '@/lib/realm';
import { useTabVisibility } from '@/hooks/use-tab-visibility';
import { useNotifications } from '@/hooks/use-notifications';
import GroupSettingsSheet from './group-settings-sheet';

type ChatProps = {
  conversation: Conversation;
  currentUser: User;
  users: User[];
  onBack: () => void;
  onUserUpdate: (user: User) => void;
  onAddContact: (userId: string) => void;
  onRemoveContact: (userId: string) => void;
  onToggleMute: (conversationId: string) => void;
  onOpenChatThemeSettings: () => void;
  onClearChat: (conversationId: string) => void;
  onInitiateCall: (conversation: Conversation, type: 'audio' | 'video') => void;
  onUpdateGroup?: (conversationId: string, updates: { name?: string; avatar?: string; participants?: string[]; }) => void;
  onLeaveGroup?: (conversationId: string) => void;
  onDeleteGroup?: (conversationId: string) => void;
}

export default function Chat({ conversation, currentUser, users, onBack, onUserUpdate, onAddContact, onRemoveContact, onToggleMute, onOpenChatThemeSettings, onClearChat, onInitiateCall, onUpdateGroup, onLeaveGroup, onDeleteGroup }: ChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const previousMessageCountRef = useRef<number>(0);
  const isTabVisible = useTabVisibility();
  const prevMessagesKeyRef = useRef<string>("");
  
  // Notification hooks
  const { showMessageNotification, playNotificationSound } = useNotifications({
    currentUser,
    isActive: isTabVisible,
  });
  
  const otherUser = conversation.type === 'private' ? users.find(u => u.id === conversation.participants.find(id => id !== currentUser.id)) : undefined;
  const isBlockedByOther = otherUser?.blockedUsers?.includes(currentUser.id);
  const isCurrentUserBlocked = currentUser.blockedUsers?.includes(otherUser?.id || '');

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
        setIsOnline(window.navigator.onLine);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;
    async function fetchMessages() {
      try {
        // Use server API to fetch messages
        const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversation.id)}`);
        if (res.ok) {
          const msgs = await res.json();
          // Sanitize any persisted blob: URLs from older data to avoid broken GETs
          msgs.forEach((m: any) => {
            if (m?.imageUrl && typeof m.imageUrl === 'string' && m.imageUrl.startsWith('blob:')) {
              m.imageUrl = null;
            }
            if (m?.fileUrl && typeof m.fileUrl === 'string' && m.fileUrl.startsWith('blob:')) {
              m.fileUrl = null;
            }
          });
          let filteredMsgs = msgs;
          if (isCurrentUserBlocked) filteredMsgs = msgs.filter((m:any) => m.from !== otherUser?.id);
          
          if (!cancelled) { 
            // Check for new messages and show notifications
            const previousCount = previousMessageCountRef.current;
            const newMessages = filteredMsgs.slice(previousCount);
            
            // Show notifications for new messages from other users
            if (previousCount > 0 && newMessages.length > 0) {
              newMessages.forEach((msg: Message) => {
                if (msg.from !== currentUser.id && msg.from !== 'system') {
                  const sender = users.find(u => u.id === msg.from);
                  const senderName = sender?.name || 'Unknown User';
                  
                  // Check if notifications are enabled and conversation is not muted
                  const notificationsEnabled = currentUser.notificationSettings?.messageNotifications !== false;
                  const soundsEnabled = currentUser.notificationSettings?.incomingSounds !== false;
                  const conversationMuted = conversation.muted;
                  
                  if (notificationsEnabled && !conversationMuted) {
                    // Show browser notification
                    const messageContent = msg.content || msg.fileName || 'File sent';
                    showMessageNotification(
                      senderName,
                      messageContent,
                      sender?.avatar,
                      conversation.id
                    );
                    
                    // Play notification sound
                    if (soundsEnabled) {
                      playNotificationSound('incoming');
                    }
                  }
                }
              });
            }
            
            const nextKey = JSON.stringify(filteredMsgs.map((m:any)=>`${m._id}:${m.timestamp}:${m.content || m.fileName || ''}`));
            if (nextKey !== prevMessagesKeyRef.current) {
              setMessages(filteredMsgs);
              prevMessagesKeyRef.current = nextKey;
            }
            previousMessageCountRef.current = filteredMsgs.length;
            setIsLoading(false);
          }
        } else {
          // Fallback to Realm if API fails
          const mongo = app.currentUser?.mongoClient('mongodb-atlas');
          if (!mongo) throw new Error('Not authenticated with MongoDB Realm');
          const messagesCollection = mongo.db('chatterbox').collection('messages');
          const msgs = await messagesCollection.find({ conversationId: conversation.id }, { sort: { timestamp: 1 } });
          // Sanitize any persisted blob: URLs from older data to avoid broken GETs
          (msgs as any[]).forEach((m: any) => {
            if (m?.imageUrl && typeof m.imageUrl === 'string' && m.imageUrl.startsWith('blob:')) {
              m.imageUrl = null;
            }
            if (m?.fileUrl && typeof m.fileUrl === 'string' && m.fileUrl.startsWith('blob:')) {
              m.fileUrl = null;
            }
          });
          let filteredMsgs = msgs;
          if (isCurrentUserBlocked) filteredMsgs = msgs.filter(m => m.from !== otherUser?.id);
          
          if (!cancelled) { 
            // Check for new messages and show notifications (same logic as above)
            const previousCount = previousMessageCountRef.current;
            const newMessages = filteredMsgs.slice(previousCount);
            
            if (previousCount > 0 && newMessages.length > 0) {
              newMessages.forEach((msg: Message) => {
                if (msg.from !== currentUser.id && msg.from !== 'system') {
                  const sender = users.find(u => u.id === msg.from);
                  const senderName = sender?.name || 'Unknown User';
                  
                  const notificationsEnabled = currentUser.notificationSettings?.messageNotifications !== false;
                  const soundsEnabled = currentUser.notificationSettings?.incomingSounds !== false;
                  const conversationMuted = conversation.muted;
                  
                  if (notificationsEnabled && !conversationMuted) {
                    const messageContent = msg.content || msg.fileName || 'File sent';
                    showMessageNotification(
                      senderName,
                      messageContent,
                      sender?.avatar,
                      conversation.id
                    );
                    
                    if (soundsEnabled) {
                      playNotificationSound('incoming');
                    }
                  }
                }
              });
            }
            
            const nextKey = JSON.stringify(filteredMsgs.map((m:any)=>`${m._id}:${m.timestamp}:${m.content || m.fileName || ''}`));
            if (nextKey !== prevMessagesKeyRef.current) {
              setMessages(filteredMsgs);
              prevMessagesKeyRef.current = nextKey;
            }
            previousMessageCountRef.current = filteredMsgs.length;
            setIsLoading(false);
          }
        }
        // Optionally, update read status here if needed
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
      }
    }
    const schedule = () => {
      if (cancelled) return;
      if (!isTabVisible) {
        timer = setTimeout(schedule, 8000);
        return;
      }
      fetchMessages().finally(() => {
        if (!cancelled) timer = setTimeout(schedule, 5000);
      });
    };
    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [conversation.id, isCurrentUserBlocked, otherUser?.id, currentUser.id, users, currentUser.notificationSettings, conversation.muted, isTabVisible]);
  
  const filteredMessages = useMemo(() => {
    if (!searchQuery) {
      return messages;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return messages.filter(message =>
      message.content?.toLowerCase().includes(lowerCaseQuery) ||
      message.fileName?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [messages, searchQuery]);

  const addSystemMessage = async (content: string) => {
    try {
      // Use server API to insert system message
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, from: 'system', conversationId: conversation.id, timestamp: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed to add system message');
    } catch (error) {
      console.error('Error adding system message:', error);
    }
  }

  const handleBlock = (userId: string) => {
    const updatedUser = {
      ...currentUser,
      blockedUsers: [...(currentUser.blockedUsers || []), userId]
    };
    onUserUpdate(updatedUser);
    toast({
      title: "User Blocked",
      description: `You have blocked ${conversation.name}.`,
    });
    addSystemMessage(`You blocked ${conversation.name}.`);
  };

  const handleUnblock = (userId: string) => {
    const updatedUser = {
      ...currentUser,
      blockedUsers: currentUser.blockedUsers?.filter(id => id !== userId)
    };
    onUserUpdate(updatedUser);
    toast({
      title: "User Unblocked",
      description: `You have unblocked ${conversation.name}.`,
    });
    addSystemMessage(`You unblocked ${conversation.name}.`);
  };

  const handleClearChat = (conversationId: string) => {
    onClearChat(conversationId);
     toast({
        title: "Chat Cleared",
        description: `Messages in this chat have been cleared.`,
    });
  }

  const handleSend = async (content: string, file?: File | Blob, options?: {fileName?: string, audioWaveform?: number[]}) => {
    if ((!content.trim() && !file) || isBlockedByOther) return;

    if (isCurrentUserBlocked) {
      toast({
        title: "Message Not Sent",
        description: `You cannot send messages to a blocked user. Unblock ${conversation.name} to continue.`,
        variant: 'destructive',
      });
      return;
    }

    const baseMessage: Omit<Message, '_id'> = {
      content: content.trim(),
      from: currentUser.id,
      conversationId: conversation.id,
      timestamp: new Date().toISOString(),
      isOffline: !isOnline,
      audioWaveform: options?.audioWaveform,
      deliveredTo: [currentUser.id],
      readBy: [currentUser.id]
    };

    // Build optimistic message for immediate UI feedback (with temporary blob URL)
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      _id: optimisticId,
      ...baseMessage,
    } as Message;

    if (file) {
      // Real file upload logic would go here (e.g., upload to S3/GridFS and store URL)
      const objUrl = URL.createObjectURL(file);
      if (file.type && file.type.startsWith('image/')) {
        (optimisticMessage as any).imageUrl = objUrl;
      } else {
        (optimisticMessage as any).fileUrl = objUrl;
        (optimisticMessage as any).fileName = options?.fileName || (file instanceof File ? file.name : 'file');
      }
    }

    // Push optimistic message to the UI immediately (even before server response)
    setMessages(prev => {
      const next = [...prev, optimisticMessage];
      previousMessageCountRef.current = next.length;
      return next;
    });

    if (isOnline) {
      try {
        // Preferred: use server API to create message (works without Realm client)
        // Do NOT persist temporary blob URLs to the server; only send metadata
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...baseMessage,
            // Persist only filename and content; URLs are null on the server until upload is implemented
            fileName: file ? (options?.fileName || (file instanceof File ? file.name : 'file')) : undefined,
          }),
        });

        if (res.ok) {
          // Play outgoing message sound if enabled
          playNotificationSound('outgoing');
          
          // Replace optimistic message with server-created one
          const created = await res.json();
          setMessages(prev => {
            const mapped = prev.map(m => {
              if (m._id === optimisticId) {
                // Ensure we have a valid _id for rendering
                const newId = created._id || created.id || `m-${Date.now()}`;
                return { _id: String(newId), ...created } as any;
              }
              return m;
            });
            previousMessageCountRef.current = mapped.length;
            return mapped;
          });
          return;
        }

        // If server returned an error, surface it
        let parsed = null;
        try { parsed = await res.json(); } catch (e) {}
        const serverMsg = parsed?.error || parsed?.message || (await res.text()).slice(0,200);
        throw new Error(serverMsg || 'Failed to send message');
      } catch (error: any) {
        console.error('Error sending message:', error);
        // If fetch/network error, try Realm fallback
        if (/fetch|network|failed to fetch/i.test(String(error.message || ''))) {
          try {
            const mongo = app.currentUser?.mongoClient('mongodb-atlas');
            if (!mongo) throw new Error('Not authenticated with MongoDB Realm');
            const messagesCollection = mongo.db('chatterbox').collection('messages');
            await messagesCollection.insertOne({ ...baseMessage, fileName: (optimisticMessage as any).fileName || null });
            return;
          } catch (realmErr) {
            console.error('Realm fallback failed:', realmErr);
          }
        }

        toast({ title: 'Error', description: error?.message || 'Could not send message.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'You are offline', description: "Your message will be sent when you're back online.", variant: 'destructive' });
    }
  };
  
  const emitTyping = (isTyping: boolean) => {
    // Typing indicator logic would need a backend to be effective between users.
  };

  const handleUpdateGroup = (updates: { name?: string; avatar?: string; participants?: string[]; }) => {
    if (onUpdateGroup) {
      onUpdateGroup(conversation.id, updates);
    }
  };

  const handleLeaveGroup = () => {
    if (onLeaveGroup) {
      onLeaveGroup(conversation.id);
      onBack(); // Navigate back after leaving
    }
  };

  const handleDeleteGroup = () => {
    if (onDeleteGroup) {
      onDeleteGroup(conversation.id);
      onBack(); // Navigate back after deleting
    }
  };

  const handleAddUsers = (userIds: string[]) => {
    const currentParticipants = conversation.participants || [];
    const newParticipants = [...currentParticipants, ...userIds];
    handleUpdateGroup({ participants: newParticipants });
  };

  const handleRemoveUser = (userId: string) => {
    const currentParticipants = conversation.participants || [];
    const newParticipants = currentParticipants.filter(id => id !== userId);
    handleUpdateGroup({ participants: newParticipants });
  };

  if (isLoading) {
    return (
        <div className="flex-1 flex items-center justify-center bg-transparent">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <ChatHeader
        conversation={conversation}
        isOnline={isOnline && !isCurrentUserBlocked}
        typingUsers={isCurrentUserBlocked ? [] : typingUsers}
        onBack={onBack}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onAddContact={onAddContact}
        onRemoveContact={onRemoveContact}
        onToggleMute={onToggleMute}
        currentUser={currentUser}
        onSearch={setSearchQuery}
        onOpenChatThemeSettings={onOpenChatThemeSettings}
        onClearChat={handleClearChat}
        onInitiateCall={onInitiateCall}
        onOpenGroupSettings={conversation.type === 'group' ? () => setShowGroupSettings(true) : undefined}
        users={users}
      />
      <MessageList 
        messages={filteredMessages} 
        currentUser={currentUser} 
        users={users} 
        conversation={conversation} 
        searchQuery={searchQuery}
      />
      <MessageInput
        onSend={handleSend}
        onTyping={emitTyping}
        messages={messages}
        isDisabled={isBlockedByOther || isCurrentUserBlocked}
        placeholder={
          isBlockedByOther 
            ? 'You cannot reply to this conversation.' 
            : isCurrentUserBlocked 
            ? `You have blocked ${conversation.name}. Unblock to send a message.`
            : 'Type a message'
        }
      />
      
      {conversation.type === 'group' && (
        <GroupSettingsSheet
          isOpen={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
          conversation={conversation}
          users={users}
          currentUser={currentUser}
          onUpdateGroup={handleUpdateGroup}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddUsers={handleAddUsers}
          onRemoveUser={handleRemoveUser}
          isGroupAdmin={true} // For now, assume current user is admin. In real app, this would be determined from conversation data
        />
      )}
    </div>
  );
}

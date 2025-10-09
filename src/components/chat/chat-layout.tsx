
'use client';

import type { User, Conversation } from '@/lib/types';
import type { Call } from '@/lib/webrtc';
import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import UserList from './user-list';
import Chat from './chat';
import { MessageSquare, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import SettingsSheet from './settings-sheet';
import DeleteConfirmationDialog from './delete-confirmation-dialog';
import { useRouter } from 'next/navigation';
import CallDialog from './call-dialog';
import { app } from '@/lib/realm';
import { notificationManager } from '@/lib/notifications';
import { useTabVisibility } from '@/hooks/use-tab-visibility';

interface ChatLayoutProps {
  currentUser: User;
}

export default function ChatLayout({
  currentUser: initialUser,
}: ChatLayoutProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'chats'>('main');
  // Swipe tutorial removed
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    conversationId: string | null;
    userName: string | null;
  }>({ isOpen: false, conversationId: null, userName: null });
  const { toast } = useToast();
  const router = useRouter();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const isTabVisible = useTabVisibility();
  const prevSnapshotRef = useRef<{ users: any[]; conversations: any[]; activeCall: any | null } | null>(null);

    const isMobile = useIsMobile();

  // Request notification permissions on component mount
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (currentUser.notificationSettings?.messageNotifications !== false) {
        try {
          const permission = await notificationManager.requestPermission();
          if (permission === 'denied') {
            toast({
              title: 'Notifications Disabled',
              description: 'You won\'t receive message notifications. You can enable them in your browser settings.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Failed to request notification permission:', error);
        }
      }
    };

    requestNotificationPermission();
  }, [currentUser.notificationSettings?.messageNotifications, toast]);

  useEffect(() => {
    if (!currentUser.id) return;
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    async function fetchAll() {
      try {
        // Fetch users via server API (works without Realm)
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersList = await usersRes.json();
          if (!cancelled) {
            // Only update if users actually changed (by id count or simple stringified diff up to a limit)
            const prev = prevSnapshotRef.current?.users || [];
            const changed = prev.length !== usersList.length || JSON.stringify(prev.map(u=>u.id).sort()) !== JSON.stringify(usersList.map((u:any)=>u.id).sort());
            if (changed) setUsers(usersList);
          }
        }

        // If Realm mongo client available, fetch current user, conversations and calls (faster/real-time later)
        const mongo = app.currentUser?.mongoClient('mongodb-atlas');
        if (mongo) {
          try {
            const usersCol = mongo.db('chatterbox').collection('users');
            const userDoc = await usersCol.findOne({ id: currentUser.id });
            if (userDoc && !cancelled) {
              setCurrentUser(userDoc);
              localStorage.setItem('currentUser', JSON.stringify(userDoc));
            }

            const convCol = mongo.db('chatterbox').collection('conversations');
            const convsList = await convCol.find({ participants: currentUser.id });
            convsList.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            if (!cancelled) {
              const prevConvs = prevSnapshotRef.current?.conversations || [];
              const prevKey = JSON.stringify(prevConvs.map((c:any)=>`${c.id}:${c.timestamp}`).sort());
              const nextKey = JSON.stringify(convsList.map((c:any)=>`${c.id}:${c.timestamp}`).sort());
              if (prevKey !== nextKey) {
                setConversations(convsList);
              }
              if (activeConversation) {
                const updatedActive = convsList.find((c: any) => c.id === activeConversation.id);
                setActiveConversation(updatedActive);
              } else {
                const nonArchived = convsList.filter((c: any) => !c.archived);
                if (nonArchived.length > 0) setActiveConversation(nonArchived[0]);
              }
            }

            const callsCol = mongo.db('chatterbox').collection('calls');
            const callDoc = await callsCol.findOne({ id: currentUser.id });
            if (!cancelled) {
              const prevCall = prevSnapshotRef.current?.activeCall;
              const callChanged = JSON.stringify(prevCall) !== JSON.stringify(callDoc || null);
              if (callChanged) {
                setActiveCall(callDoc || null);
              }
            }
          } catch (realmError) {
            console.warn('Realm connection failed, using fallback data');
            // Fallback to mock conversations when Realm fails
            // ...existing code...
          }
        } else {
          // No Realm connection, use mock data
          // ...existing code...
        }
      } catch (err) {
        console.error('Error fetching chat data:', err);
      }
      // Update snapshot after each run
      try {
        prevSnapshotRef.current = {
          users,
          conversations,
          activeCall,
        } as any;
      } catch {}
    }

    const schedule = () => {
      if (cancelled) return;
      if (!isTabVisible) {
        // Pause polling when tab is hidden
        timer = setTimeout(schedule, 8000);
        return;
      }
      fetchAll().finally(() => {
        if (!cancelled) timer = setTimeout(schedule, 8000); // Poll every 8s
      });
    };
    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [currentUser.id, activeConversation, isTabVisible]);


  const handleConversationSelect = async (conversation: Conversation) => {
    setActiveConversation(conversation);
      if (isMobile) {
        setIsSidebarVisible(false);
      }
  };

  const handleBackToMain = () => {
    setActiveConversation(undefined);
     setIsSidebarVisible(true);
  };
  
  const handleUserUpdate = async (updatedUser: User) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (mongo) {
      const usersCol = mongo.db('chatterbox').collection('users');
      await usersCol.updateOne({ id: updatedUser.id }, { $set: { ...updatedUser } });
    } else {
      // Fallback to API
      await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const mongo = app.currentUser?.mongoClient('mongodb-atlas');
      if (!mongo) return;
      const usersCol = mongo.db('chatterbox').collection('users');
      const convCol = mongo.db('chatterbox').collection('conversations');
      const msgCol = mongo.db('chatterbox').collection('messages');

      // Delete user
      await usersCol.deleteOne({ id: currentUser.id });

      // Find all conversations
      const convs = await convCol.find({ participants: currentUser.id });
      for (const conv of convs) {
        // Delete all messages in conversation
        await msgCol.deleteMany({ conversationId: conv.id });
        // Delete conversation
        await convCol.deleteOne({ id: conv.id });
      }

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });
      localStorage.clear();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const mongo = app.currentUser?.mongoClient('mongodb-atlas');
      if (mongo) {
        const convCol = mongo.db('chatterbox').collection('conversations');
        await convCol.updateOne({ id: conversationId }, { $set: { archived: true } });
      } else {
        await fetch('/api/conversations/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: conversationId, updates: { archived: true } }),
        });
      }
      
      // Update local state
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId ? { ...conv, archived: true } : conv
        )
      );
      
      // If archived conversation is active, switch to next available
      if (activeConversation?.id === conversationId) {
        const nextConversation = conversations.find(c => !c.archived && c.id !== conversationId);
        setActiveConversation(nextConversation);
      }
      
      toast({
        title: 'Chat Archived',
        description: 'The conversation has been moved to archived chats.',
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast({
        title: 'Archive Failed',
        description: 'Failed to archive the conversation. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleClearConversation = async (conversationId: string) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (mongo) {
      const msgCol = mongo.db('chatterbox').collection('messages');
      const convCol = mongo.db('chatterbox').collection('conversations');
      await msgCol.deleteMany({ conversationId });
      await convCol.updateOne({ id: conversationId }, { $set: { lastMessage: 'Chat cleared', timestamp: new Date().toISOString() } });
    } else {
      await fetch('/api/messages/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    // Find the conversation and user to get the name for confirmation
    const conversation = conversations.find(c => c.id === conversationId);
    const otherUserId = conversation?.participants?.find(p => p !== currentUser.id);
    const otherUser = users.find(u => u.id === otherUserId);
    
    // Show confirmation dialog
    setDeleteConfirmation({
      isOpen: true,
      conversationId,
      userName: otherUser?.name || null,
    });
  };

  const confirmDeleteConversation = async () => {
    const conversationId = deleteConfirmation.conversationId;
    if (!conversationId) return;

    try {
      const mongo = app.currentUser?.mongoClient('mongodb-atlas');
      if (mongo) {
        const convCol = mongo.db('chatterbox').collection('conversations');
        const msgCol = mongo.db('chatterbox').collection('messages');
        
        // Delete all messages in the conversation
        await msgCol.deleteMany({ conversationId });
        // Delete the conversation itself
        await convCol.deleteOne({ id: conversationId });
      }
      
      // Update local state - remove the conversation entirely
      setConversations(prevConversations => 
        prevConversations.filter(conv => conv.id !== conversationId)
      );
      
      // If deleted conversation is active, switch to next available
      if (activeConversation?.id === conversationId) {
        const nextConversation = conversations.find(c => c.id !== conversationId && !c.archived);
        setActiveConversation(nextConversation);
      }
      
      toast({
        title: 'Chat Deleted',
        description: 'The conversation has been permanently deleted.',
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the conversation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Close the confirmation dialog
      setDeleteConfirmation({ isOpen: false, conversationId: null, userName: null });
    }
  };

  const handleCreateGroup = async (groupData: { name: string; participants: string[]; avatar?: string; }) => {
    try {
      const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newGroup: Conversation = {
        id: groupId,
        type: 'group',
        name: groupData.name,
        avatar: groupData.avatar || '', // Use a default group avatar if needed
        participants: [currentUser.id, ...groupData.participants],
        lastMessage: 'Group created',
        timestamp: new Date().toISOString(),
        unreadCount: 0,
        archived: false,
        muted: false,
      };

      const mongo = app.currentUser?.mongoClient('mongodb-atlas');
      if (mongo) {
        const convCol = mongo.db('chatterbox').collection('conversations');
        await convCol.insertOne(newGroup);
      }

      // Update local state
      setConversations(prev => [newGroup, ...prev]);
      
      // Select the new group
      setActiveConversation(newGroup);

      toast({
        title: 'Group Created',
        description: `"${groupData.name}" has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Failed to Create Group',
        description: 'There was an error creating the group. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleMute = async (conversationId: string) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const convCol = mongo.db('chatterbox').collection('conversations');
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    const newMutedState = !conv.muted;
    await convCol.updateOne({ id: conversationId }, { $set: { muted: newMutedState } });
    // Fallback API update
    try {
      await fetch('/api/conversations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conversationId, updates: { muted: newMutedState } }),
      });
    } catch {}
    toast({
      title: newMutedState ? 'Conversation Muted' : 'Conversation Unmuted',
      description: `Notifications for "${conv?.name}" have been ${newMutedState ? 'turned off' : 'turned on'}.`,
    });
  };

  const handleAddContact = (userId: string) => {
    const updatedContacts = [...(currentUser.contacts || []), userId];
    handleUserUpdate({ ...currentUser, contacts: updatedContacts });
    const user = users.find(u => u.id === userId);
    toast({
        title: 'Contact Added',
        description: `${user?.name || 'User'} has been added to your contacts.`,
    })
  };

  const handleRemoveContact = (userId: string) => {
    const updatedContacts = (currentUser.contacts || []).filter(id => id !== userId);
    handleUserUpdate({ ...currentUser, contacts: updatedContacts });
    const user = users.find(u => u.id === userId);
    toast({
        title: 'Contact Removed',
        description: `${user?.name || 'User'} has been removed from your contacts.`,
        variant: 'destructive',
    })
  };
  
  const openChatThemeSettings = () => {
    setSettingsView('chats');
    setIsSettingsOpen(true);
  };

  // Call handling logic
  const handleInitiateCall = async (conversation: Conversation, type: 'audio' | 'video') => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const callsCol = mongo.db('chatterbox').collection('calls');
    const otherUserId = conversation.participants.find(p => p !== currentUser.id);
    if (!otherUserId) return;
    const otherUser = users.find(u => u.id === otherUserId);
    if (!otherUser) return;
    const callData = {
      id: conversation.id,
      type,
      from: currentUser,
      to: otherUser,
      status: 'ringing',
      startedAt: Date.now(),
      participants: [currentUser.id, otherUser.id],
    };
    await callsCol.insertOne({ ...callData, id: otherUser.id });
    await callsCol.insertOne({ ...callData, id: currentUser.id });
  };

  const handleAcceptCall = async (call: any) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const callsCol = mongo.db('chatterbox').collection('calls');
    const updatedCall = { ...call, status: 'connected' };
    await callsCol.updateOne({ id: call.to.id }, { $set: updatedCall });
    await callsCol.updateOne({ id: call.from.id }, { $set: updatedCall });
  };

  const handleRejectCall = async (call: any) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const callsCol = mongo.db('chatterbox').collection('calls');
    const updatedCall = { ...call, status: 'rejected' };
    await callsCol.updateOne({ id: call.from.id }, { $set: updatedCall });
  };

  const handleEndCall = async (call: any) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const callsCol = mongo.db('chatterbox').collection('calls');
    const status = call.status === 'ringing' ? 'unanswered' : 'ended';
    const updatedCall = { ...call, status };
    await callsCol.updateOne({ id: call.from.id }, { $set: updatedCall });
    await callsCol.updateOne({ id: call.to.id }, { $set: updatedCall });
  };

  const handleUpdateGroup = async (conversationId: string, updates: { name?: string; avatar?: string; participants?: string[]; }) => {
    try {
      const mongo = app.currentUser?.mongoClient('mongodb-atlas');
      if (mongo) {
        const convCol = mongo.db('chatterbox').collection('conversations');
        await convCol.updateOne({ id: conversationId }, { $set: updates });
      }
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, ...updates } : conv
        )
      );
      
      // Update active conversation if it's the one being updated
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => prev ? { ...prev, ...updates } : prev);
      }

      toast({
        title: 'Group Updated',
        description: 'The group has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update the group. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveGroup = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const updatedParticipants = conversation.participants.filter(id => id !== currentUser.id);
      
      const mongo = app.currentUser?.mongoClient('mongodb-atlas');
      if (mongo) {
        const convCol = mongo.db('chatterbox').collection('conversations');
        await convCol.updateOne({ id: conversationId }, { 
          $set: { 
            participants: updatedParticipants,
            lastMessage: `${currentUser.name} left the group`,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Clear active conversation if it was the group we left
      if (activeConversation?.id === conversationId) {
        setActiveConversation(undefined);
      }

      toast({
        title: 'Left Group',
        description: 'You have left the group.',
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Leave Failed',
        description: 'Failed to leave the group. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGroup = async (conversationId: string) => {
    try {
      const mongo = app.currentUser?.mongoClient('mongodb-atlas');
      if (mongo) {
        const convCol = mongo.db('chatterbox').collection('conversations');
        const msgCol = mongo.db('chatterbox').collection('messages');
        
        // Delete all messages in the group
        await msgCol.deleteMany({ conversationId });
        // Delete the group
        await convCol.deleteOne({ id: conversationId });
      }
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Clear active conversation if it was the group we deleted
      if (activeConversation?.id === conversationId) {
        setActiveConversation(undefined);
      }

      toast({
        title: 'Group Deleted',
        description: 'The group has been permanently deleted.',
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the group. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const activeChat = activeConversation ? (
    <Chat
      key={activeConversation.id}
      conversation={activeConversation}
      currentUser={currentUser}
      users={users}
      onBack={() => setIsSidebarVisible(true)}
      onUserUpdate={handleUserUpdate}
      onAddContact={handleAddContact}
      onRemoveContact={handleRemoveContact}
      onToggleMute={handleToggleMute}
      onOpenChatThemeSettings={openChatThemeSettings}
      onClearChat={handleClearConversation}
      onInitiateCall={handleInitiateCall}
      onUpdateGroup={handleUpdateGroup}
      onLeaveGroup={handleLeaveGroup}
      onDeleteGroup={handleDeleteGroup}
    />
  ) : (
    <div className={cn(
      isMobile ? "flex flex-1 flex-col items-center justify-center h-full text-center bg-card" : "hidden md:flex flex-1 flex-col items-center justify-center h-full text-center bg-card"
    )}>
      <MessageSquare className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold mt-4">Select a conversation</h1>
      <p className="text-muted-foreground">
        Choose a user from the list to start chatting.
      </p>
    </div>
  );

  const wallpaperUrl = currentUser.chatSettings?.wallpaper;
  const wallpaperStyle = wallpaperUrl && wallpaperUrl !== 'default' ? { backgroundImage: `url(${wallpaperUrl})` } : {};

  return (
    <>
      <div className={cn(
        "relative flex h-screen w-full",
        isMobile ? "flex-col" : ""
      )}>
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={wallpaperStyle}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
        <div className={cn(
          "relative border-r bg-sidebar/80 backdrop-blur-md z-10",
          isMobile ? (isSidebarVisible ? "flex flex-col w-full h-full" : "hidden") : "md:flex md:flex-col md:w-[350px] lg:w-[400px] h-full"
        )}>
          <UserList
            conversations={conversations}
            onConversationSelect={handleConversationSelect}
            activeConversation={activeConversation}
            users={users.filter(u => u.id !== currentUser.id)}
            currentUser={currentUser}
            onDeleteConversation={handleDeleteConversation}
            onArchiveConversation={handleArchiveConversation}
            onRemoveContact={handleRemoveContact}
            onAddContact={handleAddContact}
            onBackToMain={handleBackToMain}
            onSettingsClick={() => {
              setSettingsView('main');
              setIsSettingsOpen(true);
            }}
            // Help/tutorial entry removed
            onCreateGroup={handleCreateGroup}
            isMobile={isMobile}
          />
        </div>
        <div className={cn(
          "relative flex-1 flex-col bg-background/50 backdrop-blur-sm z-10",
          isMobile ? (isSidebarVisible ? "hidden" : "flex w-full h-full") : (isSidebarVisible && isMobile ? "hidden" : "flex")
        )}>
          {activeChat}
        </div>
      </div>
      {activeCall && (
        <CallDialog 
          call={activeCall}
          currentUser={currentUser}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEnd={handleEndCall}
        />
      )}
      <SettingsSheet
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUser={currentUser}
          onProfileUpdate={handleUserUpdate}
          onDeleteAccount={handleDeleteAccount}
          initialView={settingsView}
      />
      <DeleteConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, conversationId: null, userName: null })}
          onConfirm={confirmDeleteConversation}
          userName={deleteConfirmation.userName || undefined}
      />
    </>
  );
}

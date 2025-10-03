
'use client';

import type { User, Conversation } from '@/lib/types';
import type { Call } from '@/lib/webrtc';
import { useState, useEffect } from 'react';
import UserList from './user-list';
import Chat from './chat';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import SettingsSheet from './settings-sheet';
import { useRouter } from 'next/navigation';
import CallDialog from './call-dialog';
import { app } from '@/lib/realm';

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
  const { toast } = useToast();
  const router = useRouter();
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!currentUser.id) return;
    let cancelled = false;

    async function fetchAll() {
      try {
        // Fetch users via server API (works without Realm)
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersList = await usersRes.json();
          if (!cancelled) setUsers(usersList);
        }

        // If Realm mongo client available, fetch current user, conversations and calls (faster/real-time later)
        const mongo = app.currentUser?.mongoClient('mongodb-atlas');
        if (mongo) {
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
            setConversations(convsList);
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
          if (callDoc && !cancelled) {
            setActiveCall(callDoc);
          } else if (!callDoc && !cancelled) {
            setActiveCall(null);
          }
        }
      } catch (err) {
        console.error('Error fetching chat data:', err);
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 3000); // Poll every 3s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser.id, activeConversation]);


  const handleConversationSelect = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    if (window.innerWidth < 768) {
      setIsSidebarVisible(false);
    }
  };

  const handleBackToMain = () => {
    setActiveConversation(undefined);
    setIsSidebarVisible(true);
  };
  
  const handleUserUpdate = async (updatedUser: User) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const usersCol = mongo.db('chatterbox').collection('users');
    await usersCol.updateOne({ id: updatedUser.id }, { $set: { ...updatedUser } });
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
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const convCol = mongo.db('chatterbox').collection('conversations');
    await convCol.updateOne({ id: conversationId }, { $set: { archived: true } });
    if (activeConversation?.id === conversationId) {
      const nextConversation = conversations.find(c => !c.archived && c.id !== conversationId);
      setActiveConversation(nextConversation);
    }
  };
  
  const handleClearConversation = async (conversationId: string) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const msgCol = mongo.db('chatterbox').collection('messages');
    const convCol = mongo.db('chatterbox').collection('conversations');
    await msgCol.deleteMany({ conversationId });
    await convCol.updateOne({ id: conversationId }, { $set: { lastMessage: 'Chat cleared', timestamp: new Date().toISOString() } });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const mongo = app.currentUser?.mongoClient('mongodb-atlas');
    if (!mongo) return;
    const convCol = mongo.db('chatterbox').collection('conversations');
    await convCol.deleteOne({ id: conversationId });
    if (activeConversation?.id === conversationId) {
      const nextConversation = conversations.find(c => c.id !== conversationId && !c.archived);
      setActiveConversation(nextConversation);
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
      />
    ) : (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center h-full text-center bg-card">
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
      <div className="relative flex h-screen w-full">
          <div 
            className="absolute inset-0 bg-cover bg-center z-0" 
            style={wallpaperStyle}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          </div>
          <div className={cn(
              "relative md:flex md:flex-col md:w-[350px] lg:w-[400px] border-r bg-sidebar/80 backdrop-blur-md z-10",
              isSidebarVisible ? "flex flex-col w-full" : "hidden"
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
              />
          </div>
          <div className={cn(
              "relative flex-1 flex-col bg-background/50 backdrop-blur-sm z-10",
              isSidebarVisible && window.innerWidth < 768 ? "hidden" : "flex"
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
    </>
  );
}

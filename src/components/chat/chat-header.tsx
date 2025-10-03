
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { Conversation, User } from '@/lib/types';
import { MoreVertical, Phone, Video, ArrowLeft, UserX, UserCheck, UserPlus, Search, BellOff, Contact, Bell, Paintbrush, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ChatSearch from './chat-search';
import ClearChatDialog from './clear-chat-dialog';

type ChatHeaderProps = {
  conversation: Conversation;
  isOnline: boolean;
  typingUsers: string[];
  onBack: () => void;
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
  onAddContact: (userId: string) => void;
  onRemoveContact: (userId: string) => void;
  onToggleMute: (conversationId: string) => void;
  currentUser: User;
  onSearch: (query: string) => void;
  onOpenChatThemeSettings: () => void;
  onClearChat: (conversationId: string) => void;
  onInitiateCall: (conversation: Conversation, type: 'audio' | 'video') => void;
  onOpenGroupSettings?: () => void;
  users?: User[];
};

export default function ChatHeader({
  conversation,
  isOnline,
  typingUsers,
  onBack,
  onBlock,
  onUnblock,
  onAddContact,
  onRemoveContact,
  onToggleMute,
  currentUser,
  onSearch,
  onOpenGroupSettings,
  users = [],
  onOpenChatThemeSettings,
  onClearChat,
  onInitiateCall,
}: ChatHeaderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isClearChatOpen, setIsClearChatOpen] = useState(false);
  const otherUserId = conversation.participants.find(p => p !== currentUser.id);
  const isBlocked = otherUserId ? currentUser.blockedUsers?.includes(otherUserId) : false;
  const isContact = otherUserId ? currentUser.contacts?.includes(otherUserId) : true;
  const isMuted = conversation.muted;

  const getSubtext = () => {
    if (conversation.type === 'group') {
      if (typingUsers.length > 0) {
        const typingUserNames = typingUsers.map(userId => {
          const user = users.find(u => u.id === userId);
          return user?.name || 'Someone';
        }).join(', ');
        return `${typingUserNames} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`;
      }
      return `${conversation.participants.length} member${conversation.participants.length !== 1 ? 's' : ''}`;
    }
    
    // Private chat logic
    if (isBlocked) {
      return <Badge variant="destructive" className="text-xs">Blocked</Badge>;
    }
    if (typingUsers.length > 0) {
      return 'typing...';
    }
    if (!isOnline) {
      return <Badge variant="destructive" className="text-xs">Offline</Badge>;
    }
    return 'Online';
  };
  
  const handleBlockToggle = () => {
    if (!otherUserId) return;
    if (isBlocked) {
      onUnblock(otherUserId);
    } else {
      onBlock(otherUserId);
    }
  }

  const handleAddContact = () => {
      if (!otherUserId) return;
      onAddContact(otherUserId);
  }

  const handleRemoveContact = () => {
    if (!otherUserId) return;
    onRemoveContact(otherUserId);
  }

  const handleToggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      onSearch(''); // Clear search when closing
    }
  }
  
  const handleConfirmClearChat = () => {
    onClearChat(conversation.id);
    setIsClearChatOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-4 p-3 border-b bg-card/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.avatar} alt={conversation.name} />
          <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{conversation.name}</h2>
          <div className="text-sm text-muted-foreground h-5 flex items-center">
            {getSubtext()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onInitiateCall(conversation, 'audio')} disabled={isBlocked}>
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onInitiateCall(conversation, 'video')} disabled={isBlocked}>
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
               <DropdownMenuItem onClick={handleToggleSearch}>
                <Search className="mr-2 h-4 w-4" /> Search
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleMute(conversation.id)}>
                {isMuted ? (
                  <>
                    <Bell className="mr-2 h-4 w-4" /> Unmute notifications
                  </>
                ) : (
                  <>
                    <BellOff className="mr-2 h-4 w-4" /> Mute notifications
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenChatThemeSettings}>
                <Paintbrush className="mr-2 h-4 w-4" /> Chat theme
              </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setIsClearChatOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear chat
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />

              {conversation.type === 'group' && onOpenGroupSettings && (
                <DropdownMenuItem onClick={onOpenGroupSettings}>
                  <Contact className="mr-2 h-4 w-4" /> Group info
                </DropdownMenuItem>
              )}

              {conversation.type === 'private' && !isContact && (
                 <DropdownMenuItem onClick={handleAddContact}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add to contacts
                 </DropdownMenuItem>
              )}
               {conversation.type === 'private' && isContact && (
                 <DropdownMenuItem onClick={handleRemoveContact} className="text-destructive">
                    <UserX className="mr-2 h-4 w-4" /> Remove from contacts
                 </DropdownMenuItem>
              )}
              {conversation.type === 'private' && (
                <DropdownMenuItem onClick={handleBlockToggle}>
                  {isBlocked ? (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" /> Unblock
                    </>
                  ) : (
                    <>
                      <UserX className="mr-2 h-4 w-4" /> Block
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isSearching && (
        <ChatSearch onSearchChange={onSearch} onClose={handleToggleSearch} />
      )}
      <ClearChatDialog
        isOpen={isClearChatOpen}
        onClose={() => setIsClearChatOpen(false)}
        onConfirm={handleConfirmClearChat}
      />
    </>
  );
}

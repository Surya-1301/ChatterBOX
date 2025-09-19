
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Conversation, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Search, User as UserIcon, MoreHorizontal, Archive, Trash2, UserPlus, MessageSquare, UserX, BellOff, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import UserProfile from './user-profile';
import { ScrollArea } from '../ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type UserListProps = {
  conversations: Conversation[];
  activeConversation: Conversation | undefined;
  onConversationSelect: (conversation: Conversation) => void;
  users: User[];
  currentUser: User;
  onDeleteConversation: (conversationId: string) => void;
  onArchiveConversation: (conversationId: string) => void;
  onRemoveContact: (userId: string) => void;
  onBackToMain: () => void;
  onSettingsClick: () => void;
};

function genConvId(userId1: string, userId2: string) {
    const sortedIds = [userId1, userId2].sort();
    return `private-${sortedIds[0]}-${sortedIds[1]}`;
}

export default function UserList({
  conversations,
  onConversationSelect,
  activeConversation,
  users,
  currentUser,
  onDeleteConversation,
  onArchiveConversation,
  onRemoveContact,
  onBackToMain,
  onSettingsClick,
}: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  
  const filteredConversations = useMemo(() => {
    const convs = conversations.filter(c => c.participants.includes(currentUser.id) && !c.archived);
    if (!searchTerm) {
        return convs.sort((a,b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
    }
    return convs.filter((conv) =>
      conv.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
  }, [conversations, searchTerm, currentUser.id]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return users.filter(user => 
        (user.username.toLowerCase().includes(lowerCaseSearchTerm) || user.name.toLowerCase().includes(lowerCaseSearchTerm) || user.email.toLowerCase().includes(lowerCaseSearchTerm)) 
        && user.id !== currentUser.id
    );
  }, [searchTerm, currentUser.id, users]);

  const contacts = useMemo(() => {
    return users.filter(user => currentUser.contacts?.includes(user.id));
  }, [users, currentUser.contacts]);

  const handleUserSelect = (user: User) => {
    const convId = genConvId(currentUser.id, user.id);
    const existingConversation = conversations.find(c => c.id === convId);

    if (existingConversation) {
        onConversationSelect(existingConversation);
    } else {
        const newConversation: Conversation = {
            id: convId,
            type: 'private',
            name: user.name,
            avatar: user.avatar,
            participants: [currentUser.id, user.id],
            lastMessage: `Started a conversation with ${user.name}`,
        };
        onConversationSelect(newConversation);
    }
    setSearchTerm('');
    setActiveTab('chats');
  };

  const handleAddContact = (userId: string) => {
    // This is a placeholder, the actual implementation is in chat-layout
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term) {
      setActiveTab('search');
    } else if (activeTab === 'search') {
      setActiveTab('chats');
    }
  };

  const handleTabChange = (value: string) => {
    setSearchTerm('');
    setActiveTab(value);
  }

  const renderContent = () => {
    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-4">
            <TabsTrigger value="chats" className="data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground">Chats</TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground">Contacts</TabsTrigger>
        </TabsList>
        <TabsContent value="chats" className="m-0">
          {filteredConversations.map((conv) => (
            <div key={conv.id} className="relative flex items-center group">
              <button
                  onClick={() => onConversationSelect(conv)}
                  className={cn(
                  'flex w-full items-center gap-3 p-3 transition-colors text-sidebar-foreground border-b border-sidebar-border',
                  activeConversation?.id === conv.id
                      ? 'bg-sidebar-accent'
                      : 'hover:bg-sidebar-accent/50'
                  )}
              >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.avatar} alt={conv.name} />
                    <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="font-semibold truncate">{conv.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end text-xs text-muted-foreground shrink-0">
                  {conv.timestamp && (
                      <p>
                      {formatDistanceToNow(new Date(conv.timestamp as string), {
                          addSuffix: true,
                      })}
                      </p>
                  )}
                  <div className='flex items-center gap-1 mt-1'>
                    {conv.muted && <BellOff className='h-3 w-3' />}
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                        <Badge className="bg-primary text-primary-foreground">
                        {conv.unreadCount}
                        </Badge>
                    ) : null}
                  </div>
                  </div>
              </button>
              <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onArchiveConversation(conv.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteConversation(conv.id)} className="text-destructive">
                       <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && (
              <div className="text-center text-muted-foreground p-8">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-semibold">No conversations yet.</p>
                  <p className="text-sm">Use the search bar to find people and start chatting.</p>
              </div>
          )}
        </TabsContent>
        <TabsContent value="contacts" className="m-0">
           {contacts.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border-b border-sidebar-border">
                  <div className='flex items-center gap-3 flex-1 overflow-hidden'>
                      <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left overflow-hidden">
                          <p className="font-semibold truncate text-sidebar-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      </div>
                  </div>
                  <div className='flex items-center'>
                    <Button variant="ghost" size="icon" onClick={() => handleUserSelect(user)} className="text-primary hover:text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRemoveContact(user.id)} className="text-destructive">
                          <UserX className="mr-2 h-4 w-4" />
                          Remove contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
              </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
                  <Users className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-semibold">No contacts yet.</p>
                  <p className="text-sm">Add contacts to see them here.</p>
              </div>
          )}
        </TabsContent>
        <TabsContent value="search" className="m-0">
          {searchResults.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border-b border-sidebar-border">
              <div className='flex items-center gap-3'>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-semibold truncate text-sidebar-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!currentUser.contacts?.includes(user.id) ? (
                  <Button variant="outline" size="sm" onClick={() => handleAddContact(user.id)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => handleUserSelect(user)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
              </div>
            </div>
          ))}
          {searchResults.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
              <p>No users found for "{searchTerm}".</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-4 border-b border-sidebar-border">
         <div className="flex items-center justify-between">
             <h1 className="text-xl font-bold tracking-tight text-sidebar-foreground">
                ChatterBox
            </h1>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9 bg-sidebar-accent border-none focus-visible:ring-sidebar-ring"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {renderContent()}
      </ScrollArea>
      
      <div className="p-2 border-t border-sidebar-border">
        <UserProfile currentUser={currentUser} onSettingsClick={onSettingsClick} />
      </div>
    </div>
  );
}

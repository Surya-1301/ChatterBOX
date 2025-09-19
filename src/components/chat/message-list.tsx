
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message, User, Conversation } from '@/lib/types';
import { useEffect, useRef } from 'react';
import MessageBubble from './message-bubble';
import { Search } from 'lucide-react';

type MessageListProps = {
  messages: Message[];
  currentUser: User;
  users: User[];
  conversation: Conversation;
  searchQuery?: string;
};

export default function MessageList({
  messages,
  currentUser,
  users,
  conversation,
  searchQuery
}: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  const allUsers = [...users, currentUser];
  
  const recipient = conversation.type === 'private' 
    ? allUsers.find(u => u.id === conversation.participants.find(pId => pId !== currentUser.id))
    : undefined;
    
  if (searchQuery && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center bg-card/50 backdrop-blur-sm">
        <Search className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold mt-4">No results found</h2>
        <p className="text-muted-foreground">
          Try a different search term.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1" viewportRef={viewportRef}>
      <div className="p-4 space-y-2">
        {messages.map((message) => {
            const sender = allUsers.find(u => u.id === message.from);
            return (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={message.from === currentUser.id}
                sender={sender}
                recipient={recipient}
              />
            )
        })}
      </div>
    </ScrollArea>
  );
}

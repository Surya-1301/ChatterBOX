
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message, User } from '@/lib/types';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, File as FileIcon, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import AudioPlayer from './audio-player';

type MessageBubbleProps = {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
  recipient?: User;
};


export default function MessageBubble({
  message,
  isOwnMessage,
  sender,
  recipient,
}: MessageBubbleProps) {
  const getStatusIcon = () => {
    if (!isOwnMessage) return null;
    
    // Respect recipient's read receipt setting
    const allowReadReceipts = recipient?.privacySettings?.readReceipts !== false;
    const isRead = message.readBy && message.readBy.length > 1;

    if (isRead && allowReadReceipts) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }

    const isDelivered = message.deliveredTo && message.deliveredTo.length > 1;
    if (isDelivered) {
      return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
    }
    if (message.isOffline) {
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground" />;
  };

  const isAudioMessage = message.fileUrl && message.fileName?.endsWith('.webm');

  if (message.from === 'system') {
    return (
      <div className="flex justify-center text-xs text-muted-foreground my-2">
        <p className="px-3 py-1 bg-secondary rounded-lg shadow-sm">{message.content}</p>
      </div>
    );
  }
  
  const getMessageTime = () => {
    if (!message.timestamp) return '';
  const date = new Date(message.timestamp);
    return format(date, 'h:mm a');
  }

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isOwnMessage && sender && !isAudioMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} />
          <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
       {!isOwnMessage && !sender && !isAudioMessage && (
        <Avatar className="h-8 w-8">
          <AvatarFallback><UserIcon size={16} /></AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-md lg:max-w-xl rounded-lg shadow-sm',
           isAudioMessage ? 'p-2' : 'px-3 py-2',
          isOwnMessage
            ? 'bg-sent-bubble text-sent-bubble-foreground'
            : 'bg-card text-card-foreground'
        )}
      >
        {!isOwnMessage && sender && !isAudioMessage && (
          <p className="text-sm font-semibold mb-1 text-primary">{sender.name}</p>
        )}
        {message.imageUrl && (
            <div className="my-2">
                <Image
                    src={message.imageUrl}
                    alt={message.fileName || 'Image attachment'}
                    width={300}
                    height={200}
                    className="rounded-lg object-cover"
                    data-ai-hint="office desk"
                />
            </div>
        )}
        {isAudioMessage ? (
          <AudioPlayer 
            fileUrl={message.fileUrl!}
            waveform={message.audioWaveform}
            sender={sender}
            isOwnMessage={isOwnMessage}
          />
        ) : message.fileUrl && (
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 my-2 text-primary hover:underline">
                <FileIcon className="h-5 w-5" />
                <span>{message.fileName || 'Download file'}</span>
            </a>
        )}
        {message.content && <p className="whitespace-pre-wrap text-sm">{message.content}</p>}
        <div className={cn(
          "flex items-center gap-2 mt-1",
          isAudioMessage ? 'justify-end' : 'justify-end'
        )}>
          <p className="text-xs text-muted-foreground/70">
            {getMessageTime()}
          </p>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
}


'use client';

import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { HelpCircle } from 'lucide-react';

type UserProfileProps = {
  currentUser: User;
  onSettingsClick: () => void;
  onHelpClick?: () => void;
};

export default function UserProfile({ currentUser, onSettingsClick, onHelpClick }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between p-2">
      <Button
        variant="ghost"
        onClick={onSettingsClick}
        className="flex items-center gap-3 text-left p-2 rounded-md flex-1 justify-start h-auto"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="font-semibold truncate flex-1">{currentUser.name}</div>
      </Button>
      {onHelpClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onHelpClick}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Swipe gestures help"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

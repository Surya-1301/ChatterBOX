
'use client';

import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';

type UserProfileProps = {
  currentUser: User;
  onSettingsClick: () => void;
};

export default function UserProfile({ currentUser, onSettingsClick }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between p-2">
      <Button
        variant="ghost"
        onClick={onSettingsClick}
        className="flex items-center gap-3 text-left p-2 rounded-md w-full justify-start h-auto"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="font-semibold truncate flex-1">{currentUser.name}</div>
      </Button>
    </div>
  );
}

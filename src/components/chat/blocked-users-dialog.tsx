
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { UserX } from 'lucide-react';

type BlockedUsersDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  blockedUsers: User[];
  onUnblockUser: (userId: string) => void;
};

export default function BlockedUsersDialog({
  isOpen,
  onClose,
  blockedUsers,
  onUnblockUser,
}: BlockedUsersDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blocked Contacts</DialogTitle>
          <DialogDescription>
            Blocked contacts will no longer be able to call you or send you messages.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-60 pr-4">
          {blockedUsers.length > 0 ? (
            <div className="space-y-2">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => onUnblockUser(user.id)}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <UserX className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4">You haven't blocked any contacts.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

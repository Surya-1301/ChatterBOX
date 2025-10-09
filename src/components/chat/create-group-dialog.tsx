import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Users, X, Camera, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, Conversation } from '@/lib/types';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: {
    name: string;
    participants: string[];
    avatar?: string;
  }) => void;
  users: User[];
  currentUser: User;
}

export default function CreateGroupDialog({
  isOpen,
  onClose,
  onCreateGroup,
  users,
  currentUser,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.id !== currentUser.id &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, currentUser.id, searchTerm]);

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.size < 2) return;

    setIsCreating(true);
    try {
      await onCreateGroup({
        name: groupName.trim(),
        participants: Array.from(selectedUsers),
        avatar: groupAvatar || undefined,
      });
      
      // Reset form
      setGroupName('');
      setSelectedUsers(new Set());
      setSearchTerm('');
      setGroupAvatar('');
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGroupAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedUsersList = Array.from(selectedUsers).map(userId => 
    users.find(user => user.id === userId)
  ).filter(Boolean) as User[];

  const canCreate = groupName.trim().length > 0 && selectedUsers.size >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Group
          </DialogTitle>
          <DialogDescription>
            Add participants to create a group chat. You need at least 2 people to start a group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {groupAvatar ? (
                  <AvatarImage src={groupAvatar} alt="Group avatar" />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-3 w-3" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <div className="flex-1">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {groupName.length}/50 characters
              </p>
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsersList.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Participants ({selectedUsersList.length})</Label>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {selectedUsersList.map(user => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{user.name}</span>
                    <button
                      onClick={() => handleUserToggle(user.id)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Users */}
          <div className="space-y-2">
            <Label>Add Participants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <ScrollArea className="h-48 border rounded-md">
            <div className="p-2 space-y-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                    {user.status === 'online' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No users found' : 'No users available'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={!canCreate || isCreating}
            className="min-w-24"
          >
            {isCreating ? 'Creating...' : `Create Group`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
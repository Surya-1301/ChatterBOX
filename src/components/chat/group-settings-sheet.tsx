import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Settings,
  UserPlus,
  Crown,
  Shield,
  UserMinus,
  Camera,
  Edit3,
  Trash2,
  MoreVertical,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, Conversation } from '@/lib/types';

interface GroupSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  users: User[];
  currentUser: User;
  onUpdateGroup: (updates: {
    name?: string;
    avatar?: string;
    participants?: string[];
  }) => void;
  onLeaveGroup: () => void;
  onDeleteGroup?: () => void;
  onAddUsers: (userIds: string[]) => void;
  onRemoveUser: (userId: string) => void;
  isGroupAdmin?: boolean;
}

export default function GroupSettingsSheet({
  isOpen,
  onClose,
  conversation,
  users,
  currentUser,
  onUpdateGroup,
  onLeaveGroup,
  onDeleteGroup,
  onAddUsers,
  onRemoveUser,
  isGroupAdmin = false,
}: GroupSettingsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(conversation.name);
  const [showAddUsers, setShowAddUsers] = useState(false);

  const groupMembers = users.filter(user => 
    conversation.participants.includes(user.id)
  );

  const availableUsers = users.filter(user => 
    !conversation.participants.includes(user.id) && user.id !== currentUser.id
  );

  const handleSaveName = () => {
    if (editedName.trim() !== conversation.name) {
      onUpdateGroup({ name: editedName.trim() });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && isGroupAdmin) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onUpdateGroup({ avatar: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Info
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Group Avatar and Name */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24">
                <AvatarImage src={conversation.avatar} alt={conversation.name} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  <Users className="h-12 w-12 text-primary" />
                </AvatarFallback>
              </Avatar>
              {isGroupAdmin && (
                <label
                  htmlFor="group-avatar-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="group-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 max-w-xs mx-auto">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setEditedName(conversation.name);
                      setIsEditing(false);
                    }
                  }}
                  maxLength={50}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveName}>
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditedName(conversation.name);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-semibold">{conversation.name}</h2>
                  {isGroupAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Group Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Members</Label>
              {isGroupAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddUsers(true)}
                  className="flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4" />
                  Add
                </Button>
              )}
            </div>

            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {member.id === currentUser.id && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                        {/* Add admin badge logic here if needed */}
                      </div>
                      <p className="text-sm text-muted-foreground">@{member.username}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {member.status === 'online' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                      {isGroupAdmin && member.id !== currentUser.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onRemoveUser(member.id)}
                              className="text-destructive"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remove from group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Group Actions */}
          <div className="space-y-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave &quot;{conversation.name}&quot;? You won&apos;t be able to see new messages unless someone adds you back.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onLeaveGroup} className="bg-destructive hover:bg-destructive/90">
                    Leave Group
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {isGroupAdmin && onDeleteGroup && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Group
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Group</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete &quot;{conversation.name}&quot;? This will remove the group for all members and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteGroup} className="bg-destructive hover:bg-destructive/90">
                      Delete Group
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Add Users Dialog */}
        {showAddUsers && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Add Members</h3>
              <ScrollArea className="max-h-48 mb-4">
                <div className="space-y-2">
                  {availableUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => {
                        onAddUsers([user.id]);
                        setShowAddUsers(false);
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddUsers(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
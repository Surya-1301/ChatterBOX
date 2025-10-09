

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { KeyRound, Lock, MessageSquare, Bell, HelpCircle, ArrowLeft, Trash2, Mail, User as UserIcon, ShieldQuestion, FileText } from 'lucide-react';
import EditProfileForm from './edit-profile-form';
import { useState, useEffect } from 'react';
import DeleteAccountDialog from './delete-account-dialog';
import ChangeEmailForm from './change-email-form';
import ChangeUsernameForm from './change-username-form';
import PrivacySettingsForm from './privacy-settings-form';
import ChatSettingsForm from './chat-settings-form';
import { useRouter } from 'next/navigation';
import NotificationSettingsForm from './notification-settings-form';

type SettingsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onProfileUpdate: (updatedUser: User) => void;
  onDeleteAccount: () => void;
  initialView?: SettingsView;
};

type SettingsView = 'main' | 'profile' | 'account' | 'privacy' | 'chats' | 'notifications' | 'help';

export default function SettingsSheet({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdate,
  onDeleteAccount,
  initialView = 'main',
}: SettingsSheetProps) {
  const [view, setView] = useState<SettingsView>(initialView);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const router = useRouter();


  useEffect(() => {
    if (isOpen) {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      setAllUsers(users);
      setView(initialView);
    }
  }, [isOpen, initialView]);

  const handleProfileUpdate = (updatedUser: User) => {
    onProfileUpdate(updatedUser);
  };
  
  const resetViewAndClose = () => {
    setView('main');
    onClose();
  }

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  const handleAccountDelete = () => {
    onDeleteAccount();
    resetViewAndClose();
  };

  const handleEmailUpdate = (updatedUser: User) => {
    onProfileUpdate(updatedUser);
    setIsChangeEmailOpen(false);
  };

  const handleUsernameUpdate = (updatedUser: User) => {
    onProfileUpdate(updatedUser);
    setIsChangeUsernameOpen(false);
  };

  const menuItems = [
    { icon: KeyRound, label: 'Account', description: 'Security notifications, account info', action: () => setView('account') },
    { icon: Lock, label: 'Privacy', description: 'Control who sees your info', action: () => setView('privacy') },
    { icon: MessageSquare, label: 'Chats', description: 'Theme, wallpaper, chat settings', action: () => setView('chats') },
    { icon: Bell, label: 'Notifications', description: 'Message notifications', action: () => setView('notifications') },
    { icon: HelpCircle, label: 'Help', description: 'Help center, contact us, privacy policy', action: () => setView('help') },
  ];

  const getTitle = () => {
    switch(view) {
        case 'profile': return 'Edit Profile';
        case 'account': return 'Account';
        case 'privacy': return 'Privacy';
        case 'chats': return 'Chats';
        case 'notifications': return 'Notifications';
        case 'help': return 'Help';
        default: return 'Settings';
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={resetViewAndClose}>
        <SheetContent side="left" className="p-0 w-full md:w-[420px] flex flex-col">
          <SheetHeader className="p-4 bg-secondary">
            <SheetTitle className="flex items-center gap-4 text-lg font-semibold">
              {view !== 'main' ? (
                  <>
                      <Button variant="ghost" size="icon" onClick={() => setView('main')} className='h-9 w-9'>
                          <ArrowLeft />
                      </Button>
                      {getTitle()}
                  </>
              ) : (
                getTitle()
              )}
            </SheetTitle>
          </SheetHeader>

          {view === 'main' ? (
            <div className="flex flex-col flex-1">
              <button onClick={() => setView('profile')} className="flex items-center gap-4 p-4 hover:bg-accent transition-colors">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{currentUser.name}</p>
                  <p className="text-muted-foreground text-sm text-left">{currentUser.about || 'Available'}</p>
                </div>
              </button>
              <div className="flex-1 overflow-y-auto">
                {menuItems.map((item, index) => (
                  <button key={index} onClick={item.action} className="flex items-center gap-6 p-4 w-full text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:hover:bg-transparent" disabled={!item.action}>
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p>{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t">
                <button onClick={handleLogout} className="flex items-center gap-6 p-2 w-full text-left hover:bg-accent transition-colors rounded-md">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <p>Log out</p>
                </button>
              </div>
            </div>
          ) : view === 'profile' ? (
            <div className="p-6 overflow-y-auto">
              <EditProfileForm currentUser={currentUser} onSave={handleProfileUpdate} />
            </div>
          ) : view === 'account' ? (
            <div className="p-4 space-y-1">
                <div className="flex items-center gap-6 p-4 rounded-md">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <div className='flex-1'>
                        <p>Username</p>
                        <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsChangeUsernameOpen(true)}>Change</Button>
                </div>
                <div className="flex items-center gap-6 p-4 rounded-md">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div className='flex-1'>
                        <p>Email address</p>
                        <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsChangeEmailOpen(true)}>Change</Button>
                </div>
              <button onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center gap-6 p-4 w-full text-left hover:bg-accent transition-colors rounded-md text-destructive">
                  <Trash2 className="h-5 w-5" />
                  <div>
                    <p>Delete my account</p>
                    <p className="text-sm">This will permanently delete your account and all your data.</p>
                  </div>
              </button>
            </div>
          ) : view === 'privacy' ? (
             <div className="p-6 overflow-y-auto">
              <PrivacySettingsForm currentUser={currentUser} onSave={handleProfileUpdate} allUsers={allUsers} />
            </div>
          ) : view === 'chats' ? (
            <div className="p-6 overflow-y-auto">
              <ChatSettingsForm currentUser={currentUser} onSave={handleProfileUpdate} />
            </div>
          ) : view === 'notifications' ? (
            <div className="p-6 overflow-y-auto">
                <NotificationSettingsForm currentUser={currentUser} onSave={handleProfileUpdate} />
            </div>
          ) : view === 'help' ? (
            <div className="p-4 space-y-1">
              <button onClick={() => router.push('/privacy')} className="flex items-center gap-6 p-4 w-full text-left hover:bg-accent transition-colors rounded-md">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p>Privacy Policy</p>
                    <p className="text-sm text-muted-foreground">Read our privacy policy.</p>
                  </div>
              </button>
              <button onClick={() => router.push('/contact')} className="flex items-center gap-6 p-4 w-full text-left hover:bg-accent transition-colors rounded-md">
                  <ShieldQuestion className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p>Contact Us</p>
                    <p className="text-sm text-muted-foreground">Get in touch with us.</p>
                  </div>
              </button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
      <DeleteAccountDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleAccountDelete}
      />
      <ChangeEmailForm
        isOpen={isChangeEmailOpen}
        onClose={() => setIsChangeEmailOpen(false)}
        currentUser={currentUser}
        onSave={handleEmailUpdate}
      />
      <ChangeUsernameForm
        isOpen={isChangeUsernameOpen}
        onClose={() => setIsChangeUsernameOpen(false)}
        currentUser={currentUser}
        onSave={handleUsernameUpdate}
      />
    </>
  );
}

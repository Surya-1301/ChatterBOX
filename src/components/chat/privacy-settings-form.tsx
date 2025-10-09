
'use client';

import type { User, PrivacySetting } from '@/lib/types';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, UserX } from 'lucide-react';
import PrivacySettingOptionDialog from './privacy-setting-option-dialog';
import { useToast } from '@/hooks/use-toast';
import BlockedUsersDialog from './blocked-users-dialog';

type PrivacySettingsFormProps = {
  currentUser: User;
  onSave: (updatedUser: User) => void;
  allUsers: User[];
};

type PrivacyOption = 'lastSeen' | 'profilePhoto' | 'about';

export default function PrivacySettingsForm({ currentUser, onSave, allUsers }: PrivacySettingsFormProps) {
  const { toast } = useToast();
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [isBlockedUsersDialogOpen, setIsBlockedUsersDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PrivacyOption | null>(null);

  const initialSettings = {
    lastSeen: currentUser.privacySettings?.lastSeen || 'everyone',
    profilePhoto: currentUser.privacySettings?.profilePhoto || 'everyone',
    about: currentUser.privacySettings?.about || 'everyone',
    readReceipts: currentUser.privacySettings?.readReceipts !== false,
  };

  const [privacySettings, setPrivacySettings] = useState(initialSettings);

  const handleSettingChange = (key: PrivacyOption, value: PrivacySetting) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    updateUser(newSettings);
  };
  
  const handleReadReceiptsChange = (checked: boolean) => {
    const newSettings = { ...privacySettings, readReceipts: checked };
    setPrivacySettings(newSettings);
    updateUser(newSettings);
  };

  const updateUser = (newSettings: typeof initialSettings, blockedUsers?: string[]) => {
     try {
      const updatedUser: User = {
        ...currentUser,
        privacySettings: {
          lastSeen: newSettings.lastSeen,
          profilePhoto: newSettings.profilePhoto,
          about: newSettings.about,
          readReceipts: newSettings.readReceipts,
        },
        blockedUsers: blockedUsers || currentUser.blockedUsers,
      };
      onSave(updatedUser);
      toast({
        title: 'Privacy settings updated',
      });
    } catch (e) {
      toast({
        title: 'Update Failed',
        description: 'Could not update your privacy settings.',
        variant: 'destructive',
      });
    }
  };

  const openDialog = (option: PrivacyOption) => {
    setSelectedOption(option);
    setIsOptionDialogOpen(true);
  };
  
  const formatLabel = (value: string) => {
    if (value === 'myContacts') return 'My contacts';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  const options: {key: PrivacyOption, label: string}[] = [
    { key: 'lastSeen', label: 'Last seen and online' },
    { key: 'profilePhoto', label: 'Profile photo' },
    { key: 'about', label: 'About' },
  ];
  
  const handleUnblockUser = (userId: string) => {
    const newBlockedUsers = currentUser.blockedUsers?.filter(id => id !== userId);
    updateUser(privacySettings, newBlockedUsers);
  };

  return (
    <>
      <div className="space-y-4">
        <div>
            <h3 className="text-primary font-semibold mb-2">Who can see my personal info</h3>
            {options.map((option) => (
                <button key={option.key} onClick={() => openDialog(option.key)} className="w-full text-left p-3 hover:bg-accent rounded-lg">
                    <div className="flex justify-between items-center">
                        <span>{option.label}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{formatLabel(privacySettings[option.key])}</span>
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </div>
                </button>
            ))}
        </div>

        <Separator />

        <div className="p-3">
          <div className="flex justify-between items-center">
            <label htmlFor="read-receipts" className="font-medium cursor-pointer">
              Read receipts
            </label>
            <Switch
              id="read-receipts"
              checked={privacySettings.readReceipts}
              onCheckedChange={handleReadReceiptsChange}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
          </p>
        </div>
        
        <Separator />

        <button onClick={() => setIsBlockedUsersDialogOpen(true)} className="w-full text-left p-3 hover:bg-accent rounded-lg">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <UserX className="h-5 w-5 text-muted-foreground" />
                    <span>Blocked contacts</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{currentUser.blockedUsers?.length || 0}</span>
                    <ChevronRight className="h-4 w-4" />
                </div>
            </div>
        </button>

      </div>

      {selectedOption && (
        <PrivacySettingOptionDialog
          isOpen={isOptionDialogOpen}
          onClose={() => setIsOptionDialogOpen(false)}
          title={`Who can see my ${selectedOption === 'lastSeen' ? 'last seen and online' : selectedOption === 'profilePhoto' ? 'profile photo' : 'about'}`}
          currentValue={privacySettings[selectedOption]}
          onSave={(value) => handleSettingChange(selectedOption, value)}
        />
      )}
      <BlockedUsersDialog
        isOpen={isBlockedUsersDialogOpen}
        onClose={() => setIsBlockedUsersDialogOpen(false)}
        blockedUsers={allUsers.filter(u => currentUser.blockedUsers?.includes(u.id))}
        onUnblockUser={handleUnblockUser}
      />
    </>
  );
}

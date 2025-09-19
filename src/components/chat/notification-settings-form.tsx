
'use client';

import type { User } from '@/lib/types';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type NotificationSettingsFormProps = {
  currentUser: User;
  onSave: (updatedUser: User) => void;
};

export default function NotificationSettingsForm({ currentUser, onSave }: NotificationSettingsFormProps) {
  const { toast } = useToast();
  
  const initialSettings = {
    messageNotifications: currentUser.notificationSettings?.messageNotifications !== false,
    showPreviews: currentUser.notificationSettings?.showPreviews === true,
    showReactionNotifications: currentUser.notificationSettings?.showReactionNotifications === true,
    backgroundSync: currentUser.notificationSettings?.backgroundSync === true,
    incomingSounds: currentUser.notificationSettings?.incomingSounds !== false,
    outgoingSounds: currentUser.notificationSettings?.outgoingSounds === true,
  };

  const [notificationSettings, setNotificationSettings] = useState(initialSettings);

  const updateUser = (newSettings: typeof initialSettings) => {
     try {
      const updatedUser: User = {
        ...currentUser,
        notificationSettings: newSettings,
      };
      onSave(updatedUser);
      toast({
        title: 'Notification settings updated',
      });
    } catch (e) {
      toast({
        title: 'Update Failed',
        description: 'Could not update your notification settings.',
        variant: 'destructive',
      });
    }
  };

  const handleSwitchChange = (key: keyof typeof initialSettings, checked: boolean) => {
    const newSettings = { ...notificationSettings, [key]: checked };
    setNotificationSettings(newSettings);
    updateUser(newSettings);
  };
  
  return (
    <div className="space-y-4">
        <div>
            <h3 className="text-primary font-semibold mb-2 px-3">Messages</h3>
            <div className="p-3">
                <div className="flex justify-between items-center">
                    <label htmlFor="message-notifications" className="cursor-pointer">
                        <p>Message notifications</p>
                        <p className="text-sm text-muted-foreground">Show notifications for new messages</p>
                    </label>
                    <Switch
                    id="message-notifications"
                    checked={notificationSettings.messageNotifications}
                    onCheckedChange={(checked) => handleSwitchChange('messageNotifications', checked)}
                    />
                </div>
            </div>
             <div className="p-3">
                <div className="flex justify-between items-center">
                    <label htmlFor="show-previews" className="cursor-pointer">
                        <p>Show previews</p>
                    </label>
                    <Switch
                    id="show-previews"
                    checked={notificationSettings.showPreviews}
                    onCheckedChange={(checked) => handleSwitchChange('showPreviews', checked)}
                    disabled={!notificationSettings.messageNotifications}
                    />
                </div>
            </div>
            <div className="p-3">
                <div className="flex justify-between items-center">
                    <label htmlFor="reaction-notifications" className="cursor-pointer">
                        <p>Show reaction notifications</p>
                    </label>
                    <Switch
                    id="reaction-notifications"
                    checked={notificationSettings.showReactionNotifications}
                    onCheckedChange={(checked) => handleSwitchChange('showReactionNotifications', checked)}
                    />
                </div>
            </div>
        </div>

        <Separator />

        <div>
            <div className="p-3">
                <div className="flex justify-between items-center">
                    <label htmlFor="background-sync" className="cursor-pointer">
                        <p>Background sync</p>
                        <p className="text-sm text-muted-foreground">Get faster performance by syncing messages in the background</p>
                    </label>
                    <Switch
                    id="background-sync"
                    checked={notificationSettings.backgroundSync}
                    onCheckedChange={(checked) => handleSwitchChange('backgroundSync', checked)}
                    />
                </div>
            </div>
        </div>
        
        <Separator />

         <div>
            <h3 className="text-primary font-semibold mb-2 px-3">Notification tones</h3>
            <div className="p-3">
                <div className="flex justify-between items-center">
                    <label htmlFor="incoming-sounds" className="cursor-pointer">
                        <p>Incoming sounds</p>
                        <p className="text-sm text-muted-foreground">Play sounds for incoming messages</p>
                    </label>
                    <Switch
                    id="incoming-sounds"
                    checked={notificationSettings.incomingSounds}
                    onCheckedChange={(checked) => handleSwitchChange('incomingSounds', checked)}
                    />
                </div>
            </div>
             <div className="p-3">
                <div className="flex justify-between items-center">
                    <label htmlFor="outgoing-sounds" className="cursor-pointer">
                        <p>Outgoing sounds</p>
                        <p className="text-sm text-muted-foreground">Play sounds for outgoing messages</p>
                    </label>
                    <Switch
                    id="outgoing-sounds"
                    checked={notificationSettings.outgoingSounds}
                    onCheckedChange={(checked) => handleSwitchChange('outgoingSounds', checked)}
                    />
                </div>
            </div>
        </div>
      </div>
  );
}

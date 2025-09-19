
'use client';

import type { User, ChatTheme, MediaUploadQuality, MediaAutoDownload } from '@/lib/types';
import { useState, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SettingOptionDialog from './setting-option-dialog';

type ChatSettingsFormProps = {
  currentUser: User;
  onSave: (updatedUser: User) => void;
};

type ChatOption = 'theme' | 'mediaUploadQuality' | 'mediaAutoDownload';

type DialogState = {
  isOpen: boolean;
  option: ChatOption | null;
  title: string;
  options: { value: string; label: string }[];
  currentValue: string;
};

export default function ChatSettingsForm({ currentUser, onSave }: ChatSettingsFormProps) {
  const { toast } = useToast();
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  
  const initialSettings = {
    theme: currentUser.chatSettings?.theme || 'system',
    wallpaper: currentUser.chatSettings?.wallpaper || 'default',
    mediaUploadQuality: currentUser.chatSettings?.mediaUploadQuality || 'auto',
    mediaAutoDownload: currentUser.chatSettings?.mediaAutoDownload || 'wifi',
    spellCheck: currentUser.chatSettings?.spellCheck !== false,
    replaceTextWithEmoji: currentUser.chatSettings?.replaceTextWithEmoji !== false,
    enterIsSend: currentUser.chatSettings?.enterIsSend !== false,
  };

  const [chatSettings, setChatSettings] = useState(initialSettings);
  const [dialogState, setDialogState] = useState<DialogState>({ 
    isOpen: false, 
    option: null, 
    title: '', 
    options: [], 
    currentValue: '' 
  });

  const updateUser = (newSettings: typeof initialSettings) => {
     try {
      const updatedUser: User = {
        ...currentUser,
        chatSettings: newSettings,
      };
      onSave(updatedUser);
      toast({
        title: 'Chat settings updated',
      });
    } catch (e) {
      toast({
        title: 'Update Failed',
        description: 'Could not update your chat settings.',
        variant: 'destructive',
      });
    }
  };

  const handleSwitchChange = (key: keyof typeof initialSettings, checked: boolean) => {
    const newSettings = { ...chatSettings, [key]: checked };
    setChatSettings(newSettings);
    updateUser(newSettings);
  };
  
  const handleOptionChange = (key: ChatOption, value: string) => {
    const newSettings = { ...chatSettings, [key]: value };
    setChatSettings(newSettings);
    updateUser(newSettings);
    setDialogState({ ...dialogState, isOpen: false });
  };

  const handleWallpaperClick = () => {
    wallpaperInputRef.current?.click();
  };

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'Image too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      const wallpaperUrl = URL.createObjectURL(file);
      const newSettings = { ...chatSettings, wallpaper: wallpaperUrl };
      setChatSettings(newSettings);
      updateUser(newSettings);
    }
  };
  
  const openDialog = (option: ChatOption) => {
    const dialogs: Record<ChatOption, Omit<DialogState, 'isOpen'>> = {
      theme: {
        option: 'theme',
        title: 'Theme',
        currentValue: chatSettings.theme,
        options: [
          { value: 'system', label: 'System default' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ],
      },
      mediaUploadQuality: {
        option: 'mediaUploadQuality',
        title: 'Media upload quality',
        currentValue: chatSettings.mediaUploadQuality,
        options: [
          { value: 'auto', label: 'Auto (recommended)' },
          { value: 'best', label: 'Best quality' },
          { value: 'dataSaver', label: 'Data saver' },
        ],
      },
      mediaAutoDownload: {
        option: 'mediaAutoDownload',
        title: 'Media auto-download',
        currentValue: chatSettings.mediaAutoDownload,
        options: [
          { value: 'wifi', label: 'When using Wi-Fi' },
          { value: 'cellular', label: 'When using mobile data' },
          { value: 'never', label: 'Never' },
        ],
      },
    };
    setDialogState({ ...dialogs[option], isOpen: true });
  };
  
  const formatLabel = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, ' $1');
  }

  return (
    <>
      <input
        type="file"
        ref={wallpaperInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
        onChange={handleWallpaperChange}
      />
      <div className="space-y-4">
        <div>
            <h3 className="text-primary font-semibold mb-2 px-3">Display</h3>
            <button onClick={() => openDialog('theme')} className="w-full text-left p-3 hover:bg-accent rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p>Theme</p>
                        <p className="text-sm text-muted-foreground">{formatLabel(chatSettings.theme)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </button>
            <button onClick={handleWallpaperClick} className="w-full text-left p-3 hover:bg-accent rounded-lg">
                <div className="flex justify-between items-center">
                    <p>Wallpaper</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </button>
        </div>

        <Separator />

        <div>
            <h3 className="text-primary font-semibold mb-2 px-3">Chat settings</h3>
            <button onClick={() => openDialog('mediaUploadQuality')} className="w-full text-left p-3 hover:bg-accent rounded-lg">
                <div className="flex justify-between items-center">
                    <p>Media upload quality</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </button>
            <button onClick={() => openDialog('mediaAutoDownload')} className="w-full text-left p-3 hover:bg-accent rounded-lg">
                <div className="flex justify-between items-center">
                    <p>Media auto-download</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </button>
        </div>
        
        <div className="p-3">
            <div className="flex justify-between items-center">
                <label htmlFor="spell-check" className="cursor-pointer">
                    <p>Spell check</p>
                    <p className="text-sm text-muted-foreground">Check spelling while typing</p>
                </label>
                <Switch
                id="spell-check"
                checked={chatSettings.spellCheck}
                onCheckedChange={(checked) => handleSwitchChange('spellCheck', checked)}
                />
            </div>
        </div>
        <div className="p-3">
            <div className="flex justify-between items-center">
                <label htmlFor="replace-emoji" className="cursor-pointer">
                    <p>Replace text with emoji</p>
                    <p className="text-sm text-muted-foreground">Emoji will replace specific text as you type</p>
                </label>
                <Switch
                id="replace-emoji"
                checked={chatSettings.replaceTextWithEmoji}
                onCheckedChange={(checked) => handleSwitchChange('replaceTextWithEmoji', checked)}
                />
            </div>
        </div>
        <div className="p-3">
            <div className="flex justify-between items-center">
                <label htmlFor="enter-is-send" className="cursor-pointer">
                    <p>Enter is send</p>
                    <p className="text-sm text-muted-foreground">Enter key will send your message</p>
                </label>
                <Switch
                id="enter-is-send"
                checked={chatSettings.enterIsSend}
                onCheckedChange={(checked) => handleSwitchChange('enterIsSend', checked)}
                />
            </div>
        </div>
      </div>

      {dialogState.isOpen && dialogState.option && (
        <SettingOptionDialog
            isOpen={dialogState.isOpen}
            onClose={() => setDialogState({ ...dialogState, isOpen: false })}
            title={dialogState.title}
            options={dialogState.options}
            currentValue={dialogState.currentValue}
            onSave={(value) => handleOptionChange(dialogState.option!, value)}
        />
      )}
    </>
  );
}

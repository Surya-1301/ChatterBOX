
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PrivacySetting } from '@/lib/types';
import { Button } from '../ui/button';

type PrivacySettingOptionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentValue: PrivacySetting;
  onSave: (value: PrivacySetting) => void;
};

export default function PrivacySettingOptionDialog({
  isOpen,
  onClose,
  title,
  currentValue,
  onSave,
}: PrivacySettingOptionDialogProps) {
  const options: { value: PrivacySetting; label: string }[] = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'myContacts', label: 'My contacts' },
    { value: 'nobody', label: 'Nobody' },
  ];
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const selectedValue = formData.get('privacy-option') as PrivacySetting;
    if (selectedValue) {
        onSave(selectedValue);
    }
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Choose who can see this information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
            <RadioGroup defaultValue={currentValue} name="privacy-option" className="space-y-4 py-4">
            {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
                </div>
            ))}
            </RadioGroup>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit">OK</Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

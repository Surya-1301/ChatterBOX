
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
import { Button } from '../ui/button';

type SettingOptionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: { value: string; label: string }[];
  currentValue: string;
  onSave: (value: string) => void;
};

export default function SettingOptionDialog({
  isOpen,
  onClose,
  title,
  options,
  currentValue,
  onSave,
}: SettingOptionDialogProps) {
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const selectedValue = formData.get('setting-option') as string;
    if (selectedValue) {
        onSave(selectedValue);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Select an option and press OK.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
            <RadioGroup defaultValue={currentValue} name="setting-option" className="space-y-4 py-4">
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

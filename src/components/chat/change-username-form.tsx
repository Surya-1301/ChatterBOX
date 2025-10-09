
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';
import { differenceInDays } from 'date-fns';

const formSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }).regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores.'
  }),
});

type ChangeUsernameFormProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updatedUser: User) => void;
};

export default function ChangeUsernameForm({
  isOpen,
  onClose,
  currentUser,
  onSave,
}: ChangeUsernameFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: currentUser.username,
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
        if (currentUser.usernameLastChanged) {
            const lastChangedDate = new Date(currentUser.usernameLastChanged);
            const daysSinceChange = differenceInDays(new Date(), lastChangedDate);
            if (daysSinceChange < 30) {
                toast({
                    title: 'Update Failed',
                    description: `You can change your username again in ${30 - daysSinceChange} days.`,
                    variant: 'destructive',
                });
                return;
            }
        }

        const allUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const existingUser = allUsers.find(u => u.username === values.username && u.id !== currentUser.id);

        if (existingUser) {
            toast({
                title: 'Update Failed',
                description: 'This username is already taken.',
                variant: 'destructive',
            });
            return;
        }
        
        const updatedUser: User = {
            ...currentUser,
            username: values.username,
            usernameLastChanged: new Date().toISOString(),
        };
        onSave(updatedUser);
        toast({
            title: 'Username Updated',
            description: 'Your username has been successfully updated.',
        });
    } catch(e) {
        toast({
            title: 'Update Failed',
            description: 'Could not update your username.',
            variant: 'destructive',
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Username</DialogTitle>
          <DialogDescription>
            Enter your new username. You can change your username once every 30 days.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <Label htmlFor="username">Username</Label>
                            <FormControl>
                                <Input id="username" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

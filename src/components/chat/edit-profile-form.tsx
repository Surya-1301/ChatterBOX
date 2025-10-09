'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useRef, useState } from 'react';
import { Textarea } from '../ui/textarea';
import { Pencil } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  about: z.string().max(120, { message: 'About must be 120 characters or less.' }).optional(),
});

type EditProfileFormProps = {
  currentUser: User;
  onSave: (updatedUser: User) => void;
};

export default function EditProfileForm({ currentUser, onSave }: EditProfileFormProps) {
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentUser.name,
      about: currentUser.about || '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      let newAvatarUrl = currentUser.avatar;
      if (avatarFile) {
        newAvatarUrl = URL.createObjectURL(avatarFile);
      }

      const updatedUser: User = {
        ...currentUser,
        name: values.name,
        avatar: newAvatarUrl,
        about: values.about,
      };
      
      onSave(updatedUser);

      toast({
        title: 'Profile Updated',
        description: 'Your profile details have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Something went wrong while updating your profile.',
        variant: 'destructive',
      });
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: 'Image too large',
          description: 'Please select an image smaller than 2MB.',
          variant: 'destructive',
        });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
            <button
                type="button"
                className="relative group"
                onClick={() => fileInputRef.current?.click()}
            >
                <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="h-8 w-8 text-white" />
                </div>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleAvatarChange}
            />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us a little bit about yourself" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </Form>
  );
}

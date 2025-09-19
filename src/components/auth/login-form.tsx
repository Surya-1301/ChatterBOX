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
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { app, Credentials } from '@/lib/realm';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // For Realm, login is with email and password
      const credentials = Credentials.emailPassword(values.email, values.password);
      const user = await app.logIn(credentials);

      toast({
        title: 'Login Successful!',
        description: "Welcome back! You're being redirected.",
      });

      localStorage.setItem('auth-token', user.accessToken ?? '');
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        email: user.profile.email,
        // Add more fields if needed
      }));
      console.log('Redirecting to /chat after login');
      toast({ title: 'Debug', description: 'Redirecting to /chat', variant: 'default' });
      router.push('/chat');
    } catch (error: any) {
      console.error('Error logging in: ', error);
      toast({
        title: 'Login Failed',
        description: error?.error || error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  className="text-sm text-primary underline hover:text-primary/80 focus:outline-none"
                  onClick={() => router.push('/reset-password')}
                >
                  Forgot password?
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Login</Button>
      </form>
    </Form>
  );
}

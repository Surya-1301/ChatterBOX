
'use client';

import ChatLayout from '@/components/chat/chat-layout';
import type { User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('auth-token');

    if (!token || !storedUser) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
    } catch (error) {
      console.error('Failed to parse user data from localStorage', error);
      router.push('/');
    }
    
    setLoading(false);
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="h-screen bg-background overflow-hidden">
      <ChatLayout
        currentUser={currentUser}
      />
    </main>
  );
}

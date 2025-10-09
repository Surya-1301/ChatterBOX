"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OAuthHandler({ searchParams }: { searchParams?: any }) {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('auth-token', token);
      // Optionally fetch user info from server or decode token
      // Redirect to chat
      router.replace('/chat');
    } else {
      router.replace('/');
    }
  }, [router]);

  return null;
}


'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react';
import type { User } from '@/lib/types';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    const applyTheme = () => {
      const storedUser = localStorage.getItem('currentUser');
      let theme = 'system';
      if (storedUser) {
        try {
          const user: User = JSON.parse(storedUser);
          theme = user.chatSettings?.theme || 'system';
        } catch (e) {
          console.error('Failed to parse user for theme', e);
        }
      }

      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'currentUser') {
        applyTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for color scheme changes from the OS
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', applyTheme);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ChatterBox</title>
        <meta name="description" content="A modern real-time chat application." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

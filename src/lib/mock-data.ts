import type { User, Conversation } from './types';

// NOTE: This is a mock data file for demonstration purposes.
// In a real application, this data would be fetched from a database.

export const getAllUsers = (): User[] => {
    if (typeof window === 'undefined') return [];
    const usersStr = localStorage.getItem('users');
    return usersStr ? JSON.parse(usersStr) : [];
}

export const getOtherUsers = (currentUserId: string): User[] => {
    const allUsers = getAllUsers();
    return allUsers.filter(user => user.id !== currentUserId);
}

export const users: User[] = [];

export const currentUser: User = {
  id: 'user-current',
  name: 'You',
  username: 'you',
  email: 'you@example.com',
  avatar: 'https://picsum.photos/seed/105/200/200',
  status: 'online',
};

export const conversations: Conversation[] = [];

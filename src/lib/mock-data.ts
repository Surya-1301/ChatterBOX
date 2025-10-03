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

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    username: 'alice_j',
    email: 'alice@example.com',
    avatar: 'https://picsum.photos/seed/101/200/200',
    status: 'online',
    contacts: ['user-current'],
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    username: 'bob_smith',
    email: 'bob@example.com',
    avatar: 'https://picsum.photos/seed/102/200/200',
    status: 'offline',
    contacts: ['user-current'],
  },
  {
    id: 'user-3',
    name: 'Carol Davis',
    username: 'carol_d',
    email: 'carol@example.com',
    avatar: 'https://picsum.photos/seed/103/200/200',
    status: 'online',
  },
  {
    id: 'user-4',
    name: 'David Wilson',
    username: 'david_w',
    email: 'david@example.com',
    avatar: 'https://picsum.photos/seed/104/200/200',
    status: 'online',
  },
  {
    id: 'user-5',
    name: 'Emma Brown',
    username: 'emma_b',
    email: 'emma@example.com',
    avatar: 'https://picsum.photos/seed/106/200/200',
    status: 'offline',
  },
];

export const currentUser: User = {
  id: 'user-current',
  name: 'You',
  username: 'you',
  email: 'you@example.com',
  avatar: 'https://picsum.photos/seed/105/200/200',
  status: 'online',
  contacts: ['user-1', 'user-2'],
};

export const conversations: Conversation[] = [
  {
    id: 'private-user-current-user-1',
    type: 'private',
    name: 'Alice Johnson',
    avatar: 'https://picsum.photos/seed/101/200/200',
    participants: ['user-current', 'user-1'],
    lastMessage: 'Hey! How are you doing?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    unreadCount: 2,
  },
  {
    id: 'private-user-current-user-2',
    type: 'private',
    name: 'Bob Smith',
    avatar: 'https://picsum.photos/seed/102/200/200',
    participants: ['user-current', 'user-2'],
    lastMessage: 'Thanks for the help yesterday!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    unreadCount: 0,
  },
  {
    id: 'group-dev-team',
    type: 'group',
    name: 'Dev Team',
    avatar: 'https://picsum.photos/seed/group1/200/200',
    participants: ['user-current', 'user-1', 'user-2', 'user-3'],
    lastMessage: 'Alice: Let\'s schedule the sprint planning for tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    unreadCount: 1,
  },
  {
    id: 'group-family',
    type: 'group',
    name: 'Family Chat',
    avatar: 'https://picsum.photos/seed/group2/200/200',
    participants: ['user-current', 'user-4', 'user-5'],
    lastMessage: 'David: See you all for dinner on Sunday!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    unreadCount: 0,
  },
];

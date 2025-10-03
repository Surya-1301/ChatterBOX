import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';
// ...existing code...

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const db = await getDb();
    const users = await db.collection('users').find({}).toArray();
    // Remove sensitive fields before returning
    const safe = users.map(u => ({ 
      id: u.id || String(u._id), 
      name: u.name, 
      username: u.username, 
      email: u.email, 
      avatar: u.avatar, 
      status: u.status || 'offline',
      chatSettings: u.chatSettings || {}, 
      contacts: u.contacts || [] 
    }));
    res.status(200).json(safe);
  } catch (err: any) {
    console.error('Database error, falling back to mock data:', err.message);
  // Fallback: return empty array or error
  res.status(200).json([]);
  }
}

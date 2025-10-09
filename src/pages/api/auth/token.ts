import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session || !session.user?.email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const users = db.collection('users');
  const user = await users.findOne({ email: session.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign({ sub: String(user._id), email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.status(200).json({ token, user: { id: String(user._id), email: user.email, name: user.name, username: user.username } });
  } catch (err) {
    console.error('auth token error', err);
    res.status(500).json({ error: 'Failed to create token' });
  }
}

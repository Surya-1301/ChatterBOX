import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  try {
    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: String(user._id), email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    res.status(200).json({ token, user: { id: String(user._id), email: user.email, name: user.name, username: user.username } });
  } catch (err: any) {
    console.error(err);
    if (err.message && err.message.includes('MONGODB_URI')) {
      res.status(500).json({ error: 'Server misconfiguration: missing MONGODB_URI environment variable' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

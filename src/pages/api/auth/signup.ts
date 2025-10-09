import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, name, username } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  try {
    const db = await getDb();
    const users = db.collection('users');
    const existing = await users.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await users.insertOne({ email, password: hashed, name, username, createdAt: new Date() });

    const token = jwt.sign({ sub: String(result.insertedId), email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: String(result.insertedId), email, name, username } });
  } catch (err: any) {
    console.error(err);
    if (err.message && err.message.includes('MONGODB_URI')) {
      res.status(500).json({ error: 'Server misconfiguration: missing MONGODB_URI environment variable' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

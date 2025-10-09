import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).end();
  try {
    const db = await getDb();
    const { id, updates } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!id || !updates) return res.status(400).json({ error: 'Missing id or updates' });
    const convs = db.collection('conversations');
    await convs.updateOne({ id }, { $set: { ...updates } }, { upsert: true });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Conversation update API error:', err);
    if (err.message && err.message.includes('MONGODB_URI')) {
      return res.status(500).json({ error: 'Server misconfiguration: missing MONGODB_URI environment variable' });
    }
    return res.status(500).json({ error: 'Failed to update conversation' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const db = await getDb();
    const { conversationId } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });
    const messages = db.collection('messages');
    const convs = db.collection('conversations');
    await messages.deleteMany({ conversationId });
    await convs.updateOne({ id: conversationId }, { $set: { lastMessage: 'Chat cleared', timestamp: new Date().toISOString() } }, { upsert: true });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Clear messages API error:', err);
    if (err.message && err.message.includes('MONGODB_URI')) {
      return res.status(500).json({ error: 'Server misconfiguration: missing MONGODB_URI environment variable' });
    }
    return res.status(500).json({ error: 'Failed to clear messages' });
  }
}

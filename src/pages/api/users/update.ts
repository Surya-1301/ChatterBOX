import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).end();
  try {
    const db = await getDb();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const updatedUser = body;
    const id: string | undefined = updatedUser?.id || updatedUser?._id;
    if (!id) return res.status(400).json({ error: 'Missing user id' });

    const users = db.collection('users');

    // Try to update by custom id field first
    let result = await users.updateOne({ id }, { $set: { ...updatedUser } }, { upsert: true });
    if (result.matchedCount === 0) {
      // Try by Mongo _id if id looks like an ObjectId
      if (/^[a-fA-F0-9]{24}$/.test(id)) {
        result = await users.updateOne({ _id: new ObjectId(id) }, { $set: { ...updatedUser, id: updatedUser.id || id } }, { upsert: true });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('User update API error:', err);
    if (err.message && err.message.includes('MONGODB_URI')) {
      return res.status(500).json({ error: 'Server misconfiguration: missing MONGODB_URI environment variable' });
    }
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

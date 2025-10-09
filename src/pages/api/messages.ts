import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb();
    const messagesCol = db.collection('messages');
    const convCol = db.collection('conversations');

    if (req.method === 'GET') {
      const conversationId = String(req.query.conversationId || '');
      if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });
      // find() returns a cursor; convert to an array and sort before returning
      const msgs = await messagesCol.find({ conversationId }).sort({ timestamp: 1 }).toArray();
      return res.status(200).json(msgs);
    }

    if (req.method !== 'POST') return res.status(405).end();

    const { content, from, conversationId, timestamp, imageUrl, fileUrl, fileName, audioWaveform, deliveredTo = [], readBy = [] } = req.body;
    if (!conversationId || !from) return res.status(400).json({ error: 'Missing conversationId or from' });

    const message = {
      content: content || '',
      from,
      conversationId,
      timestamp: timestamp || new Date().toISOString(),
      imageUrl: imageUrl || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      audioWaveform: audioWaveform || null,
      deliveredTo,
      readBy,
    };

    const result = await messagesCol.insertOne(message);

    // Update conversation metadata
    const lastMessageText = message.content || message.fileName || 'File sent';
    await convCol.updateOne(
      { id: conversationId },
      { $set: { lastMessage: lastMessageText, timestamp: new Date().toISOString() }, $inc: { unreadCount: 1 } },
      { upsert: true }
    );

    res.status(201).json({ id: result.insertedId, ...message });
  } catch (err: any) {
    console.error('Error creating/fetching message:', err);
    if (err.message && err.message.includes('MONGODB_URI')) {
      res.status(500).json({ error: 'Server misconfiguration: missing MONGODB_URI environment variable' });
    } else {
      res.status(500).json({ error: 'Failed to create/fetch message' });
    }
  }
}

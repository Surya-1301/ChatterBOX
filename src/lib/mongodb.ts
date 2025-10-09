import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'chatterbox';

let cached: { client: MongoClient | null } = { client: null };

export async function getDb() {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  if (!cached.client) {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cached.client = client;
  }
  return cached.client!.db(MONGODB_DB);
}

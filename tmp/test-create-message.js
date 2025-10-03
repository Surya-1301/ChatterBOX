require('dotenv').config({ path: './.env.local' });
const handler = require('../.next/server/pages/api/messages.js').default;

async function run() {
  console.log('MONGODB_URI present?', !!process.env.MONGODB_URI);
  const req = {
    method: 'POST',
    body: { content: 'hello', from: 'user1', conversationId: 'private-user1-user2' },
  };
  const res = {
    _status: 200,
    status(code) { this._status = code; return this; },
    json(obj) { console.log('STATUS', this._status || 200); console.log(JSON.stringify(obj, null, 2)); },
    end() { console.log('END', this._status); }
  };

  try { await handler(req, res); } catch (e) { console.error(e); }
}

run();

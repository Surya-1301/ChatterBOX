const handler = require('../.next/server/pages/api/auth/login.js').default;

async function run() {
  const req = {
    method: 'POST',
    body: { email: 'a@b.com', password: 'x' },
  };
  const res = {
    status(code) { this._status = code; return this; },
    json(obj) { console.log('STATUS', this._status || 200); console.log(JSON.stringify(obj, null, 2)); },
    end() { console.log('END', this._status); }
  };

  try { await handler(req, res); } catch (e) { console.error(e); }
}

run();

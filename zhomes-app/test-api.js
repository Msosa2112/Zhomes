import { config } from 'dotenv';
config({ path: '.env.local' });

import handler from './api/tc-transactions.js';

async function test() {
  const req = {
    method: 'GET',
    headers: { authorization: 'Bearer no-token' }, // will return 401
    query: { id: 'b3ce78ef-d131-4bcf-af69-ebdfa4049da4' }
  };
  const res = {
    setHeader: () => {},
    status: (code) => ({ json: (data) => console.log(code, data) })
  };
  try {
    await handler(req, res);
  } catch (err) {
    console.error("CAUGHT ERROR:", err);
  }
}
test();

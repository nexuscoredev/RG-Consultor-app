/**
 * Smoke test integração consultor ↔ API
 * Uso: node scripts/smoke.mjs [baseUrl]
 */
const base = (process.argv[2] ?? process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, opts);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { ok: res.ok, status: res.status, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log(`Smoke consultor API → ${base}`);

  const login = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vendedor@rg.com', password: 'rg2026' }),
  });
  assert(login.ok, `login failed: ${login.status}`);
  const token = login.json?.access_token ?? login.json?.accessToken;
  assert(token, 'login without token');

  const clients = await req('/me/clients', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(clients.ok, `clients failed: ${clients.status}`);
  assert(Array.isArray(clients.json?.rows), 'clients without rows array');

  const pipeline = await req('/me/pipeline', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(pipeline.ok, `pipeline failed: ${pipeline.status}`);
  assert(Array.isArray(pipeline.json?.rows), 'pipeline without rows');

  const today = new Date().toISOString().slice(0, 10);
  const route = await req(`/me/routes/${today}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(route.ok, `routes failed: ${route.status}`);
  assert(Array.isArray(route.json?.stops), 'route without stops');

  console.log('smoke consultor: ok');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

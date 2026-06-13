/**
 * Smoke test da API — assume servidor já em execução (npm run api).
 * Uso: node scripts/smoke.mjs [baseUrl]
 */
const base = (process.argv[2] ?? process.env.API_BASE_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');

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
  console.log(`Smoke API → ${base}`);

  const health = await req('/health');
  assert(health.ok, `health failed: ${health.status}`);
  assert(health.json?.ok === true, 'health body invalid');

  const login = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vendedor@rg.com', password: 'rg2026' }),
  });
  assert(login.ok, `login failed: ${login.status}`);
  const token = login.json?.access_token ?? login.json?.accessToken;
  assert(token, 'login without token');

  const today = new Date().toISOString().slice(0, 10);
  const route = await req(`/me/routes/${today}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(route.ok, `routes failed: ${route.status}`);
  assert(Array.isArray(route.json?.stops), 'route without stops');

  const pipeline = await req('/me/pipeline', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(pipeline.ok, `pipeline failed: ${pipeline.status}`);
  assert(Array.isArray(pipeline.json?.rows), 'pipeline without rows');
  if (pipeline.json.rows[0]) {
    assert(pipeline.json.rows[0].id, 'pipeline row missing id');
    assert(pipeline.json.rows[0].phase, 'pipeline row missing phase');
    assert(typeof pipeline.json.rows[0].updatedAt === 'number', 'pipeline row missing updatedAt');
  }

  const sync = await req('/sync/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [
        {
          id: `smoke-${Date.now()}`,
          type: 'MEETING_LOG',
          createdAt: Date.now(),
          payload: { client: 'Smoke Test Co', notes: 'ok', nextAction: 'Follow-up', nextDate: 'amanhã' },
        },
      ],
    }),
  });
  assert(sync.ok, `sync failed: ${sync.status}`);
  assert(Array.isArray(sync.json?.accepted), 'sync without accepted');

  const sellerAlerts = await req('/me/alerts', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(sellerAlerts.ok, `me alerts failed: ${sellerAlerts.status}`);

  const masterLogin = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@rg.com', password: 'rg2026' }),
  });
  const masterToken = masterLogin.json?.access_token;
  assert(masterToken, 'master login failed');

  const dash = await req('/master/dashboard', {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  assert(dash.ok, `master dashboard failed: ${dash.status}`);

  const masterAlerts = await req('/master/alerts', {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  assert(masterAlerts.ok, `master alerts failed: ${masterAlerts.status}`);
  assert(Array.isArray(masterAlerts.json?.items), 'alerts without items');

  const clients = await req('/me/clients', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(clients.ok, `clients failed: ${clients.status}`);
  assert(Array.isArray(clients.json?.rows), 'clients without rows');

  const clientSync = await req('/sync/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [
        {
          id: `smoke-client-${Date.now()}`,
          type: 'CLIENT_SAVED',
          createdAt: Date.now(),
          payload: {
            id: `smoke-c-${Date.now()}`,
            company: 'Smoke Cliente Ltda',
            contactName: 'Contato Smoke',
            segment: 'Industrial',
          },
        },
      ],
    }),
  });
  assert(clientSync.ok, `client sync failed: ${clientSync.status}`);
  assert(clientSync.json?.accepted?.length >= 1, 'CLIENT_SAVED not accepted');

  console.log('smoke: ok');
}

main().catch((e) => {
  console.error('smoke: FAIL', e.message);
  process.exit(1);
});

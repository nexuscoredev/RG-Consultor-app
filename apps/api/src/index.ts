import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';

import { DEMO_USERS, routeForDate } from './seed.js';
import { getMasterDashboard, listPipeline, recordSyncEvents } from './store.js';

const PORT = Number(process.env.PORT ?? 3001);
const JWT_SECRET = process.env.JWT_SECRET ?? 'rg-dev-secret-change-in-production';

type JwtPayload = {
  sub: string;
  email: string;
  role: 'seller' | 'master';
  sellerId: string;
  displayName: string;
  region: string;
};

function userPublic(u: JwtPayload) {
  return {
    email: u.email,
    role: u.role,
    displayName: u.displayName,
    sellerId: u.sellerId,
    region: u.region,
  };
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing_token' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as express.Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}

function masterOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as express.Request & { user?: JwtPayload }).user;
  if (!user || user.role !== 'master') {
    res.status(403).json({ error: 'master_only' });
    return;
  }
  next();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '512kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'rg-consultor-api', version: '1.0.0' });
});

app.post('/auth/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }
  const payload: JwtPayload = {
    sub: user.sellerId,
    email: user.email,
    role: user.role,
    sellerId: user.sellerId,
    displayName: user.displayName,
    region: user.region,
  };
  const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ access_token, accessToken: access_token, user: userPublic(payload) });
});

app.get('/auth/me', authMiddleware, (req, res) => {
  const user = (req as express.Request & { user: JwtPayload }).user;
  res.json({ user: userPublic(user) });
});

app.get('/me/routes/:date', authMiddleware, (req, res) => {
  const date = req.params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'invalid_date' });
    return;
  }
  res.json(routeForDate(date));
});

app.get('/me/pipeline', authMiddleware, (_req, res) => {
  res.json({ rows: listPipeline() });
});

app.post('/sync/events', authMiddleware, (req, res) => {
  const user = (req as express.Request & { user: JwtPayload }).user;
  const events = Array.isArray(req.body?.events) ? req.body.events : [];
  const normalized = events.map((ev: { id?: string; type?: string; payload?: unknown; createdAt?: number }) => ({
    id: String(ev.id ?? ''),
    type: String(ev.type ?? ''),
    payload: ev.payload,
    createdAt: Number(ev.createdAt ?? Date.now()),
  }));
  const result = recordSyncEvents(user.sellerId, normalized);
  res.json(result);
});

app.get('/master/dashboard', authMiddleware, masterOnly, (_req, res) => {
  res.json(getMasterDashboard());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RG Consultor API em http://0.0.0.0:${PORT}`);
  console.log('Utilizadores demo: vendedor@rg.com / rg2026 · master@rg.com / rg2026');
});

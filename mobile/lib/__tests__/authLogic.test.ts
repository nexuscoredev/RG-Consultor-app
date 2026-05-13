import assert from 'node:assert/strict';

/** Espelha inferência de perfil sem depender de Expo (testável em Node). */
function inferRole(email: string): 'seller' | 'master' {
  const e = email.trim().toLowerCase();
  if (e.startsWith('master@') || e.startsWith('admin@')) return 'master';
  return 'seller';
}

assert.equal(inferRole('master@x.com'), 'master');
assert.equal(inferRole('admin@x.com'), 'master');
assert.equal(inferRole('a@b.co'), 'seller');

console.log('authLogic.test.ts: ok');

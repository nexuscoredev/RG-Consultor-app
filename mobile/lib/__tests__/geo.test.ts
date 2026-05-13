import assert from 'node:assert/strict';
import { distanceMeters } from '../geo';

const d = distanceMeters(0, 0, 0, 0.01);
assert.ok(d > 1000 && d < 1200, `esperado ~1.1km, obteve ${d}`);

const zero = distanceMeters(-23.561414, -46.655881, -23.561414, -46.655881);
assert.equal(zero, 0);

console.log('geo.test.ts: ok');

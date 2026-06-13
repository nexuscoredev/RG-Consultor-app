import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public/icons');
const svg = readFileSync(join(publicDir, 'rg-mark.svg'));

async function writePng(name, size, insetRatio = 0) {
  const inset = Math.round(size * insetRatio);
  const inner = size - inset * 2;
  await sharp(svg)
    .resize(inner, inner, { fit: 'contain', background: '#121b26' })
    .extend({
      top: inset,
      bottom: inset,
      left: inset,
      right: inset,
      background: '#121b26',
    })
    .png()
    .toFile(join(publicDir, name));
}

await writePng('icon-192.png', 192, 0.08);
await writePng('icon-512.png', 512, 0.08);
await writePng('icon-512-maskable.png', 512, 0.18);

console.log('Icons generated in apps/consultor/public/icons/');

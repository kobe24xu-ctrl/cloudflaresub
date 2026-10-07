import { cp, mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await build({
  entryPoints: ['src/pages-worker.js'],
  outfile: 'dist/_worker.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
});
await writeFile('dist/_routes.json', JSON.stringify({
  version: 1, include: ['/*'], exclude: []
}, null, 2));
console.log('Pages package ready in dist/');

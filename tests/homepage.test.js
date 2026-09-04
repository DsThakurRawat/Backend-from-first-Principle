import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const enhancements = fs.readFileSync(path.join(root, 'assets/enhancements.css'), 'utf8');

assert.match(homepage, /\.btn-contribute:hover\s*\{[^}]*color:\s*#fff\s*;[^}]*\}/);
assert.doesNotMatch(enhancements, /a:hover\s*\{[^}]*color:\s*[^;}]+!important[^}]*\}/);

for (const contributor of [
  'DsThakurRawat',
  'yogeshsingh63',
  'SaikrishnaReddy1919',
  'abhishek-bhatkar',
  'Prashantkmr389',
  'parthpatyl',
  'dhrumilbhut',
  'jainsparsh5',
]) {
  assert.match(homepage, new RegExp(`href="https://github\\.com/${contributor}"`));
}

console.log('homepage checks passed');

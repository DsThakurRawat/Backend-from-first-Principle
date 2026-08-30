const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const enhancements = fs.readFileSync(path.join(root, 'assets/enhancements.css'), 'utf8');

assert.match(homepage, /\.btn-contribute:hover\{[^}]*color:#fff;/);
assert.doesNotMatch(enhancements, /a:hover\s*\{[^}]*color:[^;}]+!important/);

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
  assert.match(homepage, new RegExp(`github\\.com/${contributor}`));
}

console.log('homepage checks passed');

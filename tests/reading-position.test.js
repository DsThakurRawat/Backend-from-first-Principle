import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const chapter = read('src/layouts/Chapter.astro');
const home = read('src/pages/index.astro');

test('reading position uses a key separate from chapter completion', () => {
  assert.match(chapter, /bfp-reading-position/);
  assert.match(chapter, /bfp-progress/);
  assert.match(home, /bfp-reading-position/);
  assert.match(home, /bfp-progress/);

  // Completion must stay a plain id list — position payloads live elsewhere.
  assert.match(chapter, /PROGRESS_KEY\s*=\s*'bfp-progress'/);
  assert.match(chapter, /POSITION_KEY\s*=\s*'bfp-reading-position'/);
  assert.doesNotMatch(
    chapter,
    /localStorage\.setItem\(\s*PROGRESS_KEY\s*,\s*[^\)]*sectionId/,
  );
});

test('chapter page can save and offer resume for a section', () => {
  assert.match(chapter, /data-resume-prompt/);
  assert.match(chapter, /data-resume-go/);
  assert.match(chapter, /Continue/);
  assert.match(chapter, /savePosition/);
  assert.match(chapter, /sectionId/);
  assert.match(chapter, /pagehide/);
});

test('homepage exposes a Continue Reading CTA wired to saved position', () => {
  assert.match(home, /data-continue-reading/);
  assert.match(home, /Continue reading/);
  assert.match(home, /renderContinue/);
  assert.match(home, /lastId/);
});

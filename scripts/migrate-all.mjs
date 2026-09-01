/**
 * The full legacy -> MDX migration, start to finish.
 *
 *   1. convert   the 24 hand-written notes.html into MDX chapters
 *   2. tokenise  diagram colours into semantic --dg-* roles
 *   3. reseat    each label onto the ink ramp of the ground it sits on
 *
 * It is idempotent: step 1 regenerates every chapter from the legacy HTML, so
 * running this again reproduces the current content exactly. That is the point
 * -- the migration is a rerunnable pipeline, not a one-off hand edit.
 */
import { execFileSync } from 'node:child_process';

const steps = ['migrate.mjs', 'tokenise-diagrams.mjs', 'fix-label-ink.mjs'];
for (const step of steps) {
  console.log(`\n== ${step} ==`);
  execFileSync(process.execPath, [new URL(step, import.meta.url).pathname], { stdio: 'inherit' });
}

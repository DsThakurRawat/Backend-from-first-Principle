const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const shellJs = fs.readFileSync(path.join(root, 'assets/shell.js'), 'utf8');
const shellCss = fs.readFileSync(path.join(root, 'assets/shell.css'), 'utf8');
const enhancementsJs = fs.readFileSync(path.join(root, 'assets/enhancements.js'), 'utf8');
const enhancementsCss = fs.readFileSync(path.join(root, 'assets/enhancements.css'), 'utf8');

// 1. Shell and Collapsible Sidebar
assert.match(shellJs, /bfp_sidebar_collapsed/, 'shell.js must persist sidebar collapsed state');
assert.match(shellJs, /sidebar-collapsed/, 'shell.js must toggle sidebar-collapsed class');
assert.match(shellJs, /chapterNav/, 'shell.js must relocate chapter navigation into in-flow layout');
assert.match(shellJs, /bfp-sidebar-collapse-btn/, 'shell.js must create a sidebar collapse button');
assert.match(shellJs, /isContentEditable/, 'shell.js must guard against contentEditable key events');
assert.match(shellCss, /\.sidebar-collapsed/, 'shell.css must style sidebar-collapsed state');
assert.match(shellCss, /\.chapter-nav/, 'shell.css must style in-flow chapter navigation');
assert.match(shellCss, /\.bfp-sidebar-collapse-btn/, 'shell.css must style sidebar collapse button');

// 2. Read / Focus Mode
assert.match(enhancementsJs, /bfp_read_mode/, 'enhancements.js must persist read mode state');
assert.match(enhancementsJs, /toggleReadMode/, 'enhancements.js must implement toggleReadMode');
assert.match(enhancementsJs, /dockReadBtn/, 'enhancements.js must create dock read mode button');
assert.match(enhancementsCss, /\.bfp-read-mode/, 'enhancements.css must style bfp-read-mode');
assert.match(enhancementsCss, /\.dock-read-btn/, 'enhancements.css must style dock-read-btn');

// 3. Keyboard Shortcuts Help Modal & CTA
assert.match(enhancementsJs, /dockHelpBtn/, 'enhancements.js must create dock help button (?)');
assert.match(enhancementsJs, /initShortcutsModal/, 'enhancements.js must implement initShortcutsModal');
assert.match(enhancementsJs, /bfpShortcutsModal/, 'enhancements.js must create bfpShortcutsModal overlay');
assert.match(enhancementsCss, /\.dock-help-btn/, 'enhancements.css must style dock-help-btn');
assert.match(enhancementsJs, /shortcuts-modal-open/, 'enhancements.js must toggle shortcuts-modal-open class on body');
assert.match(enhancementsCss, /body\.shortcuts-modal-open[\s\S]*overflow:\s*hidden/, 'enhancements.css must disable scroll when shortcuts modal is open');
assert.match(enhancementsJs, /previousFocusedElement/, 'enhancements.js must preserve and restore focus on shortcuts modal open/close');

// 4. Paragraph, Text & SVG Overflow Protection
assert.match(shellCss, /\.bfp-content\s+p[\s\S]*overflow-wrap:\s*break-word/, 'shell.css must apply overflow-wrap to paragraphs');
assert.match(shellCss, /\.bfp-content\s+a[\s\S]*overflow-wrap:\s*anywhere/, 'shell.css must apply overflow-wrap: anywhere to links');
assert.match(shellCss, /\.bfp-content\s+svg[\s\S]*max-width:\s*100%/, 'shell.css must constrain svg diagrams');

// 5. Text Highlight Multi-Node Range & Excerpt Sync
assert.match(enhancementsJs, /highlightRange/, 'enhancements.js must implement highlightRange');
assert.match(enhancementsJs, /findAndHighlightTextInDOM/, 'enhancements.js must implement findAndHighlightTextInDOM');
assert.match(enhancementsJs, /removeExcerptFromActiveLessonDoc/, 'enhancements.js must clean up excerpts on note deletion');

console.log('read mode and shell checks passed');



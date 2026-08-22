import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('the archive leads with the award and describes Uni Systems as an internship', () => {
  const html = readFileSync('index.html', 'utf8');

  assert.ok(html.indexOf('AI Challenge Winner') < html.indexOf('AI Engineering Intern'));
  assert.match(html, /Current AI Engineering Internship/);
  assert.doesNotMatch(html, /HELIO|StyleEra/);
});

test('the cinematic system uses Manrope and respects reduced motion', () => {
  const css = readFileSync('style.css', 'utf8');
  const script = readFileSync('main.js', 'utf8');

  assert.match(css, /Manrope/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(script, /prefers-reduced-motion/);
});

# Cinematic Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static portfolio with a cinematic, accessible guided archive that presents Spyros's real experience accurately.

**Architecture:** Keep the project dependency-free: semantic HTML holds the archive scenes, CSS owns the visual system and responsive layout, and a small JavaScript module manages the canvas field, scroll states, navigation, and reduced-motion behavior. Content stays in the document so it remains crawlable and usable without JavaScript.

**Tech Stack:** HTML5, CSS custom properties, Canvas 2D, vanilla JavaScript, Node built-in test runner.

## Global Constraints

- Use Manrope from Google Fonts; no other display font.
- Use a dark-only first release with near-black, off-white, and burnt orange.
- Do not mention HELIO or StyleEra in public copy.
- Present Uni Systems only as a current AI Engineering Internship.
- Lead archive evidence with the Developer's Day AI Challenge win.
- Honor `prefers-reduced-motion`; no sound and no scroll-jacking.
- Keep email, LinkedIn, GitHub, and a distinct `Resume.pdf` link.

---

### Task 1: Build the semantic archive structure

**Files:**
- Modify: `index.html`
- Test: `tests/portfolio.test.mjs`

**Interfaces:**
- Produces scene elements with `data-scene` for scroll-state code.
- Produces navigation anchors for `#archive`, `#contact`, and `Resume.pdf`.

- [ ] **Step 1: Write the failing test**

```js
test('the archive puts the award before the internship and names the internship accurately', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.ok(html.indexOf('AI Challenge Winner') < html.indexOf('AI Engineering Intern'));
  assert.match(html, /Current AI Engineering Internship/);
  assert.doesNotMatch(html, /HELIO|StyleEra/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/portfolio.test.mjs`
Expected: FAIL because the old site puts the internship content elsewhere and includes StyleEra.

- [ ] **Step 3: Replace the document with semantic hero, award, internship, hackathon, skills, and contact scenes**

```html
<section class="scene scene--award" data-scene id="archive">
  <p class="scene__index">01 / Recognition</p>
  <h2>AI Challenge Winner.</h2>
</section>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/portfolio.test.mjs`
Expected: PASS.

### Task 2: Establish the dark cinematic visual system

**Files:**
- Modify: `style.css`
- Test: `tests/portfolio.test.mjs`

**Interfaces:**
- Consumes scene classes from `index.html`.
- Produces CSS variables and responsive scene layout.

- [ ] **Step 1: Write the failing test**

```js
test('the stylesheet uses Manrope and exposes reduced-motion support', () => {
  const css = readFileSync('style.css', 'utf8');
  assert.match(css, /Manrope/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /#d[0-9a-f]{2,5}/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/portfolio.test.mjs`
Expected: FAIL because the existing stylesheet uses a different display font and palette.

- [ ] **Step 3: Replace legacy glass-card styling with scene-based black, off-white, burnt-orange rules**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/portfolio.test.mjs`
Expected: PASS.

### Task 3: Add restrained canvas and scroll behavior

**Files:**
- Modify: `main.js`
- Test: `tests/portfolio.test.mjs`

**Interfaces:**
- Consumes `#signalField` and `[data-scene]` elements.
- Produces a 2D animated field and `.is-visible` scene state.

- [ ] **Step 1: Write the failing test**

```js
test('motion code checks reduced-motion before requesting animation frames', () => {
  const script = readFileSync('main.js', 'utf8');
  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /requestAnimationFrame/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/portfolio.test.mjs`
Expected: FAIL because the old Three.js code is not structured around the new field.

- [ ] **Step 3: Implement a Canvas 2D field, IntersectionObserver scene reveals, and accessible menu control**

```js
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion) requestAnimationFrame(drawField);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/portfolio.test.mjs`
Expected: PASS.

### Task 4: Verify the completed static site

**Files:**
- Verify: `index.html`, `style.css`, `main.js`, `tests/portfolio.test.mjs`

- [ ] **Step 1: Run the complete behavior suite**

Run: `node --test tests/portfolio.test.mjs`
Expected: PASS with no failures.

- [ ] **Step 2: Serve the site locally and inspect desktop and mobile renders**

Run: `python -m http.server 4173`
Expected: Site opens at `http://localhost:4173` and no scene text clips or overlaps.

- [ ] **Step 3: Commit the focused rebuild**

```bash
git add index.html style.css main.js tests/portfolio.test.mjs docs/superpowers
git commit -m "feat: rebuild cinematic portfolio"
```

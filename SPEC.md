# Personal Portfolio Rebuild — Build Spec
 
## Context
Full rebuild of an existing personal website (AI Engineer portfolio). Nothing from
the old version carries over. Codebase is **vanilla HTML/CSS/JS** — no framework,
no build step implied by current tests (`index.html`, `style.css`, `main.js` at
project root).
 
## Concept
"Neural Console" — minimal identity surface, technical depth underneath. Not a
generic section-after-section portfolio. Inspired by (steal the *feel*, not the
literal content of):
- armory.framer.ai — dark aesthetic, animated background
- dashcreative.co — black + dark orange color combo
- paulkalkbrenner.net — minimalism, heavy but beautiful animation
Do NOT copy any of these directly. Blend: Armory's dark depth + dashcreative's
orange accent + restraint of the minimal sites.
 
## Hero / First Viewport (CONFIRMED, iterated multiple times — treat as locked)
- Just name + role. No location, no date (explicitly removed: "Athens, Greece / 2026").
- First name: lighter weight, NOT bold.
- Surname: orange accent color (exact hex NOT yet specified — flag for user).
- Animated background: black + orange motion field (implementation not yet
  specified — canvas vs WebGL vs CSS not decided in source chat).
- No mention of Uni Systems, hackathons, or the award on this screen — they live
  deeper in the page.
## Content Rules (CONFIRMED via test file — hard requirements)
- The **AI Challenge Winner** award must appear **before** the **AI Engineering
  Intern** mention in HTML source order. This is a strict ordering constraint,
  not just "give it emphasis."
- The internship must be described with the exact phrase:
  `Current AI Engineering Internship` (verbatim — this is regex-checked).
- The site must NEVER contain the strings `HELIO` or `StyleEra` (leftover
  branding from an earlier draft — explicitly banned).
- Hackathons: user attends them and wants that mentioned somewhere (no exact
  copy specified — flag for user).
## Typography & Motion (CONFIRMED via test file)
- Font: **Manrope** must appear in `style.css`.
- `prefers-reduced-motion` must be respected in **both** `style.css` and
  `main.js` — i.e. animations need a reduced-motion fallback in the CSS AND
  a JS-level check before running any animation logic.
## Full Structure (CONFIRMED FINAL)
1. **Identity Layer** — hero, as above.
2. **Signal Map** — skills section, styled as a connected node/systems diagram
   rather than a plain bullet list. Grouped: AI/ML, backend, data, tooling,
   research, deployment.
3. **Experience Timeline** — compact, log/checkpoint style. Uni Systems internship
   lives here (with the exact phrase above).
4. **Selected Work** — ONLY project: FittingRoom
   (https://fitting-room-landing-coral.vercel.app/). No other projects — user
   does not want additional projects padded in. Styled as a "case file," not a
   generic card.
5. **Achievements** — award(s), degrees, certifications. Award must be
   positioned so it appears before the internship in source order (see above).
   Hackathon attendance should also be represented here (exact copy/framing
   still open — see below).
6. **Playground** — small interactive experiments/visual demos (inspired by
   eclass.uoa.gr portfolio example).
7. **Contact Dock** — GitHub, LinkedIn, email, CV (CV = PDF already in repo,
   see Resume note below).
## Explicit Non-Goals
- No literal copy of any reference site's layout or copywriting.
- No "AI slop" generic template feel — this was the user's explicit complaint
  about the old site.
- No section-after-section boring scroll — structure should feel more unified/
  interactive than a stack of `<section>` blocks with headers.
## OPEN QUESTIONS — resolve with user before/while building
- [x] Orange hex: **`#E2672E`** (confirmed — the lighter of the two eyeballed options).
- [x] Background animation: **canvas-confirmed** (Armory uses `<canvas>` —
      JS/particle-driven, not CSS-only). Build the black+orange motion field
      as a canvas particle system, not a CSS gradient trick.
- [ ] Hackathon content: which hackathons, what to say about them — goes in
      the Achievements section alongside the award.
- [ ] Skills list — actual content for the "Signal Map" section (categories
      are set: AI/ML, backend, data, tooling, research, deployment — specific
      skills within each not yet listed).
## Carry-Over Feature (MUST PRESERVE from current repo)
- Clicking a skill in the skills section currently reveals descriptive text
  for that skill (expand/reveal interaction — exact current markup/JS not
  inspected here, pull it from the existing repo before rebuilding).
- This behavior must be preserved in the new "Signal Map" section: clicking a
  node/skill should show the same kind of explanatory text the current site
  shows on click. Don't lose this interaction just because the visual style
  of the section is changing to the node/systems-diagram look.
## Resume / CV
PDF already exists in the repo (exact filename/path not yet confirmed — check
repo root or an /assets or /docs folder). Contact Dock should link to it
directly rather than treating it as a placeholder.
 
## Test Requirements (must pass — these are non-negotiable, do not weaken them)
```js
// tests/portfolio.test.mjs
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
```
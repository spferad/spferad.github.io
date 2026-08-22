# Cinematic Portfolio Design

## Goal

Replace the existing portfolio entirely with a calm, cinematic guided archive
for Spyros Feradouros.

## Narrative

The site opens with only identity: Spyros Feradouros and a concise AI-focused
statement. The archive then reveals evidence in this order:

1. AI Challenge win at Developer's Day (November 2025).
2. Current AI Engineering Internship at Uni Systems (June 2026-present),
   described as an internship and learning role.
3. Hackathon rhythm, as a sustained interest in building under constraints.
4. Skills and a closing contact scene.

Project names HELIO and StyleEra are not used in public copy. GitHub is a
quiet external destination rather than a project gallery. The resume is a
distinct document action, separate from contact links.

## Visual System

- Dark-first composition only for the first release.
- Manrope is the display and UI typeface.
- Palette: near-black, warm off-white, and burnt orange.
- The surname is orange in the opening identity; the first name is off-white.
- No portrait in the first release. No light-mode toggle in the first release.
- Black-and-orange animated field lives behind the opening scene; it is slow,
  abstract, and honors reduced-motion preferences.

## Interaction and Accessibility

- Native vertical scrolling is the navigation model, with full-screen archive
  scenes that enter and leave slowly.
- Pointer movement only adds a subtle shift to the opening field.
- Motion is disabled or simplified for `prefers-reduced-motion`.
- All controls are keyboard reachable and carry accessible labels.
- The mobile layout remains vertical and avoids scroll-jacking.

## Content and Links

- Contact links: email, LinkedIn, GitHub.
- Resume link opens `Resume.pdf` and is visually distinct from contact links.
- Existing resume content is the source of truth for dates and claims.

## Deferred Ideas

The Rooms, Film Strip, Portrait Layer, and Light Mode concepts live in
`docs/portfolio-ideas.md` and are explicitly out of scope for this release.

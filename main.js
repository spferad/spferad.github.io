/* ============================================================
   Neural Console — main.js
   ============================================================ */

// ---------- Reduced motion (JS-level) ----------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// ============================================================
// HERO CANVAS — Armory-style cursor-reactive grid
//
// Performance strategy:
//  • Grid lines pre-rendered to an offscreen canvas (drawn ONCE on resize)
//  • Each frame: one drawImage() blit + sparse fillRect for lit cells
//  • Zero ctx.filter, zero ctx.stroke() per frame, zero gradient per frame
//  • requestAnimationFrame + manual 24fps cap = minimal CPU
//  • Mouse position activates nearby cells (Armory's signature effect)
// ============================================================
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d', { alpha: false });

  const CELL    = 32;           // grid cell size in px
  const BG      = '#080808';
  const OR      = [226, 103, 46]; // orange rgb
  const DECAY   = 0.90;         // per-frame alpha multiplier
  const FRAME_MS = 1000 / 24;   // target: 24 fps cap

  let cols, rows, grid;         // grid[r][c] = current alpha 0–1
  let offscreen;                 // pre-rendered grid lines
  let mouse = { x: -9999, y: -9999 };
  let last   = 0;

  // ---------- build offscreen grid (called once on resize) ----------
  function buildOffscreen() {
    offscreen        = document.createElement('canvas');
    offscreen.width  = canvas.width;
    offscreen.height = canvas.height;
    const og = offscreen.getContext('2d');

    // Fill background
    og.fillStyle = BG;
    og.fillRect(0, 0, offscreen.width, offscreen.height);

    // ALL grid lines in ONE beginPath → ONE stroke
    og.beginPath();
    for (let c = 0; c <= cols; c++) {
      const x = c * CELL;
      og.moveTo(x, 0);
      og.lineTo(x, offscreen.height);
    }
    for (let r = 0; r <= rows; r++) {
      const y = r * CELL;
      og.moveTo(0, y);
      og.lineTo(offscreen.width, y);
    }
    og.strokeStyle = `rgba(${OR[0]},${OR[1]},${OR[2]},0.07)`;
    og.lineWidth   = 0.5;
    og.stroke();  // ← THE ONLY STROKE CALL. Ever.
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols  = Math.ceil(canvas.width  / CELL) + 1;
    rows  = Math.ceil(canvas.height / CELL) + 1;
    grid  = Array.from({ length: rows }, () => new Float32Array(cols));
    buildOffscreen();
  }

  resize();
  window.addEventListener('resize', () => resize(), { passive: true });

  // Track mouse over the whole hero section
  const heroEl = canvas.parentElement;
  heroEl.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }, { passive: true });
  heroEl.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  // ---------- Static reduced-motion fallback ----------
  if (prefersReducedMotion) {
    buildOffscreen();
    ctx.drawImage(offscreen, 0, 0);
    return;
  }

  // ---------- Draw loop ----------
  function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - last < FRAME_MS) return;   // skip frames to cap fps
    last = ts;

    // 1. Blit pre-rendered grid (ONE gpu texture copy)
    ctx.drawImage(offscreen, 0, 0);

    // 2. Activate cells near mouse
    const mCol = Math.floor(mouse.x / CELL);
    const mRow = Math.floor(mouse.y / CELL);
    const RADIUS = 3;
    for (let dr = -RADIUS; dr <= RADIUS; dr++) {
      for (let dc = -RADIUS; dc <= RADIUS; dc++) {
        const r = mRow + dr, c = mCol + dc;
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        const dist = Math.sqrt(dr * dr + dc * dc);
        if (dist > RADIUS) continue;
        const strength = (1 - dist / RADIUS) * 0.6;
        if (grid[r][c] < strength) grid[r][c] = strength;
      }
    }

    // 3. Random ambient flickers (sparse — 1–2 per frame)
    if (Math.random() < 0.5) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (grid[r][c] < 0.08) grid[r][c] = 0.08 + Math.random() * 0.18;
    }

    // 4. Draw lit cells + decay — fake glow via 3 stacked rects, no blur
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = grid[r][c];
        if (a < 0.004) { grid[r][c] = 0; continue; }

        const x = c * CELL;
        const y = r * CELL;

        // Outer soft halo (large, very faint)
        ctx.fillStyle = `rgba(${OR[0]},${OR[1]},${OR[2]},${(a * 0.12).toFixed(3)})`;
        ctx.fillRect(x - 4, y - 4, CELL + 8, CELL + 8);

        // Mid glow ring
        ctx.fillStyle = `rgba(${OR[0]},${OR[1]},${OR[2]},${(a * 0.30).toFixed(3)})`;
        ctx.fillRect(x, y, CELL, CELL);

        // Core bright cell (inner 60%)
        const inset = Math.floor(CELL * 0.2);
        ctx.fillStyle = `rgba(${OR[0]},${OR[1]},${OR[2]},${(a * 0.65).toFixed(3)})`;
        ctx.fillRect(x + inset, y + inset, CELL - inset * 2, CELL - inset * 2);

        grid[r][c] *= DECAY;
      }
    }
  }

  requestAnimationFrame(draw);
})();






// ============================================================
// NAVBAR — scroll state
// ============================================================
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  let last = false;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 50;
    if (scrolled !== last) {
      navbar.classList.toggle('navbar--scrolled', scrolled);
      last = scrolled;
    }
  }, { passive: true });
})();


// ============================================================
// HAMBURGER — mobile nav
// ============================================================
(function () {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
})();


// ============================================================
// ACTIVE NAV — intersection observer
// ============================================================
(function () {
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id], div.timeline-flow[id]');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => obs.observe(s));
})();


// ============================================================
// TIMELINE CARDS — scroll reveal
// ============================================================
(function () {
  const cards = document.querySelectorAll('.tcard');
  if (!cards.length) return;

  if (prefersReducedMotion) {
    cards.forEach(el => el.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  cards.forEach(el => obs.observe(el));
})();


// ============================================================
// SIGNAL MAP CLUSTERS — scroll reveal (staggered)
// ============================================================
(function () {
  const clusters = document.querySelectorAll('.cluster');
  if (!clusters.length) return;

  if (prefersReducedMotion) {
    clusters.forEach(el => el.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.cluster'));
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('visible'), idx * 90);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  clusters.forEach(el => obs.observe(el));
})();


// ============================================================
// HERO PARALLAX — subtle lift on scroll
// ============================================================
(function () {
  if (prefersReducedMotion) return;
  const content   = document.querySelector('.hero-content');
  const scrollHint = document.querySelector('.scroll-hint');
  const hero      = document.querySelector('.hero');
  if (!content || !hero) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = hero.offsetHeight;
      if (y < h) {
        const p = y / h;
        content.style.transform = `translateY(${-y * 0.08}px)`;
        content.style.opacity   = String(Math.max(0, 1 - p * 2.5));
        if (scrollHint) scrollHint.style.opacity = String(1 - p * 6);
      }
      ticking = false;
    });
  }, { passive: true });
})();


// ============================================================
// SIGNAL MAP — node click (carry-over interaction)
// ============================================================
function activateNode(el, info) {
  const cluster = el.closest('.cluster');
  if (!cluster) return;
  const infoEl  = cluster.querySelector('.node-info');
  const nodes   = cluster.querySelectorAll('.node');
  const was     = el.classList.contains('active');

  nodes.forEach(n => n.classList.remove('active'));

  if (was) {
    // Collapse
    if (infoEl) { infoEl.textContent = ''; }
  } else {
    el.classList.add('active');
    if (infoEl) {
      infoEl.textContent = '';
      setTimeout(() => { infoEl.textContent = info; }, 120);
    }
  }
}
/* Page behaviour. The engine drives pinning and flow reveals; this file adds
   what is specific to this page: the folio, and two scroll-driven moves
   (prologue edit pass, teaching compile-on-scroll).
   Each move is a pure function of its act's published --sc-p, so scrolling
   back up rewinds it exactly. The page is complete without any of it. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  root.classList.add('js');

  /* ---------------------------------------------------------- folio -- */
  var folio = document.getElementById('folio');
  var btn = folio.querySelector('.folio__now');
  var no = document.getElementById('folioNo');
  var title = document.getElementById('folioTitle');
  var chapters = [].slice.call(document.querySelectorAll('.chapter'));

  btn.addEventListener('click', function () {
    btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
  });
  folio.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  });
  folio.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { btn.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('click', function (e) {
    if (!folio.contains(e.target)) btn.setAttribute('aria-expanded', 'false');
  });

  var current = null;
  function updateFolio() {
    var probe = window.innerHeight * 0.3;
    var found = chapters[0];
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].getBoundingClientRect().top <= probe) found = chapters[i];
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) found = chapters[chapters.length - 1];
    // The patch colour follows whatever is physically under the folio.
    var under = chapters[0];
    for (var k = 0; k < chapters.length; k++) {
      if (chapters[k].getBoundingClientRect().top <= 24) under = chapters[k];
    }
    if (folio.dataset.ground !== under.dataset.ground) folio.dataset.ground = under.dataset.ground;
    if (found === current) return;
    current = found;
    no.textContent = found.dataset.chapter;
    title.textContent = found.dataset.title;
  }

  /* -------------------------------------------- scroll-linked wipes --
     Headlines that reveal left to right once you have scrolled a little way
     past them, and retract right to left only when you scroll back up. Once
     fully revealed they stay put however far down you go. Progress depends only
     on where the element sits, and is eased toward its target every frame, so
     it never jitters or sits half-drawn by accident. */
  var scrubs = [].slice.call(document.querySelectorAll('[data-scrub]')).map(function (el) {
    return {
      el: el, cur: 0, shown: -1,
      lead: el.dataset.scrubFollow ? document.querySelector(el.dataset.scrubFollow) : el
    };
  });
  function scrubTarget(s) {
    var r = s.lead.getBoundingClientRect(), vh = window.innerHeight;
    // starts when the top is 60% of the way down the screen, finished at 13%
    return Math.min(1, Math.max(0, (0.60 * vh - r.top) / (0.47 * vh)));
  }
  function updateScrubs() {
    scrubs.forEach(function (s) {
      var t = scrubTarget(s);
      s.cur += (t - s.cur) * 0.09;
      if (Math.abs(t - s.cur) < 0.002) s.cur = t;
      var q = Math.round(s.cur * 400) / 400;
      if (q === s.shown) return;
      s.shown = q;
      s.el.style.clipPath = q >= 1 ? 'none' : 'inset(-0.4em ' + ((1 - q) * 100) + '% -0.4em 0)';
    });
  }

  /* -------------------------------------------------- the moves -- */
  var prologue = document.getElementById('prologue');
  var teaching = document.getElementById('teaching');

  // 1. Prologue: a draft that is proofread. State 0 is the draft, 5 the clean sentence.
  //    s1 strike "like" | s2 "am interested in" | s3 "worth solving" | s4 "and developing... them." | s5 clean
  var edit = document.getElementById('ledeEdit');
  var del = document.getElementById('ledeDel');
  var periodA = document.getElementById('ledePeriodA');
  var rest = document.getElementById('prologueRest');
  var groups = [].slice.call(edit.querySelectorAll('.g'));
  var EDIT_AT = [0.10, 0.28, 0.46, 0.64, 0.80];
  var lastEdit = -1;
  function measureWords() {
    groups.forEach(function (g) {
      var was = g.style.getPropertyValue('--mw');
      g.style.removeProperty('--mw');
      g.style.setProperty('--mw', (g.scrollWidth + 3) + 'px');
    });
  }
  var pending = null, lastShape = '', forceInstant = false;
  function wantShow(g, s) {
    if (g === del) return s < 5;
    if (g === periodA) return s < 3;
    if (g.dataset.grp) return s >= +g.dataset.grp + 1;
    return true;
  }
  // Move the words that stay from where they were to where they now are, as one
  // eased glide (FLIP). Layout changes instantly, but nothing visibly jumps.
  function glide(before) {
    var moved = [];
    groups.forEach(function (g) {
      var b = before.get(g);
      if (!b || !g.classList.contains('show')) return;
      var a = g.getBoundingClientRect();
      var dx = b.left - a.left, dy = b.top - a.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      g.style.transition = 'none';
      g.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      moved.push(g);
    });
    if (!moved.length) return;
    void edit.offsetWidth;
    moved.forEach(function (g) {
      g.style.transition = 'transform 820ms cubic-bezier(0.4, 0, 0.2, 1), opacity 520ms ease';
      g.style.transform = '';
      setTimeout(function () { g.style.transition = ''; }, 860);
    });
  }
  function commit(toShow, toHide, animate) {
    var before = new Map();
    if (animate) groups.forEach(function (g) { if (g.classList.contains('show')) before.set(g, g.getBoundingClientRect()); });
    toHide.forEach(function (g) { g.classList.remove('show', 'leaving'); });
    toShow.forEach(function (g) { g.classList.add('show'); });
    if (animate) glide(before);
  }
  function flushPending() {
    if (!pending) return;
    clearTimeout(pending.timer);
    commit(pending.show, pending.hide, false);
    pending = null;
  }
  // Reserve the sentence's finished height from the start, so the block never changes
  // size while it is edited and can sit centred in the screen without shifting.
  var ledeEl = document.querySelector('#prologue .lede');
  function measureLede() {
    var keep = lastEdit;
    forceInstant = true;
    ledeEl.style.minHeight = '';
    lastEdit = -1; renderPrologue(1);              // finished sentence
    var h = ledeEl.offsetHeight;
    lastEdit = -1; renderPrologue(keep <= 0 ? 0 : EDIT_AT[keep - 1]);
    forceInstant = false;
    ledeEl.style.minHeight = h + 'px';
  }
  function renderPrologue(p) {
    var s = 0;
    for (var i = 0; i < EDIT_AT.length; i++) if (p >= EDIT_AT[i]) s = i + 1;
    if (s === lastEdit) return;
    lastEdit = s;
    flushPending();
    var animate = edit.classList.contains('ready') && !forceInstant;
    // colour changes happen straight away
    del.classList.toggle('struck', s >= 1);
    edit.classList.toggle('clean', s >= 5);
    rest.classList.toggle('on', s >= 5);
    var toShow = [], toHide = [];
    groups.forEach(function (g) {
      var want = wantShow(g, s), has = g.classList.contains('show');
      if (want && !has) toShow.push(g);
      if (!want && has) toHide.push(g);
    });
    if (!toShow.length && !toHide.length) return;
    if (!animate) { commit(toShow, toHide, false); return; }
    if (toHide.length) {
      // leaving words fade out first, then the text closes up (and new words arrive) in one glide
      toHide.forEach(function (g) { g.classList.add('leaving'); });
      pending = { show: toShow, hide: toHide, timer: setTimeout(function () {
        var job = pending; pending = null;
        if (job) commit(job.show, job.hide, true);
      }, 280) };
    } else {
      commit(toShow, toHide, true);
    }
  }

  // 2. Teaching: a sample C program runs, one printf at a time; its output is the chapter.
  var lines = [].slice.call(teaching.querySelectorAll('.ln'));
  var outs = [].slice.call(teaching.querySelectorAll('.out'));
  var status = document.getElementById('runStatus');
  var N = lines.length, M = outs.length;
  var T_TYPE = 0.28, T_COMPILE = 0.38, T_RUN_END = 0.88;
  var lastKey = '';
  function renderTeaching(p) {
    var typed, runIdx, text;
    if (p < T_TYPE) { typed = Math.ceil((p / T_TYPE) * N); runIdx = -1; text = 'teach.c'; }
    else if (p < T_COMPILE) { typed = N; runIdx = -1; text = 'cc teach.c -o teach'; }
    else if (p < T_RUN_END) {
      typed = N;
      runIdx = Math.min(M - 1, Math.floor(((p - T_COMPILE) / (T_RUN_END - T_COMPILE)) * M));
      text = './teach';
    } else { typed = N; runIdx = M; text = './teach  (exit 0)'; }
    var key = typed + '|' + runIdx + '|' + text;
    if (key === lastKey) return;
    lastKey = key;
    lines.forEach(function (el, i) {
      var g = el.dataset.g, isPf = g !== undefined;
      el.classList.toggle('on', i < typed);
      el.classList.toggle('run-now', isPf && runIdx >= 0 && runIdx < M && +g === runIdx);
      el.classList.toggle('done', isPf && runIdx >= 0 && +g < runIdx);
    });
    outs.forEach(function (el, i) { el.classList.toggle('on', i <= runIdx); });
    status.textContent = text;
  }

  // 3. Koblenz: a departure board. ATHENS flips to KOBLENZ letter by letter while the
  //    real straight-line distance (1,876 km) counts down; then the dates flip in.
  var kob = document.getElementById('koblenz');
  var cityRow = document.getElementById('cityRow');
  var dateRow1 = document.getElementById('dateRow1');
  var dateRow2 = document.getElementById('dateRow2');
  var kmNum = document.getElementById('kmNum');
  var kobText = document.getElementById('koblenzText');
  var KM = 1876;
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', DIGITS = '0123456789';
  function buildCells(row, text, kind) {
    return text.split('').map(function (ch) {
      var el = document.createElement('div');
      el.className = 'cell' + (ch === ' ' ? ' gap' : '');
      var s = document.createElement('span');
      el.appendChild(s);
      row.appendChild(el);
      return { el: el, s: s, ch: ch, kind: kind, shown: null };
    });
  }
  var cityCells = buildCells(cityRow, 'KOBLENZ', 'L');
  var cityFrom = 'ATHENS ';
  var dateCells1 = buildCells(dateRow1, 'APR TO JUL', 'L');
  var dateCells2 = buildCells(dateRow2, '2027', 'D');
  function setCell(c, ch, spinning) {
    if (c.shown !== ch) { c.s.textContent = ch === ' ' ? '' : ch; c.shown = ch; }
    c.el.classList.toggle('spin', spinning);
    if (c.ch !== ' ') c.el.classList.toggle('blank', ch === ' ');
  }
  function spinChar(c, i, p) {
    var set = c.kind === 'D' ? DIGITS : LETTERS;
    return set.charAt((Math.floor(p * 150) + i * 7) % set.length);
  }
  var T_NUM = 0.14, T_SPIN = 0.30, T_LAND = 0.62, T_DATES = 0.72, T_TEXT = 0.90;
  var kmGo = document.getElementById('kmGo');
  var kmNote = document.getElementById('kmNote');
  var lastKob = '';
  function renderKoblenz(p) {
    var key = Math.round(p * 150) + '|' + (p >= T_TEXT);
    if (key === lastKob) return;
    lastKob = key;
    // ATHENS holds, then every flap spins together and the whole word lands as KOBLENZ at once.
    cityCells.forEach(function (c, i) {
      var ch, spin = false;
      if (p < T_SPIN) ch = cityFrom.charAt(i);
      else if (p >= T_LAND) ch = c.ch;
      else { ch = spinChar(c, i, p); spin = true; }
      setCell(c, ch, spin);
    });
    // The number stands alone first; the sentence is revealed as it starts to fall.
    var f = Math.min(1, Math.max(0, (p - T_NUM) / (T_LAND - T_NUM)));
    f = f * f * (3 - 2 * f);
    kmNum.textContent = Math.round(KM * (1 - f)).toLocaleString('en-US');
    kmGo.classList.toggle('on', p >= T_NUM);
    kmNote.classList.toggle('on', p >= T_NUM);
    [dateCells1, dateCells2].forEach(function (cells, r) {
      cells.forEach(function (c, i) {
        var end = T_DATES + 0.02 + (r * 10 + i) * 0.012, ch, spin = false;
        if (c.ch === ' ') ch = ' ';
        else if (p < T_DATES) ch = ' ';
        else if (p >= end) ch = c.ch;
        else { ch = spinChar(c, i + r * 3, p); spin = true; }
        setCell(c, ch, spin);
      });
    });
    kobText.classList.toggle('on', p >= T_TEXT);
  }

  var moves = [
    { act: prologue, render: renderPrologue, settled: 1 },
    { act: teaching, render: renderTeaching, settled: 1 },
    { act: kob, render: renderKoblenz, settled: 1 }
  ];

  /* ------------------------------------------------------ fit check -- */
  // A pinned stage is exactly one screen tall. If its content is taller than
  // the screen (a short laptop, a small phone) it would be clipped and
  // unreachable, so that chapter falls back to plain scrolling, fully revealed.
  function fits(act) {
    var stage = act.querySelector('[data-sc-stage]');
    var content = act.querySelector('[data-fit]');
    var padTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;
    return content.offsetHeight + padTop + 24 <= window.innerHeight;
  }
  function unpin(m) {
    var stage = m.act.querySelector('[data-sc-stage]');
    m.act.removeAttribute('data-sc-act');
    stage.removeAttribute('data-sc-stage');
    stage.classList.remove('sc-stage');
    m.act.classList.add('nopin');
    m.nopin = true;
    m.render(m.settled);
  }

  function readProgress(el) {
    var p = parseFloat(el.style.getPropertyValue('--sc-p'));
    return isNaN(p) ? 0 : p;
  }

  function start() {
    measureWords();
    measureLede();
    moves.forEach(function (m) {
      if (reduce || !fits(m.act)) unpin(m);
      else m.render(0);
    });
    if (window.ScrollCraft) ScrollCraft.mount(document.body);

    (function frame() {
      moves.forEach(function (m) { if (!m.nopin) m.render(readProgress(m.act)); });
      updateFolio();
      if (!reduce) updateScrubs();
      requestAnimationFrame(frame);
    })();
    updateFolio();
    // Transitions only switch on after the first state has been painted, so
    // the page never animates itself into its starting position.
    requestAnimationFrame(function () { requestAnimationFrame(function () { edit.classList.add('ready'); }); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measureWords(); measureLede(); }, 150); });
  }

  // Measure after the web fonts have settled, but never wait long for them.
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1200); })]).then(start);
})();

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

  /* -------------------------------------------------- the three moves -- */
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
  function renderPrologue(p) {
    var s = 0;
    for (var i = 0; i < EDIT_AT.length; i++) if (p >= EDIT_AT[i]) s = i + 1;
    if (s === lastEdit) return;
    lastEdit = s;
    del.classList.toggle('struck', s >= 1);
    del.classList.toggle('show', s < 5);
    periodA.classList.toggle('show', s < 3);
    groups.forEach(function (g) {
      var grp = g.dataset.grp;
      if (grp) g.classList.toggle('show', s >= +grp + 1);
    });
    edit.classList.toggle('clean', s >= 5);
    rest.classList.toggle('on', s >= 5);
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

  var moves = [
    { act: prologue, render: renderPrologue, settled: 1 },
    { act: teaching, render: renderTeaching, settled: 1 }
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
    moves.forEach(function (m) {
      if (reduce || !fits(m.act)) unpin(m);
      else m.render(0);
    });
    if (window.ScrollCraft) ScrollCraft.mount(document.body);

    (function frame() {
      moves.forEach(function (m) { if (!m.nopin) m.render(readProgress(m.act)); });
      updateFolio();
      requestAnimationFrame(frame);
    })();
    updateFolio();
    // Transitions only switch on after the first state has been painted, so
    // the page never animates itself into its starting position.
    requestAnimationFrame(function () { requestAnimationFrame(function () { edit.classList.add('ready'); }); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measureWords, 150); });
  }

  // Measure after the web fonts have settled, but never wait long for them.
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1200); })]).then(start);
})();

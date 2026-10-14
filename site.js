/* Page behaviour. The engine drives pinning and flow reveals; this file adds
   two things of its own: the folio, and the signature move (compile-on-scroll).
   The page is complete without it: output text is real markup, visible by default. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  if (window.ScrollCraft) ScrollCraft.mount(document.body);

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

  /* ---------------------------------------- signature: compile on scroll --
     Pure function of the act's published --sc-p, so scrolling back up rewinds
     it exactly. Phases: type the source, compile, run (one printf at a time,
     the matching output block appears), exit and hold. */
  var act = document.getElementById('teaching');
  var lines = [].slice.call(act.querySelectorAll('.ln'));
  var outs = [].slice.call(act.querySelectorAll('.out'));
  var status = document.getElementById('runStatus');
  var N = lines.length;
  var M = outs.length;
  var T_TYPE = 0.28, T_COMPILE = 0.38, T_RUN_END = 0.88;
  var lastKey = '';

  function render(p) {
    var typed, runIdx, text;
    if (p < T_TYPE) {
      typed = Math.ceil((p / T_TYPE) * N); runIdx = -1; text = 'teach.c';
    } else if (p < T_COMPILE) {
      typed = N; runIdx = -1; text = 'cc teach.c -o teach';
    } else if (p < T_RUN_END) {
      typed = N;
      runIdx = Math.min(M - 1, Math.floor(((p - T_COMPILE) / (T_RUN_END - T_COMPILE)) * M));
      text = './teach';
    } else {
      typed = N; runIdx = M; text = './teach  (exit 0)';
    }
    var key = typed + '|' + runIdx + '|' + text;
    if (key === lastKey) return;
    lastKey = key;

    lines.forEach(function (el, i) {
      var g = el.dataset.g;
      el.classList.toggle('on', i < typed);
      var isPf = g !== undefined;
      el.classList.toggle('run-now', isPf && runIdx >= 0 && runIdx < M && +g === runIdx);
      el.classList.toggle('done', isPf && runIdx >= 0 && +g < runIdx);
    });
    outs.forEach(function (el, i) { el.classList.toggle('on', i <= runIdx); });
    status.textContent = text;
  }

  function readProgress() {
    var p = parseFloat(act.style.getPropertyValue('--sc-p'));
    return isNaN(p) ? 0 : p;
  }

  if (reduce) {
    lines.forEach(function (el) { el.classList.add('on', 'done'); });
    outs.forEach(function (el) { el.classList.add('on'); });
    status.textContent = './teach  (exit 0)';
  } else {
    render(0);
  }

  function frame() {
    if (!reduce) render(readProgress());
    updateFolio();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  updateFolio();
})();

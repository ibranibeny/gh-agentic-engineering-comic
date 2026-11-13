/* Ship It, Dewi! · interactive comic reader (no dependencies) */
(function () {
  'use strict';
  var D = JSON.parse(document.getElementById('ep-data').textContent);
  var root = document.getElementById('reader');
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var LS = 'sid-progress-v1';
  var F = D.frames, N = F.length;
  var WORD_MS = 42;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function strip(h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent || ''; }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function avStyle(w, x) {
    var c = D.cast[w];
    return '--who:' + c.color + ';background-image:url(' + c.img[x || 'base'] + ');--avs:' + c.av[0] + '%;--avx:' + c.av[1] + '%;--avy:' + c.av[2] + '%';
  }

  var I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2.2-2.5 3.8M12 17.2h.01"/></svg>'
  };

  root.innerHTML =
    '<header class="rbar">' +
      '<a class="rb-home" href="' + esc(D.home) + '">' + I.back + '<span>Episodes</span></a>' +
      '<div class="rb-title"><b>S' + D.season + ' · EP ' + D.no + '</b><span>' + esc(D.title) + '</span></div>' +
      '<div class="rb-tools">' +
        '<button class="tb" type="button" data-act="log" aria-label="Story log (L)" title="Story log (L)">' + I.log + '</button>' +
        '<button class="tb" type="button" data-act="auto" aria-pressed="false" aria-label="Auto-play (A)" title="Auto-play (A)">' + I.play + '</button>' +
        '<button class="tb" type="button" data-act="text" aria-label="Text version (T)" title="Text version (T)">' + I.text + '</button>' +
        '<button class="tb" type="button" data-act="full" aria-label="Full screen (F)" title="Full screen (F)">' + I.full + '</button>' +
        '<button class="tb" type="button" data-act="help" aria-label="Keys and gestures (?)" title="Keys and gestures (?)">' + I.help + '</button>' +
      '</div>' +
    '</header>' +
    '<div class="stage-wrap"><div class="stage" tabindex="0" role="region" aria-roledescription="comic panel" aria-label="Comic panel. Press Space or the right arrow for the next panel.">' +
      '<div class="bgs"><img alt="" decoding="async"><img alt="" decoding="async"></div>' +
      '<div class="lines"></div>' +
      '<div class="chars" aria-hidden="true"></div>' +
      '<div class="sparks" aria-hidden="true"></div>' +
      '<div class="place" hidden></div>' +
      '<div class="caption" hidden></div>' +
      '<div class="sfxs" aria-hidden="true"></div>' +
      '<section class="card" hidden aria-label="Concept card"></section>' +
      '<section class="quiz" hidden aria-label="Quiz"></section>' +
      '<div class="bubble" hidden></div>' +
      '<section class="title-card" hidden></section>' +
      '<section class="end-card" hidden></section>' +
      '<div class="confetti" aria-hidden="true"></div>' +
      '<div class="flash"></div><div class="wipe"></div>' +
    '</div></div>' +
    '<footer class="rnav">' +
      '<button class="nav prev" type="button" data-act="prev">&#9664; Back</button>' +
      '<div class="prog"><div class="prog-bar" role="progressbar" aria-label="Episode progress" aria-valuemin="1" aria-valuemax="' + N + '"><i></i></div><span class="prog-txt"></span></div>' +
      '<button class="nav next" type="button" data-act="next">Next &#9654;</button>' +
    '</footer>' +
    '<div class="sr" aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"></div>';

  function $(s) { return root.querySelector(s); }
  var stage = $('.stage'), bgImgs = root.querySelectorAll('.bgs img'), charsEl = $('.chars'), sparks = $('.sparks');
  var placeEl = $('.place'), capEl = $('.caption'), sfxEl = $('.sfxs'), cardEl = $('.card'), quizEl = $('.quiz');
  var bubble = $('.bubble'), titleEl = $('.title-card'), endEl = $('.end-card'), confetti = $('.confetti');
  var flashEl = $('.flash'), wipeEl = $('.wipe'), sr = $('.sr');
  var btnPrev = $('.nav.prev'), btnNext = $('.nav.next'), progBar = $('.prog-bar'), progI = $('.prog-bar i'), progTxt = $('.prog-txt');
  var btnAuto = $('[data-act="auto"]');

  // ------------------------------------------------------------ preload
  var pre = [];
  Object.keys(D.bgs).forEach(function (b) { pre.push(D.bgs[b].src, D.bgs[b].sm); });
  Object.keys(D.cast).forEach(function (w) { var im = D.cast[w].img; Object.keys(im).forEach(function (x) { pre.push(im[x]); }); });
  setTimeout(function () { pre.forEach(function (u) { var i = new Image(); i.decoding = 'async'; i.src = u; }); }, 250);

  // ------------------------------------------------------------ model
  function blank() { return { bg: null, place: null, chars: {}, last: {}, speaker: null, prev: null, cap: null, card: null, bubble: null, quiz: null, sfx: [], fx: [], title: false, end: false, scene: false }; }
  function freeSlot(m, w) {
    var c = D.cast[w];
    if (c.kind === 'bit') return 'B';
    if (c.kind === 'villain') return 'C';
    var taken = {};
    Object.keys(m.chars).forEach(function (k) { taken[m.chars[k].s] = k; });
    var tries = [c.slot, m.last[w], 'R', 'L', 'C'];
    for (var i = 0; i < tries.length; i++) if (tries[i] && !taken[tries[i]]) return tries[i];
    return c.slot;
  }
  function place(m, w, x, s) {
    var c = m.chars[w];
    if (c) {
      if (x) c.x = x;
      if (s && s !== c.s) { evict(m, s, w); c.s = s; }
    } else {
      s = s || freeSlot(m, w);
      evict(m, s, w);
      m.chars[w] = { x: x || 'base', s: s };
    }
    m.last[w] = m.chars[w].s;
  }
  function evict(m, s, keep) {
    Object.keys(m.chars).forEach(function (k) { if (k !== keep && m.chars[k].s === s) delete m.chars[k]; });
  }
  function apply(m, op) {
    switch (op.t) {
      case 'title': m.title = true; break;
      case 'scene': m.bg = op.bg; m.place = op.place; m.chars = {}; m.speaker = null; m.prev = null; m.cap = null; m.card = null; m.bubble = null; m.scene = true; break;
      case 'cap': m.cap = op.h; m.bubble = null; m.speaker = null; break;
      case 'enter': place(m, op.w, op.x, op.s); break;
      case 'exit':
        if (op.w === 'all') m.chars = {}; else delete m.chars[op.w];
        if (m.speaker && !m.chars[m.speaker]) { m.speaker = null; m.bubble = null; }
        break;
      case 'say':
        place(m, op.w, op.x, op.s);
        if (m.speaker !== op.w) m.prev = m.speaker || m.prev;
        m.speaker = op.w; m.cap = null;
        m.bubble = { w: op.w, x: m.chars[op.w].x, k: op.k || 'say', h: op.h };
        break;
      case 'sfx': m.sfx.push(op); break;
      case 'fx': m.fx.push(op.fx); break;
      case 'card': m.card = { i: op.i, steps: 0 }; m.bubble = null; m.cap = null; break;
      case 'step': if (m.card) m.card.steps++; if (!op.say) m.bubble = null; break;
      case 'close': m.card = null; m.bubble = null; break;
      case 'quiz': m.quiz = op.i; m.bubble = null; m.cap = null; break;
      case 'end': m.end = true; break;
    }
  }
  function modelAt(k) {
    var m = blank();
    for (var f = 0; f <= k; f++) {
      m.sfx = []; m.fx = []; m.quiz = null; m.title = false; m.end = false; m.scene = false;
      for (var j = 0; j < F[f].length; j++) apply(m, F[f][j]);
    }
    return m;
  }

  // ------------------------------------------------------------ state
  var cur = -1, M = blank(), typingUntil = 0, typeTimer = 0, autoOn = false, autoTimer = 0;
  var prog = load(), mine = prog[D.id] || {};
  var quizState = mine.qs || {};
  var shape = 'wide', bgOn = 0, bgCur = null, domChars = {};

  function persist() {
    var p = load(), e = p[D.id] || {};
    e.f = Math.max(e.f || 0, cur); e.last = cur; e.n = N;
    if (cur === N - 1) e.done = true;
    e.qs = quizState;
    p[D.id] = e; p._last = D.id; save(p);
  }

  // ------------------------------------------------------------ rendering
  function setBg(bg, anim) {
    if (!bg || bg === bgCur) return;
    var b = D.bgs[bg], nxt = bgImgs[1 - bgOn], old = bgImgs[bgOn];
    var small = stage.clientWidth < 700;
    nxt.src = small ? b.sm : b.src;
    if (!anim) stage.classList.add('instant');
    nxt.classList.add('on'); old.classList.remove('on');
    bgOn = 1 - bgOn; bgCur = bg;
    if (!anim) setTimeout(function () { stage.classList.remove('instant'); }, 30);
  }

  function makeChar(w) {
    var c = D.cast[w];
    var fig = document.createElement('figure');
    fig.className = 'ch k-' + c.kind;
    fig.innerHTML = '<div class="hop"><div class="in"><img alt="" draggable="false"></div></div>';
    charsEl.appendChild(fig);
    return { fig: fig, img: fig.querySelector('img'), x: null, s: null };
  }
  function syncChars(m, anim) {
    Object.keys(m.chars).forEach(function (w) {
      var c = m.chars[w], d = domChars[w], isNew = !d;
      if (!d) d = domChars[w] = makeChar(w);
      d.fig.classList.remove('leaving');
      d.fig.setAttribute('data-slot', c.s);
      var k = D.cast[w].kind;
      d.fig.classList.toggle('mirror', k !== 'villain' && (c.s === 'R' || c.s === 'B'));
      if (d.x !== c.x) {
        d.img.src = D.cast[w].img[c.x] || D.cast[w].img.base;
        if (!isNew && anim) restart(d.fig, 'swap');
        d.x = c.x;
      }
      if (isNew && anim) restart(d.fig, 'entering');
      d.s = c.s;
    });
    Object.keys(domChars).forEach(function (w) {
      if (m.chars[w]) return;
      var d = domChars[w]; delete domChars[w];
      if (anim) { d.fig.classList.add('leaving'); setTimeout(function () { d.fig.remove(); }, 400); } else d.fig.remove();
    });
    Object.keys(domChars).forEach(function (w) {
      var f = domChars[w].fig, human = D.cast[w].kind === 'human';
      f.classList.toggle('speaking', m.speaker === w);
      f.classList.toggle('dim', !!m.speaker && m.speaker !== w);
      f.classList.toggle('away', human && !!m.speaker && m.speaker !== w && m.prev !== w);
    });
    if (anim && m.speaker && domChars[m.speaker] && !(m.card || m.quiz !== null)) restart(domChars[m.speaker].fig, 'talk');
  }

  function bubbleSide(m, w) {
    var s = m.chars[w] ? m.chars[w].s : 'L';
    if (shape === 'tall') return 'tall';
    if (s === 'C') {
      var hasL = false, hasR = false;
      Object.keys(m.chars).forEach(function (k) { if (m.chars[k].s === 'L') hasL = true; if (m.chars[k].s === 'R') hasR = true; });
      return (!hasL || hasR) ? 'CL' : 'CR';
    }
    return s;
  }
  function typeset(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = p; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return i;
  }
  function finishTyping() { clearTimeout(typeTimer); typingUntil = 0; bubble.classList.remove('typing'); scheduleAuto(); }
  function showBubble(b, m, anim) {
    if (!b) { bubble.hidden = true; bubble.className = 'bubble'; bubble.removeAttribute('data-key'); return; }
    var docked = !!(m.card || m.quiz !== null), c = D.cast[b.w];
    var side = docked ? 'docked' : bubbleSide(m, b.w);
    var key = cur + '|' + b.w + '|' + b.h.length + '|' + side + '|' + (b.fb || '');
    if (!anim && bubble.getAttribute('data-key') === key) return;
    bubble.setAttribute('data-key', key);
    bubble.style.setProperty('--who', c.color);
    var cls = 'bubble k-' + (b.k || 'say');
    if (docked) cls += ' docked';
    else if (side === 'tall') {
      cls += ' tail-down';
      var d = domChars[b.w], x = d ? d.fig.offsetLeft : stage.clientWidth / 2;
      var bw = stage.clientWidth * 0.92, left = stage.clientWidth * 0.04;
      bubble.style.setProperty('--tx', Math.max(8, Math.min(92, (x - left) / bw * 100)) + '%');
    } else {
      cls += ' at-' + side + ((side === 'L' || side === 'CR') ? ' tail-left' : ' tail-right');
    }
    bubble.className = cls;
    bubble.innerHTML = (docked ? '<span class="av" style="' + avStyle(b.w, b.x) + '"></span>' : '') +
      (b.k === 'shout' ? '<span class="shape-wrap"><span class="shape"></span></span>' : '') +
      '<span class="who">' + esc(c.name) + '</span><div class="txt">' + b.h + '</div>';
    bubble.hidden = false;
    sr.textContent = c.name + ': ' + strip(b.h);
    if (anim && !RM.matches) {
      var n = typeset(bubble.querySelector('.txt'));
      restart(bubble, 'pop'); bubble.classList.add('typing');
      typingUntil = Date.now() + n * WORD_MS + 260;
      clearTimeout(typeTimer); typeTimer = setTimeout(finishTyping, n * WORD_MS + 260);
    } else { bubble.classList.remove('typing', 'pop'); typingUntil = 0; }
  }

  function renderCard(m, anim) {
    if (!m.card) { cardEl.hidden = true; cardEl.removeAttribute('data-i'); return; }
    var c = D.cards[m.card.i];
    if (cardEl.getAttribute('data-i') !== String(m.card.i)) {
      cardEl.setAttribute('data-i', m.card.i);
      var kick = { card: 'Maya\u2019s whiteboard', screen: 'Real screenshot', code: 'Code', cmd: 'Copy & paste' }[c.k] || 'Concept';
      if (c.k === 'card' && D.season === 2) kick = 'Mission briefing';
      if (c.kick) kick = c.kick;
      cardEl.className = 'card k-' + c.k;
      cardEl.innerHTML = '<span class="card-k">' + esc(kick) + '</span><h2>' + esc(c.k === 'screen' ? c.title.replace('Real screenshot · ', 'From the real run · ') : c.title) + '</h2><div class="card-b">' + c.h + '</div>';
      cardEl.hidden = false;
      cardEl.scrollTop = 0;
      if (anim) restart(cardEl, 'open');
    }
    var steps = cardEl.querySelectorAll('[data-step]'), newest = null;
    Array.prototype.forEach.call(steps, function (s) {
      var on = (+s.getAttribute('data-step')) <= m.card.steps;
      if (on && !s.classList.contains('shown')) { s.classList.add('shown'); if (anim) { restart(s, 'lit'); newest = s; } }
      else if (!on) s.classList.remove('shown', 'lit');
    });
    if (newest && cardEl.scrollHeight > cardEl.clientHeight) {
      var top = newest.offsetTop - 12;
      cardEl.scrollTo({ top: top, behavior: RM.matches ? 'auto' : 'smooth' });
    }
  }

  function qs(i) { return quizState[i] || (quizState[i] = { t: [], ok: false, first: false }); }
  function renderQuiz(m, anim) {
    if (m.quiz === null) { quizEl.hidden = true; quizEl.removeAttribute('data-i'); return; }
    var q = D.quizzes[m.quiz], st = qs(m.quiz), L = 'ABCD';
    var html = '<span class="card-k">Quick quiz</span><h2>' + q.q + '</h2><div class="q-opts">';
    q.o.forEach(function (o, i) {
      var cls = 'q-opt', dis = '';
      if (st.ok && o.ok) cls += ' right';
      if (st.t.indexOf(i) >= 0) { cls += ' wrong'; dis = ' disabled'; }
      if (st.ok) dis = ' disabled';
      html += '<button type="button" class="' + cls + '" data-i="' + i + '"' + dis + '><span class="l">' + L[i] + '</span><span>' + o.h + '</span></button>';
    });
    html += '</div><div class="q-foot"><span>' + (st.ok ? (st.first ? 'Right on the first try!' : 'Solved.') : 'Pick an answer to continue.') + '</span>' +
      (st.ok ? '' : '<button type="button" class="linkbtn" data-act="skipquiz">Show the answer</button>') + '</div>';
    var fresh = quizEl.getAttribute('data-i') !== String(m.quiz);
    quizEl.innerHTML = html; quizEl.setAttribute('data-i', m.quiz); quizEl.hidden = false;
    if (fresh && anim) restart(quizEl, 'open');
  }
  function quizBubble(m) {
    if (m.quiz === null) return null;
    var q = D.quizzes[m.quiz], st = qs(m.quiz);
    if (st.ok) return { w: q.ok.w, x: q.ok.x, k: 'say', h: q.ok.h, fb: 'ok' };
    if (st.t.length) return { w: q.no.w, x: q.no.x, k: 'say', h: q.no.h, fb: 'no' + st.t.length };
    return null;
  }
  function answer(i, skip) {
    var q = D.quizzes[M.quiz], st = qs(M.quiz);
    if (st.ok) return;
    if (skip || q.o[i].ok) {
      st.ok = true; st.first = !skip && st.t.length === 0;
      if (!skip) burst();
    } else if (st.t.indexOf(i) < 0) st.t.push(i);
    renderQuiz(M, false);
    showBubble(quizBubble(M), M, true);
    if (!st.ok) { var b = quizEl.querySelector('[data-i="' + i + '"]'); if (b) restart(b, 'shake'); }
    persist(); updateNav();
    if (st.ok) setTimeout(function () { btnNext.focus({ preventScroll: true }); }, 50);
  }
  function burst() {
    if (RM.matches) return;
    confetti.innerHTML = '';
    var cols = ['#ffd23f', '#2dd4bf', '#ff6b5a', '#a78bfa', '#38bdf8', '#fff'];
    for (var i = 0; i < 46; i++) {
      var e = document.createElement('i');
      e.style.left = (Math.random() * 100) + '%';
      e.style.background = cols[i % cols.length];
      e.style.animationDelay = (Math.random() * 0.35) + 's';
      e.style.animationDuration = (1.1 + Math.random() * 0.9) + 's';
      confetti.appendChild(e);
    }
    setTimeout(function () { confetti.innerHTML = ''; }, 2600);
  }

  function renderSfx(m, anim) {
    sfxEl.innerHTML = '';
    m.sfx.forEach(function (s) {
      var e = document.createElement('div');
      e.className = 'sfx c-' + s.c + (anim && !RM.matches ? ' go' : '');
      e.style.left = s.px + '%'; e.style.top = s.py + '%';
      e.textContent = s.txt;
      sfxEl.appendChild(e);
    });
  }
  function renderFx(m, anim) {
    ['dark', 'speed', 'zoom'].forEach(function (f) { stage.classList.toggle('fx-' + f, m.fx.indexOf(f) >= 0); });
    sparks.innerHTML = '';
    if (!anim || RM.matches) return;
    if (m.fx.indexOf('shake') >= 0) restart(stage, 'fx-shake');
    if (m.fx.indexOf('flash') >= 0) restart(flashEl, 'go');
    if (m.fx.indexOf('sparkle') >= 0) {
      var d = m.speaker && domChars[m.speaker], cx = 50, cy = 30;
      if (d) { cx = (d.fig.offsetLeft / stage.clientWidth) * 100; cy = 26; }
      for (var i = 0; i < 7; i++) {
        var s = document.createElement('i');
        s.textContent = i % 2 ? '\u2726' : '\u2727';
        s.style.left = (cx + (Math.random() * 30 - 15)) + '%';
        s.style.top = (cy + (Math.random() * 30 - 15)) + '%';
        s.style.animationDelay = (i * 0.09) + 's';
        sparks.appendChild(s);
      }
    }
  }

  function renderTitle(m, anim) {
    if (!m.title) { titleEl.hidden = true; return; }
    var e = load()[D.id] || {};
    var cast = Object.keys(D.cast).filter(function (w) { return D.cast[w].kind !== 'villain'; }).slice(0, 6)
      .map(function (w) { return '<span title="' + esc(D.cast[w].name) + '" style="' + avStyle(w, 'base') + '"></span>'; }).join('');
    var resume = (e.last > 1 && e.last < N - 1) ? '<button type="button" class="big-btn alt" data-act="resume">Resume at panel ' + (e.last + 1) + '</button>' : '';
    var label = D.season === 1 ? 'Season 1 · Learn the concepts' : 'Season 2 · The workshop story';
    titleEl.innerHTML = '<div class="tc-bg" style="background-image:url(' + D.bgs[D.bg].sm + ')"></div><div class="tc-lines"></div>' +
      '<div class="tc-in"><span class="tc-no">' + esc(label) + ' · EP ' + D.no + '</span>' +
      '<h1 class="tc-title">' + esc(D.title) + '</h1><p class="tc-sub">' + esc(D.subtitle) + '</p>' +
      '<div class="tc-cast">' + cast + '</div>' +
      '<div class="tc-btns"><button type="button" class="big-btn" data-act="start">' + (e.done ? 'Read again' : 'Start') + ' &#9654;</button>' + resume + '</div>' +
      '<p class="tc-hint">Tap or click the panel to continue &#183; left edge or &#8592; to go back</p></div>';
    titleEl.hidden = false;
    var bi = titleEl.querySelector('.tc-bg'); var hi = new Image(); hi.onload = function () { bi.style.backgroundImage = 'url(' + D.bgs[D.bg].src + ')'; }; hi.src = D.bgs[D.bg].src;
    if (anim) restart(titleEl, 'go');
  }
  function renderEnd(m, anim) {
    if (!m.end) { endEl.hidden = true; return; }
    var nq = D.quizzes.length, first = 0;
    for (var i = 0; i < nq; i++) if (quizState[i] && quizState[i].first) first++;
    var learn = D.learn.map(function (l) { return '<li>' + l + '</li>'; }).join('');
    var src = D.sources.map(function (s) { return '<li><a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a></li>'; }).join('');
    var btns = '';
    if (D.chapter) btns += '<a class="big-btn teal" href="' + esc(D.chapter.href) + '" target="_blank" rel="noopener">Do it hands-on: Chapter ' + D.chapter.n + ' (' + esc(D.chapter.min) + ') &#8599;</a>';
    if (D.next) btns += '<a class="big-btn" href="' + esc(D.next.href) + '">Next: ' + esc(D.next.label) + ' &#183; ' + esc(D.next.title) + ' &#9654;</a>';
    btns += '<button type="button" class="big-btn alt" data-act="replay">Read again</button><a class="big-btn alt" href="' + esc(D.home) + '">All episodes</a>';
    var quiz = nq ? '<p class="ec-quiz">Quiz: ' + first + ' of ' + nq + ' right on the first try.</p>' : '';
    endEl.innerHTML = '<div class="ec-in"><span class="stamp">' + (D.next ? 'Episode clear!' : 'Mission complete!') + '</span>' + quiz +
      '<div class="ec-grid"><div class="ec-box"><h3>What you learned</h3><ul>' + learn + '</ul></div>' +
      '<div class="ec-box"><h3>Sources</h3><ul>' + src + '</ul></div></div>' +
      '<div class="ec-btns">' + btns + '</div></div>';
    endEl.hidden = false; endEl.scrollTop = 0;
    if (anim) restart(endEl, 'go');
  }

  function updateNav() {
    btnPrev.disabled = cur <= 0;
    var atEnd = cur >= N - 1;
    var waitQuiz = M.quiz !== null && !qs(M.quiz).ok;
    btnNext.classList.toggle('wait', waitQuiz);
    btnNext.innerHTML = atEnd ? (D.next ? 'Next episode &#9654;' : 'Episodes &#9654;') : (cur === 0 ? 'Start &#9654;' : 'Next &#9654;');
    var pct = N > 1 ? cur / (N - 1) * 100 : 100;
    progI.style.width = pct + '%';
    progBar.setAttribute('aria-valuenow', cur + 1);
    progTxt.textContent = (cur + 1) + ' / ' + N;
  }

  function render(m, anim) {
    titleEl.hidden = !m.title;
    stage.classList.toggle('has-card', !!(m.card || m.quiz !== null));
    setBg(m.bg || D.bg, anim);
    if (m.scene && anim && !RM.matches) restart(wipeEl, 'go');
    placeEl.hidden = !m.place;
    if (m.place) placeEl.innerHTML = '<span>&#128205; ' + esc(m.place) + '</span>';
    if (m.cap) {
      var was = capEl.innerHTML;
      capEl.innerHTML = m.cap; capEl.hidden = false;
      if (anim && was !== m.cap) restart(capEl, 'pop');
      sr.textContent = strip(m.cap);
    } else capEl.hidden = true;
    syncChars(m, anim);
    renderCard(m, anim);
    renderQuiz(m, anim);
    showBubble(m.bubble || quizBubble(m), m, anim && (!!m.bubble || false));
    renderSfx(m, anim);
    renderFx(m, anim);
    renderTitle(m, anim);
    renderEnd(m, anim);
    if (m.quiz !== null && !m.bubble) sr.textContent = 'Quiz: ' + strip(D.quizzes[m.quiz].q);
    updateNav();
  }

  function go(k, anim) {
    k = Math.max(0, Math.min(N - 1, k));
    clearTimeout(autoTimer);
    var forward = k === cur + 1;
    cur = k; M = modelAt(k);
    render(M, anim !== false && forward);
    persist();
    try { history.replaceState(null, '', k ? '#p' + (k + 1) : location.pathname + location.search); } catch (e) { /* file */ }
    if (k === N - 1) { setAuto(false); }
    scheduleAuto();
  }
  function next() {
    if (typingUntil && Date.now() < typingUntil) { finishTyping(); return; }
    if (M.quiz !== null && !qs(M.quiz).ok) { toast('Pick an answer first, or select "Show the answer".'); restart(quizEl, 'open'); return; }
    if (cur >= N - 1) { location.href = D.next ? D.next.href : D.home; return; }
    go(cur + 1, true);
  }
  function prev() { if (cur > 0) go(cur - 1, false); }

  // ------------------------------------------------------------ auto-play
  function setAuto(on) {
    autoOn = on; btnAuto.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnAuto.innerHTML = on ? I.pause : I.play;
    clearTimeout(autoTimer);
    if (on) scheduleAuto();
  }
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!autoOn || cur >= N - 1) return;
    if (M.quiz !== null && !qs(M.quiz).ok) return;
    var text = strip((M.bubble && M.bubble.h) || M.cap || '');
    var n = text.split(/\s+/).filter(Boolean).length;
    var wait = Math.max(2200, Math.min(9000, 1500 + n * 280));
    if (M.card && !M.bubble) wait = 3500;
    if (typingUntil) wait += Math.max(0, typingUntil - Date.now());
    autoTimer = setTimeout(function () { if (autoOn) next(); }, wait);
  }

  // ------------------------------------------------------------ panels
  var panel = null, scrim = null, lastFocus = null;
  function closePanel() {
    if (panel) { panel.remove(); panel = null; }
    if (scrim) { scrim.remove(); scrim = null; }
    if (lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
  }
  function openPanel(title, body) {
    closePanel(); lastFocus = document.activeElement;
    scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.addEventListener('click', closePanel);
    panel = document.createElement('aside'); panel.className = 'panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', title);
    panel.innerHTML = '<div class="panel-h"><h2>' + esc(title) + '</h2><button type="button" class="tb" data-act="close" aria-label="Close">&#10005;</button></div><div class="panel-b">' + body + '</div>';
    document.body.appendChild(scrim); document.body.appendChild(panel);
    panel.addEventListener('click', function (e) {
      var j = e.target.closest('[data-go]');
      if (j) { var k = +j.getAttribute('data-go'); closePanel(); go(k, false); return; }
      if (e.target.closest('[data-act="close"]')) closePanel();
    });
    var f = panel.querySelector('.log-i.cur') || panel.querySelector('button');
    if (f) { f.focus({ preventScroll: true }); if (f.scrollIntoView) f.scrollIntoView({ block: 'center' }); }
  }
  function openLog() {
    var h = '';
    for (var f = 1; f <= cur; f++) {
      F[f].forEach(function (op) {
        var c = f === cur ? ' cur' : '';
        if (op.t === 'scene') h += '<p class="log-scene">&#128205; ' + esc(op.place) + '</p>';
        else if (op.t === 'say') h += '<button type="button" class="log-i' + c + '" data-go="' + f + '"><b style="--c:' + D.cast[op.w].color + '">' + esc(D.cast[op.w].name) + '</b>' + esc(strip(op.h)) + '</button>';
        else if (op.t === 'cap') h += '<button type="button" class="log-i' + c + '" data-go="' + f + '"><em>' + esc(strip(op.h)) + '</em></button>';
        else if (op.t === 'card') h += '<button type="button" class="log-i' + c + '" data-go="' + f + '"><em>&#9635; ' + esc(D.cards[op.i].title) + '</em></button>';
        else if (op.t === 'quiz') h += '<button type="button" class="log-i' + c + '" data-go="' + f + '"><em>&#10067; ' + esc(strip(D.quizzes[op.i].q)) + '</em></button>';
      });
    }
    openPanel('Story log', h || '<p>Nothing yet. Start reading!</p>');
  }
  function openHelp() {
    openPanel('Keys and gestures', '<dl class="keys">' +
      '<dt><kbd>Space</kbd> <kbd>&#8594;</kbd> <kbd>Enter</kbd></dt><dd>Next panel (finishes the text first)</dd>' +
      '<dt><kbd>&#8592;</kbd></dt><dd>Previous panel</dd>' +
      '<dt>Tap / click</dt><dd>Next panel; the left edge goes back</dd>' +
      '<dt>Swipe</dt><dd>Left for next, right for back</dd>' +
      '<dt><kbd>L</kbd></dt><dd>Story log: jump to any line you have read</dd>' +
      '<dt><kbd>A</kbd></dt><dd>Auto-play on or off</dd>' +
      '<dt><kbd>T</kbd></dt><dd>Text version of the whole episode</dd>' +
      '<dt><kbd>F</kbd></dt><dd>Full screen</dd>' +
      '<dt><kbd>Home</kbd></dt><dd>Back to the title panel</dd>' +
      '<dt><kbd>Esc</kbd></dt><dd>Close a panel or picture</dd></dl>' +
      '<p style="color:var(--muted);font-size:14px">Your place in each episode is saved in this browser.</p>');
  }
  function textMode(on) {
    document.body.classList.toggle('textmode', on);
    if (on) { setAuto(false); window.scrollTo(0, 0); var h = document.querySelector('#transcript h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
    else stage.focus({ preventScroll: true });
  }
  function fullscreen() {
    var d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { var el = document.documentElement; var rq = el.requestFullscreen || el.webkitRequestFullscreen; if (rq) rq.call(el); }
  }
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) { var fb = $('[data-act="full"]'); if (fb) fb.hidden = true; }
  var toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.hidden = false; restart(toastEl, 'toast');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 2200);
  }
  function lightbox(img) {
    var lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Screenshot');
    lb.innerHTML = '<img alt=""><p></p>';
    lb.querySelector('img').src = img.src; lb.querySelector('img').alt = img.alt; lb.querySelector('p').textContent = img.alt + ' (click or press Esc to close)';
    lb.tabIndex = -1;
    function close() { lb.remove(); document.removeEventListener('keydown', key, true); stage.focus({ preventScroll: true }); }
    function key(e) { e.stopPropagation(); if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } }
    lb.addEventListener('click', close); document.addEventListener('keydown', key, true);
    document.body.appendChild(lb); lb.focus();
  }
  function copyText(btn) {
    var pre = btn.parentNode.querySelector('pre');
    var t = pre ? pre.textContent : '';
    function ok() { btn.textContent = 'Copied'; btn.classList.add('done'); setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1600); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, function () { fallback(); });
    else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Select the text and copy it'); } ta.remove(); }
  }

  // ------------------------------------------------------------ events
  function act(a, el) {
    switch (a) {
      case 'next': next(); break;
      case 'prev': prev(); break;
      case 'start': go(1, true); break;
      case 'resume': var e = load()[D.id] || {}; go(e.last || 1, false); break;
      case 'replay': go(0, false); go(1, true); break;
      case 'log': openLog(); break;
      case 'help': openHelp(); break;
      case 'auto': setAuto(!autoOn); if (autoOn) toast('Auto-play on. Press A to stop.'); break;
      case 'text': textMode(true); break;
      case 'comic': textMode(false); break;
      case 'full': fullscreen(); break;
      case 'skipquiz': answer(-1, true); break;
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a && (root.contains(a) || a.closest('#transcript'))) { e.preventDefault(); act(a.getAttribute('data-act'), a); return; }
  });
  stage.addEventListener('click', function (e) {
    if (e.target.closest('[data-act]')) return;
    var cp = e.target.closest('[data-copy]'); if (cp) { copyText(cp); return; }
    var z = e.target.closest('.shot-zoom'); if (z) { lightbox(z.querySelector('img')); return; }
    var qb = e.target.closest('.q-opt'); if (qb) { if (!qb.disabled) answer(+qb.getAttribute('data-i'), false); return; }
    if (e.target.closest('a, button, pre, input, textarea, select, .no-adv')) return;
    var sel = window.getSelection && String(window.getSelection());
    if (sel && sel.length > 1) return;
    var r = stage.getBoundingClientRect();
    if (!M.title && !M.end && (e.clientX - r.left) < r.width * 0.2 && cur > 0) { prev(); return; }
    if (M.end) return;
    next();
  });
  var tx = 0, ty = 0, tt = 0;
  stage.addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; tx = t.clientX; ty = t.clientY; tt = Date.now(); }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - tt < 700) {
      if (e.target.closest('pre, .vs, .card, .quiz')) return;
      e.preventDefault();
      if (dx < 0) next(); else prev();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (document.body.classList.contains('textmode')) { if (e.key === 'Escape') textMode(false); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (panel) { if (e.key === 'Escape') { e.preventDefault(); closePanel(); } return; }
    var onBtn = tag === 'button' || tag === 'a';
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': e.preventDefault(); next(); break;
      case ' ': case 'Enter': if (onBtn) return; e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); go(0, false); break;
      case 'l': case 'L': openLog(); break;
      case 'a': case 'A': act('auto'); break;
      case 't': case 'T': textMode(true); break;
      case 'f': case 'F': fullscreen(); break;
      case '?': openHelp(); break;
      case '1': case '2': case '3': case '4':
        if (M.quiz !== null && !qs(M.quiz).ok) { var i = +e.key - 1; if (i < D.quizzes[M.quiz].o.length && qs(M.quiz).t.indexOf(i) < 0) answer(i, false); }
        break;
    }
  });
  var wrapEl = root.querySelector('.stage-wrap');
  function measure() {
    var cs = getComputedStyle(wrapEl);
    var W = wrapEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var H = wrapEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (W < 40 || H < 40) return;
    var r = W / H, w, h, s;
    if (r < 1) { s = 'tall'; w = W; h = H; }
    else {
      s = 'wide';
      var ar = Math.max(4 / 3, Math.min(16 / 9, r));
      if (r > ar) { h = H; w = H * ar; } else { w = W; h = W / ar; }
    }
    stage.style.width = Math.floor(w) + 'px'; stage.style.height = Math.floor(h) + 'px'; stage.style.aspectRatio = 'auto';
    stage.setAttribute('data-ar', s === 'tall' ? 'tall' : ((w / h) < 1.55 ? 'mid' : 'wide'));
    if (s !== shape) { shape = s; stage.setAttribute('data-shape', s); if (cur >= 0) render(M, false); }
  }
  if (window.ResizeObserver) new ResizeObserver(measure).observe(wrapEl); else window.addEventListener('resize', measure);
  stage.setAttribute('data-shape', shape); measure();
  window.addEventListener('hashchange', function () {
    var mm = /^#p(\d+)$/.exec(location.hash);
    if (mm) { var k = Math.max(0, Math.min(N - 1, (+mm[1]) - 1)); if (k !== cur) go(k, false); }
  });

  // ------------------------------------------------------------ start
  var start = 0, m = /^#p(\d+)$/.exec(location.hash);
  if (m) start = Math.max(0, Math.min(N - 1, (+m[1]) - 1));
  go(start, false);
  if (start === 0) { M = modelAt(0); render(M, true); }
  setTimeout(function () { stage.focus({ preventScroll: true }); }, 60);
})();

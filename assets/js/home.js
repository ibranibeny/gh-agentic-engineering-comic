/* Ship It, Dewi! · landing page progress */
(function () {
  'use strict';
  var LS = 'sid-progress-v1';
  var eps = JSON.parse(document.getElementById('home-data').textContent);
  function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function paint() {
    var p = load(), firstOpen = null, inProg = null;
    eps.forEach(function (e) {
      var card = document.querySelector('.ep[data-ep="' + e.id + '"]');
      if (!card) return;
      var st = p[e.id] || {}, chip = card.querySelector('[data-state]'), bar = card.querySelector('.ep-bar i');
      var pct = st.done ? 100 : Math.round(((st.f || 0) / Math.max(1, e.n - 1)) * 100);
      bar.style.width = pct + '%';
      chip.className = 'ep-state';
      if (st.done) { chip.textContent = 'Read'; chip.classList.add('done'); }
      else if (st.f > 0) { chip.textContent = pct + '%'; chip.classList.add('prog'); if (!inProg) inProg = e; }
      else chip.textContent = '';
      if (!st.done && !firstOpen) firstOpen = e;
    });
    var btn = document.querySelector('[data-continue]'), note = document.querySelector('[data-resume]');
    var target = inProg || firstOpen;
    if (btn && target && (inProg || Object.keys(p).length)) {
      btn.href = target.id + '.html';
      btn.innerHTML = 'Continue: ' + target.label + ' &#9654;';
      if (note) { note.hidden = false; note.textContent = 'Up next: ' + target.label + ' · ' + target.title; }
    } else if (btn && !target) {
      btn.innerHTML = 'Read again from the start &#9654;';
      if (note) { note.hidden = false; note.textContent = 'You have read every episode. Nice work!'; }
    }
  }
  paint();
  window.addEventListener('pageshow', paint);
  var r = document.querySelector('[data-reset]');
  if (r) r.addEventListener('click', function () {
    try { localStorage.removeItem(LS); } catch (e) { /* noop */ }
    location.reload();
  });
})();

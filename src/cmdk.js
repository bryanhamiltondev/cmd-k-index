/*!
 * cmdk-index - a command palette that indexes itself
 * https://github.com/bryanhamiltondev/cmd-k-index
 *
 * Zero dependencies, zero config. The page's own same-origin links ARE
 * the index: point it at a page and the palette can navigate it, with no
 * JSON manifest to build, ship, or keep in sync. Add manual entries for
 * the few destinations a link can't express.
 *
 * Extracted from production (a 1,000-page site's homepage rack), where it
 * ships as one worker-injected block. This file is the same logic
 * generalized: it builds its own overlay if the page has none.
 *
 * Usage:
 *   <script src="cmdk.js"></script>
 * or with custom entries:
 *   <script src="cmdk.js" data-cmdk-pins='[["stats dashboard","/stats.php"]]'></script>
 *
 * MIT License
 */
(function () {
  'use strict';

  function buildDom() {
    var ov = document.createElement('div');
    ov.className = 'cmdk-ov';
    ov.innerHTML =
      '<div class="cmdk-panel" role="dialog" aria-label="Command palette">' +
      '<input class="cmdk-in" type="text" placeholder="type to jump..." aria-label="Search this page">' +
      '<div class="cmdk-list"></div>' +
      '<div class="cmdk-hint">esc to close</div>' +
      '</div>';
    document.body.appendChild(ov);
    return { ov: ov, inp: ov.querySelector('.cmdk-in'), list: ov.querySelector('.cmdk-list') };
  }

  function findDom() {
    var ov = document.querySelector('.cmdk-ov');
    if (!ov) return buildDom();
    return { ov: ov, inp: ov.querySelector('.cmdk-in'), list: ov.querySelector('.cmdk-list') };
  }

  var d = findDom();
  var ov = d.ov, inp = d.inp, list = d.list;

  /* ---- index: every same-origin link already on the page ---- */
  var INDEX = [];
  Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
    var h = a.getAttribute('href');
    if (!h || h.charAt(0) === '#') return;
    var abs;
    try { abs = new URL(h, location.href); } catch (e) { return; }
    if (abs.origin !== location.origin) return;
    var t = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length > 70) return;
    for (var i = 0; i < INDEX.length; i++) { if (INDEX[i].u === abs.pathname + abs.hash) return; }
    INDEX.push({ t: t, u: abs.pathname + abs.hash });
  });

  /* ---- pins: destinations no link can express (raw selectors, APIs) ---- */
  var pins = document.currentScript && document.currentScript.getAttribute('data-cmdk-pins');
  if (pins) {
    try {
      JSON.parse(pins).forEach(function (p) {
        for (var i = 0; i < INDEX.length; i++) { if (INDEX[i].u === p[1]) return; }
        INDEX.push({ t: p[0], u: p[1] });
      });
    } catch (e) { /* bad pins attribute: palette still works, pins skipped */ }
  }

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hl(t, q) {
    if (!q) return esc(t);
    var i = t.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(t);
    return esc(t.slice(0, i)) + '<b>' + esc(t.slice(i, i + q.length)) + '</b>' + esc(t.slice(i + q.length));
  }

  var sel = 0, items = [];
  function render(q) {
    q = q.trim();
    items = INDEX.filter(function (x) {
      return !q || x.t.toLowerCase().indexOf(q.toLowerCase()) > -1 || x.u.toLowerCase().indexOf(q.toLowerCase()) > -1;
    }).slice(0, 12);
    sel = 0;
    list.innerHTML = items.length
      ? items.map(function (x, i) {
          return '<div class="cmdk-it' + (i === 0 ? ' sel' : '') + '" data-i="' + i + '">' + hl(x.t, q) + '<span class="u">' + esc(x.u) + '</span></div>';
        }).join('')
      : '<div class="cmdk-none">nothing matches "' + esc(q) + '"</div>';
  }
  function mark() {
    Array.prototype.forEach.call(list.querySelectorAll('.cmdk-it'), function (el, i) { el.classList.toggle('sel', i === sel); });
    var s = list.querySelector('.sel');
    if (s) s.scrollIntoView({ block: 'nearest' });
  }
  function go() { if (items[sel]) location.href = items[sel].u; close(); }
  function open() { ov.classList.add('on'); inp.value = ''; render(''); setTimeout(function () { inp.focus(); }, 0); }
  function close() { ov.classList.remove('on'); inp.blur(); }
  function toggle() { ov.classList.contains('on') ? close() : open(); }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggle(); return; }
    if (!ov.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); go(); }
  });
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  list.addEventListener('click', function (e) { var it = e.target.closest('.cmdk-it'); if (it) { sel = +it.getAttribute('data-i'); go(); } });
  list.addEventListener('mousemove', function (e) { var it = e.target.closest('.cmdk-it'); if (it) { sel = +it.getAttribute('data-i'); mark(); } });
})();

/* JADUYA — Home
 * Bottom Sheet: peek(home_1) ↔ expanded(home_2)
 * 두 Figma 프레임을 하나의 화면에서 상태로 전환한다.
 */
(function () {
  'use strict';

  var SHEET_TOP = { peek: 575, expanded: 113 };
  var DRAG_THRESHOLD = 40; // px

  var app = document.getElementById('app');
  var sheet = document.getElementById('sheet');
  var handle = document.getElementById('sheetHandle');
  var scroll = document.getElementById('sheetScroll');

  if (!app || !sheet || !handle) return;

  var state = 'peek';
  var drag = null;

  function setState(next) {
    if (next === state) return;
    state = next;
    app.dataset.sheetState = next;
    handle.setAttribute('aria-expanded', String(next === 'expanded'));
    handle.setAttribute('aria-label', next === 'expanded' ? '대시보드 접기' : '대시보드 펼치기');
    if (next === 'peek' && scroll) scroll.scrollTop = 0;
  }

  function toggle() {
    setState(state === 'peek' ? 'expanded' : 'peek');
  }

  /* ---- Drag ---- */

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    drag = { id: e.pointerId, startY: e.clientY, y: e.clientY, moved: false };
    handle.setPointerCapture(e.pointerId);
    app.classList.add('is-dragging');
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.y = e.clientY;

    var delta = drag.y - drag.startY;
    if (Math.abs(delta) > 3) drag.moved = true;

    var base = SHEET_TOP[state];
    var top = Math.min(SHEET_TOP.peek, Math.max(SHEET_TOP.expanded, base + delta));
    sheet.style.top = top + 'px';
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;

    var delta = drag.y - drag.startY;
    var moved = drag.moved;

    sheet.style.top = '';
    app.classList.remove('is-dragging');
    handle.releasePointerCapture(drag.id);
    drag = null;

    if (!moved) {
      toggle();
      return;
    }
    if (delta <= -DRAG_THRESHOLD) setState('expanded');
    else if (delta >= DRAG_THRESHOLD) setState('peek');
  }

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerUp);

  /* ---- Keyboard ---- */

  handle.addEventListener('keydown', function (e) {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggle();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setState('expanded');
        break;
      case 'ArrowDown':
        e.preventDefault();
        setState('peek');
        break;
    }
  });

  /* ---- Peek 상태에서 시트를 위로 스크롤하면 펼친다 ---- */

  sheet.addEventListener('wheel', function (e) {
    if (state === 'peek' && e.deltaY > 0) {
      e.preventDefault();
      setState('expanded');
    } else if (state === 'expanded' && e.deltaY < 0 && scroll && scroll.scrollTop === 0) {
      e.preventDefault();
      setState('peek');
    }
  }, { passive: false });

  /* ---- Tip box 닫기 ---- */

  var tipBox = document.getElementById('tipBox');
  var tipBoxClose = document.getElementById('tipBoxClose');

  if (tipBox && tipBoxClose) {
    tipBoxClose.addEventListener('click', function () {
      tipBox.style.opacity = '0';
      window.setTimeout(function () { tipBox.hidden = true; }, 200);
    });
  }
})();

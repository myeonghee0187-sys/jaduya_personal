/* JADUYA — Overlays
 * Home 위에서 상태로만 전환되는 레이어를 관리한다. (별도 route 없음)
 *
 *   Home
 *    ├─ GNB Open                     (헤더 메뉴 버튼)
 *    │   └─ My Menu Edit Sheet       (GNB '내 메뉴 > 편집')
 *    └─ Add Widget Sheet             (Home '내 생활'의 + 진입점)
 */
(function () {
  'use strict';

  var MAX_MENU = 4;
  var MAX_WIDGET = 4;

  /* ================= 데이터 (Figma gnb_my_menu_edit 기준) ================= */

  var MENU_CATALOG = [
    { id: 'checklist',     name: '체크리스트',   icon: 'menu-checklist.svg' },
    { id: 'living-cost',   name: '생활비',       icon: 'menu-wallet.svg' },
    { id: 'schedule',      name: '일정',         icon: 'menu-calendar.svg' },
    { id: 'saved',         name: '저장한 정보',  icon: 'menu-bookmark.svg' },
    { id: 'clean-routine', name: '청소 루틴',    icon: 'menu-broom.svg' },
    { id: 'recycle',       name: '분리배출',     icon: 'menu-recycle.svg' },
    { id: 'expense',       name: '지출 내역',    icon: 'menu-receipt.svg' },
    { id: 'fixed-cost',    name: '고정지출',     icon: 'menu-card.svg' },
    { id: 'benefit-event', name: '혜택 이벤트',  icon: 'menu-gift.svg' },
    { id: 'board',         name: '자유게시판',   icon: 'menu-board.svg' },
    { id: 'tip',           name: '1인가구 꿀팁', icon: 'menu-tip.svg' },
    { id: 'diet',          name: '식단 관리',    icon: 'menu-food.svg' }
  ];

  var DEFAULT_MENU = ['checklist', 'living-cost', 'schedule', 'saved'];

  /* Home '내 생활'과 연결되는 위젯 (Figma add_widget: 현재 사용 중 3개) */
  var DEFAULT_WIDGETS = ['living-cost', 'fridge', 'rent'];

  var myMenu = DEFAULT_MENU.slice();      // 저장된 내 메뉴
  var draftMenu = myMenu.slice();         // 편집 시트 작업본
  var myWidgets = DEFAULT_WIDGETS.slice();// 저장된 위젯
  var draftWidgets = myWidgets.slice();   // 위젯 시트 작업본

  function findMenu(id) {
    for (var i = 0; i < MENU_CATALOG.length; i++) {
      if (MENU_CATALOG[i].id === id) return MENU_CATALOG[i];
    }
    return null;
  }

  function without(list, id) {
    return list.filter(function (x) { return x !== id; });
  }

  /* ================= DOM ================= */

  var $ = function (id) { return document.getElementById(id); };

  var gnb = $('gnb');
  var menuEditLayer = $('menuEditLayer');
  var addWidgetLayer = $('addWidgetLayer');

  if (!gnb || !menuEditLayer || !addWidgetLayer) return;

  var LAYERS = {
    gnb: gnb,
    menuEdit: menuEditLayer,
    addWidget: addWidgetLayer
  };

  /* ================= 레이어 상태 + 뒤로가기 ================= */

  var stack = [];

  /* 현재 history 항목을 '레이어 없음'으로 표시해 두면
   * 새로고침 이후에도 뒤로가기가 항상 Home으로 돌아온다. */
  history.replaceState({ jaduyaLayers: [] }, '');

  function render() {
    for (var key in LAYERS) {
      if (!Object.prototype.hasOwnProperty.call(LAYERS, key)) continue;
      LAYERS[key].hidden = stack.indexOf(key) === -1;
    }
  }

  function openLayer(name) {
    if (stack.indexOf(name) !== -1) return;
    stack.push(name);
    render();
    history.pushState({ jaduyaLayers: stack.slice() }, '');
  }

  /* UI의 닫기는 항상 history를 통해 되돌린다 → 하드웨어/브라우저 뒤로가기와 동일 경로 */
  function closeLayer() {
    if (!stack.length) return;
    history.back();
  }

  window.addEventListener('popstate', function (e) {
    var next = (e.state && e.state.jaduyaLayers) || [];
    stack = next.slice();
    render();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stack.length) {
      e.preventDefault();
      closeLayer();
    }
  });

  /* ================= ① GNB ================= */

  var gnbShortcutGrid = $('gnbShortcutGrid');

  function renderGnbShortcuts() {
    gnbShortcutGrid.textContent = '';
    myMenu.forEach(function (id) {
      var item = findMenu(id);
      if (!item) return;
      var a = document.createElement('a');
      a.className = 'shortcut';
      a.href = '#';
      a.innerHTML =
        '<img class="shortcut__icon" src="assets/icon/' + item.icon + '" alt="">' +
        '<span class="shortcut__label"></span>';
      a.querySelector('.shortcut__label').textContent = item.name;
      gnbShortcutGrid.appendChild(a);
    });
  }

  $('gnbOpenBtn').addEventListener('click', function () { openLayer('gnb'); });
  $('gnbClose').addEventListener('click', closeLayer);
  $('gnbBack').addEventListener('click', closeLayer);

  var livingItem = $('gnbLiving');
  var livingToggle = $('gnbLivingToggle');
  livingToggle.addEventListener('click', function () {
    var open = livingItem.dataset.open !== 'true';
    livingItem.dataset.open = String(open);
    livingToggle.setAttribute('aria-expanded', String(open));
    livingToggle.querySelector('.gnb-menu__chevron').src =
      'assets/icon/' + (open ? 'chevron-up.svg' : 'chevron-down.svg');
  });

  /* ================= ② 내 메뉴 편집 시트 ================= */

  var editSelected = $('menuEditSelected');
  var editAvailable = $('menuEditAvailable');
  var editBadge = $('menuEditBadge');
  var editStatus = $('menuEditStatus');

  function menuCard(item, on) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-card ' + (on ? 'menu-card--on' : 'menu-card--off');
    btn.dataset.menuId = item.id;
    btn.innerHTML =
      '<span class="menu-card__main">' +
        '<img class="menu-card__icon" src="assets/icon/' + item.icon + '" alt="">' +
        '<span class="menu-card__label"></span>' +
      '</span>' +
      '<img class="menu-card__mark" src="assets/icon/' +
        (on ? 'sheet-check-circle.svg' : 'sheet-plus.svg') + '" alt="">';
    btn.querySelector('.menu-card__label').textContent = item.name;
    if (!on && draftMenu.length >= MAX_MENU) btn.disabled = true;
    return btn;
  }

  function renderMenuEdit() {
    editSelected.textContent = '';
    editAvailable.textContent = '';

    draftMenu.forEach(function (id) {
      var item = findMenu(id);
      if (item) editSelected.appendChild(menuCard(item, true));
    });

    MENU_CATALOG.forEach(function (item) {
      if (draftMenu.indexOf(item.id) !== -1) return;
      editAvailable.appendChild(menuCard(item, false));
    });

    editBadge.textContent = '선택됨 ' + draftMenu.length + '/' + MAX_MENU;
    editStatus.hidden = draftMenu.length < MAX_MENU;
  }

  editSelected.addEventListener('click', function (e) {
    var card = e.target.closest('.menu-card');
    if (!card) return;
    draftMenu = without(draftMenu, card.dataset.menuId);
    renderMenuEdit();
  });

  editAvailable.addEventListener('click', function (e) {
    var card = e.target.closest('.menu-card');
    if (!card || card.disabled) return;
    if (draftMenu.length >= MAX_MENU) return;
    draftMenu.push(card.dataset.menuId);
    renderMenuEdit();
  });

  $('myMenuEditBtn').addEventListener('click', function () {
    draftMenu = myMenu.slice();
    renderMenuEdit();
    openLayer('menuEdit');
  });

  $('menuEditReset').addEventListener('click', function () {
    draftMenu = DEFAULT_MENU.slice();
    renderMenuEdit();
  });

  $('menuEditSave').addEventListener('click', function () {
    myMenu = draftMenu.slice();
    renderGnbShortcuts();
    closeLayer();
  });

  /* 저장하지 않고 닫기 */
  $('menuEditClose').addEventListener('click', closeLayer);
  $('menuEditDim').addEventListener('click', closeLayer);

  /* ================= ③ 위젯 추가 시트 ================= */

  var addWidgetBody = $('addWidgetBody');
  var addWidgetSearch = $('addWidgetSearch');
  var addWidgetCount = $('addWidgetCount');
  var addWidgetInUseCount = $('addWidgetInUseCount');
  var wpicks = Array.prototype.slice.call(addWidgetBody.querySelectorAll('.wpick'));

  function renderWidgetPicker() {
    wpicks.forEach(function (el) {
      var on = draftWidgets.indexOf(el.dataset.widgetId) !== -1;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-pressed', String(on));
    });
    addWidgetCount.textContent = draftWidgets.length + ' / ' + MAX_WIDGET;
    addWidgetInUseCount.textContent = draftWidgets.length + '/' + MAX_WIDGET;
  }

  function filterWidgets(query) {
    var q = query.trim().toLowerCase();
    var hits = 0;

    wpicks.forEach(function (el) {
      var match = !q || el.dataset.widgetName.toLowerCase().indexOf(q) !== -1;
      el.hidden = !match;
      if (match) hits++;
    });

    /* 항목이 모두 숨겨진 그룹/섹션은 함께 숨긴다 */
    Array.prototype.forEach.call(
      addWidgetBody.querySelectorAll('.add-widget__group'),
      function (group) {
        group.hidden = !group.querySelector('.wpick:not([hidden])');
      }
    );
    Array.prototype.forEach.call(
      addWidgetBody.querySelectorAll('.add-widget__section'),
      function (section) {
        section.hidden = !section.querySelector('.wpick:not([hidden])');
      }
    );

    /* 검색 중에는 카테고리/팁 영역을 숨긴다 */
    addWidgetBody.querySelector('[data-section="cats"]').hidden = !!q;
    addWidgetBody.querySelector('[data-section="tip"]').hidden = !!q;
    addWidgetBody.classList.toggle('is-empty', hits === 0);
  }

  addWidgetBody.addEventListener('click', function (e) {
    var card = e.target.closest('.wpick');
    if (!card) return;
    var id = card.dataset.widgetId;
    if (draftWidgets.indexOf(id) !== -1) {
      draftWidgets = without(draftWidgets, id);
    } else {
      if (draftWidgets.length >= MAX_WIDGET) return;
      draftWidgets.push(id);
    }
    renderWidgetPicker();
  });

  addWidgetSearch.addEventListener('input', function () {
    filterWidgets(addWidgetSearch.value);
  });

  function openAddWidget() {
    draftWidgets = myWidgets.slice();
    addWidgetSearch.value = '';
    filterWidgets('');
    renderWidgetPicker();
    openLayer('addWidget');
  }

  var addSlot = $('addWidgetSlot');
  var addPlus = $('addWidgetPlus');

  addSlot.addEventListener('click', openAddWidget);
  addSlot.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAddWidget();
    }
  });
  if (addPlus) addPlus.addEventListener('click', openAddWidget);

  $('addWidgetClose').addEventListener('click', closeLayer);
  $('addWidgetDim').addEventListener('click', closeLayer);

  $('addWidgetDone').addEventListener('click', function () {
    myWidgets = draftWidgets.slice();
    applyWidgetsToHome();
    closeLayer();
  });

  /* ---- Home '내 생활'에 선택 결과 반영 ---- */

  var moduleGrid = document.querySelector('.module-grid');

  function applyWidgetsToHome() {
    if (!moduleGrid) return;

    /* 1) Home에 이미 존재하는 위젯은 선택 여부에 따라 노출/숨김 */
    Array.prototype.forEach.call(
      moduleGrid.querySelectorAll('[data-widget-id]'),
      function (node) {
        if (node.dataset.homeExtra === 'true') return;
        node.hidden = myWidgets.indexOf(node.dataset.widgetId) === -1;
      }
    );

    /* 2) 새로 선택된 위젯은 시트 카드를 그대로 옮겨 붙인다 */
    var extraRow = moduleGrid.querySelector('[data-home-extra-row]');
    if (extraRow) extraRow.parentNode.removeChild(extraRow);

    var added = myWidgets.filter(function (id) {
      var existing = moduleGrid.querySelector('[data-widget-id="' + id + '"]:not([data-home-extra="true"])');
      return !existing;
    });

    /* 3) 비어버린 기본 행은 접는다 */
    Array.prototype.forEach.call(
      moduleGrid.querySelectorAll('.module-grid__row'),
      function (row) {
        if (row.hasAttribute('data-home-extra-row')) return;
        var visible = Array.prototype.filter.call(row.children, function (child) {
          return !child.hidden;
        });
        row.hidden = visible.length === 0;
      }
    );

    moduleGrid.classList.add('is-custom');

    if (!added.length) return;

    extraRow = document.createElement('div');
    extraRow.className = 'module-grid__row';
    extraRow.setAttribute('data-home-extra-row', '');
    extraRow.style.flexWrap = 'wrap';

    added.forEach(function (id) {
      var source = addWidgetBody.querySelector('.wpick[data-widget-id="' + id + '"] .wpick__card');
      if (!source) return;
      var clone = source.cloneNode(true);
      clone.dataset.widgetId = id;
      clone.dataset.homeExtra = 'true';
      extraRow.appendChild(clone);
    });

    moduleGrid.appendChild(extraRow);
  }

  /* ================= 초기 렌더 ================= */

  renderGnbShortcuts();
  renderMenuEdit();
  renderWidgetPicker();
  render();
})();

import { img } from '../../lib/asset';

/* 자두AI 진입 모프 — 누른 플로팅 버튼 자리에서 화면이 펼쳐지는 전환.
 *
 * 오버레이를 React 트리가 아니라 document.body 에 직접 붙인다.
 * 화면을 다 덮은 뒤 navigate 하면 버튼이 있던 페이지(=이 컴포넌트)가 언마운트되는데,
 * React state 로 들고 있으면 그 순간 오버레이도 같이 사라지기 때문이다.
 *
 * 좌표는 처음부터 끝까지 viewport px(getBoundingClientRect)만 쓴다. body 에 붙어서
 * 모바일 프리뷰의 zoom 을 타지 않으므로 .app 좌표계와 섞일 일이 없다. */

/** 펼쳐지는 시간 */
const EXPAND_MS = 340;
/** 다 펼친 뒤 오버레이가 걷히는 시간 — 그만큼 챗봇 화면이 드러난다 */
const FADE_MS = 180;

/** 전환 중 재클릭 방지 */
let running = false;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** 목업 화면 안이면 그 둥근 모서리에 맞춰 끝난다 (zoom 배율만큼 되돌린 값) */
function endRadius(button: HTMLElement): number {
  const screen = button.closest<HTMLElement>('.iphone-frame__screen');
  if (!screen) return 0;
  const scale = screen.offsetWidth ? screen.getBoundingClientRect().width / screen.offsetWidth : 1;
  return parseFloat(getComputedStyle(screen).borderTopLeftRadius) * scale;
}

/**
 * 버튼 자리에서 .app 크기로 펼쳐지는 오버레이를 재생한다.
 * 다 펼쳐지면 navigate 를 부르고, 오버레이는 걷히면서 스스로 사라진다.
 *
 * 애니메이션을 재생하지 않을 상황(모션 최소화 설정 / 이미 재생 중 / 좌표를 못 잼)이면
 * false 를 돌려준다 — 호출한 쪽이 그냥 navigate 하면 된다.
 */
export function playAIChatMorph(button: HTMLElement | null, navigate: () => void): boolean {
  if (running || !button || prefersReducedMotion()) return false;
  const app = button.closest<HTMLElement>('.app');
  if (!app) return false;

  const from = button.getBoundingClientRect();
  const to = app.getBoundingClientRect();
  running = true;

  const node = document.createElement('div');
  node.className = 'ai-morph';
  node.style.left = `${from.left}px`;
  node.style.top = `${from.top}px`;
  node.style.width = `${from.width}px`;
  node.style.height = `${from.height}px`;
  /* 시작은 버튼과 같은 원 */
  node.style.borderRadius = `${from.width / 2}px`;

  /* 진짜 버튼은 바로 숨긴다 — 오버레이가 그 자리를 그대로 이어받는다.
   * (버튼은 navigate 하면 화면과 함께 사라지고, 그 전에 끝나면 아래에서 되돌린다) */
  button.style.visibility = 'hidden';

  /* 아이콘은 확장되는 원 안에 넣지 않는다 — 넣으면 컨테이너를 따라 같이 늘어난다.
   * 버튼 자리에 FAB 크기 그대로 고정해두고 혼자 fade-out 만 시킨다. */
  const icon = document.createElement('img');
  icon.className = 'ai-morph__icon';
  icon.src = img('ai_icon.png');
  icon.alt = '';
  icon.style.left = `${from.left}px`;
  icon.style.top = `${from.top}px`;
  icon.style.width = `${from.width}px`;
  icon.style.height = `${from.height}px`;
  document.body.appendChild(node);
  document.body.appendChild(icon);

  /* 시작값을 한 번 반영(reflow)시킨 뒤 목표값을 넣어야 transition 이 재생된다.
   * requestAnimationFrame 은 탭이 가려지면 오지 않아서 강제 reflow 를 쓴다. */
  void node.offsetWidth;
  node.classList.add('is-open');
  icon.classList.add('is-gone');
  node.style.left = `${to.left}px`;
  node.style.top = `${to.top}px`;
  node.style.width = `${to.width}px`;
  node.style.height = `${to.height}px`;
  node.style.borderRadius = `${endRadius(button)}px`;

  /* 화면을 다 덮은 뒤에 페이지를 바꾼다 — 전환 자체는 오버레이에 가려 보이지 않는다 */
  window.setTimeout(() => {
    navigate();
    /* 챗봇 화면이 먼저 그려진 뒤에 걷는다 */
    void node.offsetWidth;
    node.classList.add('is-gone');
  }, EXPAND_MS);

  window.setTimeout(() => {
    node.remove();
    icon.remove();
    button.style.visibility = '';
    running = false;
  }, EXPAND_MS + FADE_MS + 40);

  return true;
}

/* 게시글·댓글 작성자 아바타 배경색.
 * 유저마다 다른 색이 나오되, 이모지 아이콘이 배경에 묻히지 않도록 전부 밝은 파스텔 톤에서만 고른다.
 * 이름으로 해시해서 고르므로 같은 작성자는 어디서나(카드·상세보기·댓글) 항상 같은 색이 나온다. */
const BADGE_COLOR_PALETTE = [
  '#d4e1c4', // 연두
  '#eed6c4', // 살구
  '#cfe3ea', // 하늘
  '#f0dce8', // 핑크
  '#e6dcef', // 라벤더
  '#f5e6b8', // 옐로우
  '#dce8e0', // 민트
];

/** 커뮤니티 홈 카드에서 이미 연두색으로 고정돼 있던 작성자 — 상세보기에서도 그대로 맞춘다 */
const FIXED_BADGE_COLORS: Record<string, string> = {
  수납장인: '#d4e1c4',
};

export function authorBadgeColor(author: string): string {
  const fixed = FIXED_BADGE_COLORS[author];
  if (fixed) return fixed;

  let hash = 0;
  for (let i = 0; i < author.length; i += 1) {
    hash = (hash * 31 + author.charCodeAt(i)) % BADGE_COLOR_PALETTE.length;
  }
  return BADGE_COLOR_PALETTE[Math.abs(hash) % BADGE_COLOR_PALETTE.length];
}

import type { CSSProperties } from 'react';
import { icon } from '../lib/asset';

interface MenuIconProps {
  /** assets/icon/ 아래 파일명 — MENU_CATALOG 의 item.icon 을 그대로 넘긴다 */
  file: string;
  /** 크기와 색은 화면별 클래스가 정한다 */
  className: string;
}

/* 메뉴 아이콘 한 칸 — '내 메뉴' 와 '내 메뉴 편집' 이 같은 방식으로 그린다.
 *
 * 원본 SVG 는 파일마다 색이 박혀 있어서(#B43936 / #252525 / black / #3D302C)
 * <img> 로 넣으면 부모의 색을 따라가지 않는다. 그래서 모양만 mask 로 가져오고
 * 실제 색은 background-color 로 CSS 가 정한다. 아이콘 파일은 그대로 쓴다. */
export function MenuIcon({ file, className }: MenuIconProps) {
  return (
    <span
      className={className}
      style={
        {
          maskImage: `url(${icon(file)})`,
          WebkitMaskImage: `url(${icon(file)})`,
        } as CSSProperties
      }
      aria-hidden="true"
    />
  );
}

export default MenuIcon;

import { icon } from '../lib/asset';
import '../styles/carousel-dots.css';

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
  className?: string;
}

/** 카드 이동 상태를 표시만 한다. 이동 동작과 접근성 안내는 기존 캐러셀이 담당한다. */
export function CarouselDots({ count, activeIndex, className = '' }: CarouselDotsProps) {
  if (count < 1) return null;

  const index = Math.min(Math.max(activeIndex, 0), count - 1);

  return (
    <div className={`carousel-dots ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, dotIndex) => (
        <span
          key={dotIndex}
          className={`carousel-dots__dot${dotIndex === index ? ' is-active' : ''}`}
        />
      ))}
      <img
        className="carousel-dots__active"
        src={icon('jadu_pagenation.svg')}
        width={20}
        height={22}
        alt=""
        draggable={false}
        style={{ transform: `translateX(${index * 16}px)` }}
      />
    </div>
  );
}

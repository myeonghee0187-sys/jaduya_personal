import { motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PanInfo } from 'motion/react';
import type { ReactNode } from 'react';
import './Stack.css';

/* React Bits 의 Stack 컴포넌트 (JavaScript + CSS 원본)를 이 프로젝트의
 * React + TypeScript 구조에 맞게 옮긴 것이다. 동작은 원본 그대로 두고
 * 타입만 붙였다. */

interface CardRotateProps {
  children: ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
  disableDrag?: boolean;
}

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <motion.div className="stack-card-rotate-disabled" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="stack-card-rotate"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

export interface StackProps {
  randomRotation?: boolean;
  /** 첫 자취의 반듯한 종이 카드 스택. 기존 회전형 스택은 기본값을 유지한다. */
  variant?: 'default' | 'paper';
  sensitivity?: number;
  cards?: ReactNode[];
  animationConfig?: { stiffness: number; damping: number };
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  mobileClickOnly?: boolean;
  mobileBreakpoint?: number;
  /** 맨 앞 카드가 바뀔 때마다 그 카드의 원래 순서를 알려준다 (pagination 용) */
  onTopChange?: (index: number) => void;
}

export default function Stack({
  randomRotation = false,
  variant = 'default',
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  onTopChange,
}: StackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusAfterCycle = useRef(false);
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = variant === 'paper' || (mobileClickOnly && isMobile);
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  const [stack, setStack] = useState(() =>
    cards.map((content, index) => ({ id: index + 1, content })),
  );

  useEffect(() => {
    if (cards.length) {
      setStack(cards.map((content, index) => ({ id: index + 1, content })));
    }
  }, [cards]);

  /* 맨 뒤(index 0)가 아니라 맨 앞(마지막)이 지금 보이는 카드다 */
  useEffect(() => {
    if (stack.length) onTopChange?.(stack[stack.length - 1].id - 1);
    if (focusAfterCycle.current) {
      containerRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true });
      focusAfterCycle.current = false;
    }
  }, [stack, onTopChange]);

  const sendToBack = (id: number) => {
    setStack((prev) => {
      const newStack = [...prev];
      const index = newStack.findIndex((card) => card.id === id);
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;
    });
  };

  /* 카드마다 한 번만 뽑아 둔다. 렌더마다 Math.random() 을 부르면 부모가 리렌더될 때
   * (예: 다른 영역의 체크 상태 변경) 카드가 이유 없이 다시 기울어진다. */
  const randomRotates = useMemo(
    () => cards.map(() => (randomRotation ? Math.random() * 10 - 5 : 0)),
    [cards, randomRotation],
  );

  useEffect(() => {
    if (autoplay && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id;
        sendToBack(topCardId);
      }, autoplayDelay);

      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDelay, stack, isPaused]);

  return (
    <div
      ref={containerRef}
      className={`stack-container${variant === 'paper' ? ' stack-container--paper' : ''}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        const randomRotate = randomRotates[card.id - 1] ?? 0;

        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <motion.div
              className="stack-card"
              role={variant === 'paper' ? 'button' : undefined}
              tabIndex={variant === 'paper' && index === stack.length - 1 ? 0 : -1}
              aria-label={variant === 'paper' ? '다음 자취 경험 보기' : undefined}
              aria-describedby={variant === 'paper' ? `${descriptionId}-${card.id}` : undefined}
              aria-hidden={variant === 'paper' && index !== stack.length - 1 ? true : undefined}
              style={variant === 'paper' ? { pointerEvents: index === stack.length - 1 ? 'auto' : 'none' } : undefined}
              onKeyDown={(event) => {
                if (variant === 'paper' && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  focusAfterCycle.current = true;
                  sendToBack(card.id);
                }
              }}
              onClick={() => {
                if (!shouldEnableClick) return;
                if (variant === 'paper' && containerRef.current?.contains(document.activeElement)) {
                  focusAfterCycle.current = true;
                }
                sendToBack(card.id);
              }}
              animate={{
                rotateZ: variant === 'paper' ? 0 : (stack.length - index - 1) * 4 + randomRotate,
                y: variant === 'paper' ? -Math.min(2, stack.length - index - 1) * 12 : 0,
                scale: variant === 'paper' ? 1 : 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: '90% 90%',
              }}
              initial={false}
              transition={variant === 'paper' && reduceMotion ? { duration: 0 } : {
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping,
              }}
            >
              {variant === 'paper' ? (
                <div id={`${descriptionId}-${card.id}`} className="stack-card__description">{card.content}</div>
              ) : card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}

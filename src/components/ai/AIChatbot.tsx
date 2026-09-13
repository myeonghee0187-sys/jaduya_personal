import type { ForwardedRef } from 'react';
import '../../styles/ai-chatbot.css';
import { AIChatbotButton } from './AIChatbotButton';
import { playAIChatMorph } from './aiChatMorph';
import { useAppNavigation } from '../../navigation/AppNavigation';

interface AIChatbotProps {
  /** AIChatbotButton 의 initialLift 를 그대로 전달한다 */
  initialLift?: number;
  /** AIChatbotButton 의 coachmarkRef 를 그대로 전달한다 */
  coachmarkRef?: ForwardedRef<HTMLButtonElement>;
}

/* 플로팅 버튼 진입점. 화면에는 이 컴포넌트 하나만 붙이면 된다.
 * 예전에는 자두메이트 Bottom Sheet(AIChatbotPanel)를 열었지만,
 * 지금은 Figma 시안대로 자두AI 전체 화면(AIChatPage)으로 이동한다. */
export function AIChatbot({ initialLift, coachmarkRef }: AIChatbotProps) {
  const navigation = useAppNavigation();

  /* 누른 자리에서 화면이 펼쳐지는 전환. 재생할 수 없는 상황이면 바로 이동한다. */
  const openChat = (button: HTMLButtonElement | null) => {
    const go = () => navigation?.navigate('ai-chat');
    if (!playAIChatMorph(button, go)) go();
  };

  return (
    <AIChatbotButton
      onClick={openChat}
      initialLift={initialLift}
      coachmarkRef={coachmarkRef}
    />
  );
}

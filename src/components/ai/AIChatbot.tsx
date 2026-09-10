import '../../styles/ai-chatbot.css';
import { AIChatbotButton } from './AIChatbotButton';
import { useAppNavigation } from '../../navigation/AppNavigation';

/* 플로팅 버튼 진입점. 화면에는 이 컴포넌트 하나만 붙이면 된다.
 * 예전에는 자두메이트 Bottom Sheet(AIChatbotPanel)를 열었지만,
 * 지금은 Figma 시안대로 자두AI 전체 화면(AIChatPage)으로 이동한다. */
export function AIChatbot() {
  const navigation = useAppNavigation();

  return <AIChatbotButton onClick={() => navigation?.navigate('ai-chat')} />;
}

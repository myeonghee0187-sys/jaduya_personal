import { useState } from 'react';
import '../../styles/ai-chatbot.css';
import { AIChatbotButton } from './AIChatbotButton';
import { AIChatbotPanel } from './AIChatbotPanel';

/* 플로팅 버튼 + 패널을 묶는 진입점.
 * 화면에는 이 컴포넌트 하나만 붙이면 된다. */
export function AIChatbot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AIChatbotButton hidden={open} onClick={() => setOpen(true)} />
      <AIChatbotPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

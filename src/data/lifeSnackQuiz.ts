/* 오늘의 자취 스낵퀴즈 — 생활 메인의 퀴즈 섹션이 읽는 데이터.
 *
 * 문제를 더 넣으려면 이 배열에 객체를 하나 추가하면 된다.
 * 배열에 두 번째 문제가 생기는 순간 결과 화면의 '다음 퀴즈' 버튼이 저절로 나타난다
 * (문제가 하나뿐이면 같은 문제가 반복되지 않도록 버튼을 그리지 않는다).
 *
 * options 는 화면의 선택 버튼 순서 그대로이고, ratio 는 options[0] 을 고른 비율이다.
 * 계란처럼 끌어서 놓는 문제만 있어서 image / crackedImage 를 함께 둔다.
 */
export type SnackQuiz = {
  id: string;
  /* 칩에 '분리배출 · 초급' 으로 붙는다 */
  category: string;
  difficulty: string;
  question: string;
  /* public/assets/img 아래 경로 — img() 헬퍼가 base 를 붙인다 */
  image: string;
  /* 잡는 순간 교차할 이미지 (없으면 image 하나로만 보여준다) */
  crackedImage?: string;
  /* 드롭 존 두 개 — 화면에 보이는 순서 */
  options: readonly [string, string];
  correctAnswer: string;
  result: {
    correct: string;
    wrong: string;
  };
  explanation: {
    /* 오답일 때만 — 실제 정답이 무엇인지 알려준다 */
    answer: string;
    /* 왜 그런지 한 줄. 정답일 때와 오답일 때 앞 문장이 달라서 문구를 따로 둔다
     * (정답일 때 '정답은 …예요' 를 또 붙이면 같은 말이 두 번 나온다) */
    why: {
      correct: string;
      wrong: string;
    };
  };
};

export const SNACK_QUIZZES: readonly SnackQuiz[] = [
  {
    id: 'eggshell',
    category: '분리배출',
    difficulty: '초급',
    question: '계란 껍데기, 어디에 버려야 할까요?',
    image: 'life/life-quiz_egg.png',
    crackedImage: 'life/life-quiz-eggshell.png',
    options: ['일반 쓰레기', '음식물 쓰레기'],
    correctAnswer: '일반 쓰레기',
    result: {
      correct: '정답이에요!',
      wrong: '아쉬워요!',
    },
    explanation: {
      answer: '계란 껍데기는 일반 쓰레기예요.',
      why: {
        correct: '계란 껍데기는 음식물로 처리할 수 없어요.',
        wrong: '음식물로 처리할 수 없어요.',
      },
    },
  },
];

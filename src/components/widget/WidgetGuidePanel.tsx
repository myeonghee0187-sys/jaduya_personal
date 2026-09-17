/* 위젯 배치 가이드 배너 — 펼치기/접기 없이 한 줄(아이콘 + 문구)로 항상 떠 있다.
 * "내 위젯" 캔버스 카드(베이지 배경) 맨 위, 배치 그리드 바로 위에 자리한다. 더 자세한
 * 배치 다이어그램/규칙은 헤더 "가이드" 버튼의 PlacementGuideSheet(모달)에서 본다 —
 * 그쪽과 구분되도록 여기는 정보 안내 톤(블루)을 쓴다.
 * "편집" 버튼은 이 배너 *안에* 넣지 않는다 — 같은 줄이지만 별개 요소로 분리해서 두고
 * 싶다는 요청으로, WidgetPage.tsx 에서 이 컴포넌트와 나란히 형제로 렌더링한다. */
export function WidgetGuidePanel() {
  return (
    <div className="wpg-guide">
      <span className="wpg-guide__icon" aria-hidden="true">
        i
      </span>
      <span className="wpg-guide__title">위젯은 홈 화면에 이렇게 배치돼요.</span>
    </div>
  );
}

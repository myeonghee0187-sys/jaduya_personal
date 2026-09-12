/* 생활 > 살림 데이터.
 *
 * 여기에는 정적인 초기값만 둔다 — 사용자가 바꾸는 값(마지막 관리일, 추가한 루틴)은
 * LifeHousePage 의 state 에서 관리하고, 이 파일의 배열/객체는 직접 수정하지 않는다.
 * Figma daily_living (3084:23432).
 * 지자체마다 배출 기준이 다를 수 있는 항목은 확정적인 단언 대신 일반적인 기준으로 안내한다. */

/* ================= 버리기 전에 확인해요 ================= */

export type TrashGroup =
  | "종이"
  | "플라스틱·비닐"
  | "유리·캔·금속"
  | "전기·전자·배터리"
  | "의류·생활용품"
  | "주방"
  | "욕실"
  | "음식물 판단"
  | "특수폐기물"
  | "대형·기타";

export interface TrashItem {
  readonly id: string;
  /** 대표 이름 — 검색 결과의 기준이 되는 물건 이름 */
  readonly name: string;
  /** 이 이름으로도 찾을 수 있게 하는 다른 표기 */
  readonly aliases: readonly string[];
  /** 품목 분류 — 기존 결과 제목 category와 별도로 관리한다. */
  readonly group: TrashGroup;
  /** 결과 제목 — 예: "일반쓰레기" */
  readonly category: string;
  /** 제목 아래 재활용 여부 표기 */
  readonly recycleLabel: string;
  /** 안내 본문 (줄 단위) */
  readonly description: readonly string[];
  /** 품목별 주의사항 또는 지역 기준 확인 안내 */
  readonly caution?: string;
}

/* 공식 지자체·폐기물 회수기관 안내를 참고한 일반적인 가정 배출 정보.
 * 구체적인 수거 품목과 봉투·신고 방식은 지역 기준을 우선한다. */
export const TRASH_ITEMS: readonly TrashItem[] = [
  // 종이 (14개)
  {
    id: "receipt",
    name: "영수증",
    aliases: ["감열지", "카드영수증", "현금영수증"],
    group: "종이",
    category: "일반쓰레기",
    recycleLabel: "종이류 ×",
    description: [
      "감열지 영수증은 종이 재활용에 섞지 않고 종량제 봉투에 버려요.",
    ],
    caution: "개인정보가 적힌 부분은 알아볼 수 없게 처리해요.",
  },
  {
    id: "delivery-label",
    name: "택배 송장",
    aliases: ["송장", "운송장", "택배송장"],
    group: "종이",
    category: "일반쓰레기",
    recycleLabel: "종이류 ×",
    description: [
      "택배 상자에서 떼어내고 개인정보가 보이지 않게 처리해요.",
      "접착제가 붙은 송장은 종량제 봉투에 버려요.",
    ],
  },
  {
    id: "newspaper",
    name: "신문지",
    aliases: ["신문", "헌신문", "일간지"],
    group: "종이",
    category: "종이류",
    recycleLabel: "재활용 가능",
    description: [
      "물이나 기름에 젖지 않게 모아 종이류로 배출해요.",
      "비닐 포장과 다른 재질의 끈은 분리해요.",
    ],
  },
  {
    id: "cardboard-box",
    name: "택배 상자",
    aliases: ["종이박스", "골판지", "택배박스"],
    group: "종이",
    category: "종이류",
    recycleLabel: "재활용 가능",
    description: [
      "송장과 테이프를 제거하고 상자를 펼쳐 종이류로 배출해요.",
    ],
    caution: "기름이나 음식물이 스며든 부분은 종량제 봉투로 배출해요.",
  },
  {
    id: "book",
    name: "책",
    aliases: ["헌책", "서적", "교과서"],
    group: "종이",
    category: "종이류",
    recycleLabel: "다른 재질 제거",
    description: [
      "비닐 표지와 부속품을 분리하고 종이 부분을 모아 배출해요.",
    ],
    caution: "분리하기 어려운 두꺼운 표지는 재질과 지역 배출 기준을 확인해요.",
  },
  {
    id: "notebook",
    name: "노트",
    aliases: ["공책", "스프링노트", "수첩"],
    group: "종이",
    category: "종이류",
    recycleLabel: "다른 재질 제거",
    description: [
      "스프링과 플라스틱 표지를 분리하고 종이는 종이류로 배출해요.",
      "오염된 종이는 종량제 봉투에 버려요.",
    ],
  },
  {
    id: "printing-paper",
    name: "복사용지",
    aliases: ["A4용지", "프린트물", "인쇄용지"],
    group: "종이",
    category: "종이류",
    recycleLabel: "재활용 가능",
    description: [
      "코팅되지 않은 깨끗한 인쇄용지는 종이류로 모아 배출해요.",
    ],
    caution: "개인정보는 지우고, 잘게 파쇄한 종이는 지역 수거 기준을 확인해요.",
  },
  {
    id: "paper-bag",
    name: "종이봉투",
    aliases: ["종이쇼핑백", "크라프트봉투", "종이가방"],
    group: "종이",
    category: "종이류",
    recycleLabel: "코팅 여부 확인",
    description: [
      "비닐 코팅이 없는 종이봉투는 손잡이 등 다른 재질을 떼어 종이류로 배출해요.",
    ],
    caution: "코팅되었거나 오염을 제거할 수 없는 봉투는 지역 기준에 따라 종량제 봉투로 배출해요.",
  },
  {
    id: "paper-cup",
    name: "종이컵",
    aliases: ["일회용종이컵", "커피종이컵", "테이크아웃종이컵"],
    group: "종이",
    category: "종이컵",
    recycleLabel: "별도 수거 여부 확인",
    description: [
      "내용물을 비우고 헹군 뒤 말려요.",
      "종이컵 별도 수거함이 있으면 이용하고, 없으면 지역 배출 기준을 확인해요.",
    ],
    caution: "일반 종이나 우유팩과 같은 수거함에 넣어도 되는지 먼저 확인해요.",
  },
  {
    id: "milk-carton",
    name: "우유팩",
    aliases: ["종이팩", "우유곽", "일반팩"],
    group: "종이",
    category: "종이팩",
    recycleLabel: "전용 수거 권장",
    description: [
      "내용물을 비우고 헹궈 말린 뒤 종이팩 수거함에 배출해요.",
      "빨대와 비닐 등 다른 재질은 떼어내요.",
    ],
    caution: "수거함이 없으면 주민센터 등 지역 종이팩 수거처를 확인해요.",
  },
  {
    id: "aseptic-carton",
    name: "멸균팩",
    aliases: ["두유팩", "멸균우유팩", "테트라팩"],
    group: "종이",
    category: "멸균팩",
    recycleLabel: "분리 수거 기준 확인",
    description: [
      "내용물을 비우고 헹궈 말린 뒤 멸균팩 수거처를 이용해요.",
      "빨대와 비닐은 분리해요.",
    ],
    caution: "일반 우유팩과 구분 수거하는지 지역 기준을 확인해요.",
  },
  {
    id: "paper-towel",
    name: "키친타월",
    aliases: ["키친타올", "주방종이타월", "종이행주"],
    group: "종이",
    category: "일반쓰레기",
    recycleLabel: "종이류 ×",
    description: [
      "사용한 키친타월은 물기를 줄여 종량제 봉투에 버려요.",
      "음식물이 묻었어도 음식물쓰레기에 넣지 않아요.",
    ],
  },
  {
    id: "tissue",
    name: "휴지",
    aliases: ["화장지", "미용티슈", "각티슈"],
    group: "종이",
    category: "일반쓰레기",
    recycleLabel: "종이류 ×",
    description: [
      "사용한 휴지와 미용티슈는 종량제 봉투에 버려요.",
      "종이 재활용품과 섞지 않아요.",
    ],
  },
  {
    id: "coated-paper",
    name: "코팅지",
    aliases: ["비닐코팅종이", "라미네이팅지", "코팅종이"],
    group: "종이",
    category: "일반쓰레기",
    recycleLabel: "종이류 ×",
    description: [
      "플라스틱 필름과 종이를 분리할 수 없는 코팅지는 종량제 봉투에 버려요.",
    ],
    caution: "겉보기만으로 판단하기 어렵다면 지역 종이류 배출 기준을 확인해요.",
  },
  // 플라스틱·비닐 (14개)
  {
    id: "pet-bottle",
    name: "페트병",
    aliases: ["PET병", "생수병", "투명페트병", "페트", "PET bottle"],
    group: "플라스틱·비닐",
    category: "투명 페트병",
    recycleLabel: "생수·음료병 별도 배출",
    description: [
      "무색투명한 생수·음료 페트병은 비우고 헹군 뒤 라벨을 떼어요.",
      "찌그러뜨려 뚜껑을 닫고 투명 페트병 수거함에 배출해요.",
    ],
    caution: "색 있는 병이나 식용유·양념통은 별도 투명 페트병 대상이 아니므로 일반 플라스틱 기준을 확인해요.",
  },
  {
    id: "colored-pet-bottle",
    name: "유색 페트병",
    aliases: ["색깔페트병", "갈색페트병", "초록페트병"],
    group: "플라스틱·비닐",
    category: "플라스틱류",
    recycleLabel: "투명 페트병과 구분",
    description: [
      "내용물을 비우고 헹군 뒤 라벨 등 다른 재질을 분리해요.",
      "투명 페트병 전용함에 넣지 않고 일반 플라스틱 수거 기준을 따라요.",
    ],
  },
  {
    id: "plastic-food-container",
    name: "플라스틱 배달용기",
    aliases: ["배달용기", "플라스틱용기", "PP용기", "일회용도시락용기"],
    group: "플라스틱·비닐",
    category: "플라스틱류",
    recycleLabel: "오염 제거 필요",
    description: [
      "음식물과 기름기를 제거하고 뚜껑 등 다른 재질을 분리해요.",
      "재질 표시와 지역 수거 기준에 맞춰 배출해요.",
    ],
    caution: "오염을 제거할 수 없는 용기는 종량제 봉투로 배출해요.",
  },
  {
    id: "plastic-cup",
    name: "플라스틱컵",
    aliases: ["아이스컵", "일회용플라스틱컵", "테이크아웃컵"],
    group: "플라스틱·비닐",
    category: "플라스틱류",
    recycleLabel: "투명 페트병과 구분",
    description: [
      "음료와 얼음을 비우고 헹군 뒤 빨대와 뚜껑을 분리해요.",
      "지역 플라스틱류 수거 기준에 맞춰 배출해요.",
    ],
    caution: "투명해도 생수·음료 페트병 전용함에는 넣지 않아요.",
  },
  {
    id: "plastic-bag",
    name: "비닐봉지",
    aliases: ["비닐", "봉지", "비닐봉투", "쇼핑봉투"],
    group: "플라스틱·비닐",
    category: "비닐류",
    recycleLabel: "오염 제거 필요",
    description: [
      "내용물을 비우고 이물질을 제거한 깨끗한 비닐은 비닐류로 모아 배출해요.",
    ],
    caution: "오염 비닐 수거 여부는 지역 기준을 확인하고, 수거 대상이 아니면 종량제 봉투로 배출해요.",
  },
  {
    id: "dirty-plastic-bag",
    name: "음식물이 묻은 비닐",
    aliases: ["오염비닐", "음식물비닐", "기름묻은비닐"],
    group: "플라스틱·비닐",
    category: "지역 기준 확인",
    recycleLabel: "오염 비닐 수거 기준 확인",
    description: [
      "음식물 덩어리 등 내용물을 먼저 제거해요.",
      "오염된 비닐도 수거하는 지역은 해당 기준을 따르고, 수거 대상이 아니면 종량제 봉투에 배출해요.",
    ],
    caution: "오염 여부만으로 종량제 배출을 단정하지 말고 지역 비닐류 수거 기준을 확인해요.",
  },
  {
    id: "snack-bag",
    name: "과자봉지",
    aliases: ["라면봉지", "과자포장지", "은박과자봉지"],
    group: "플라스틱·비닐",
    category: "비닐류",
    recycleLabel: "잔여물 제거 필요",
    description: [
      "부스러기와 내용물을 비우고 이물질을 제거해 비닐류로 배출해요.",
    ],
    caution: "내부가 은색이어도 금속캔 수거함에 넣지 않아요. 재질 표시와 지역 수거 기준을 확인해요.",
  },
  {
    id: "bubble-wrap",
    name: "뽁뽁이",
    aliases: ["에어캡", "버블랩", "기포완충재"],
    group: "플라스틱·비닐",
    category: "비닐류",
    recycleLabel: "테이프 제거",
    description: [
      "붙어 있는 테이프와 종이를 제거한 뒤 비닐류로 모아 배출해요.",
    ],
    caution: "비닐과 다른 재질이 붙어 분리되지 않는 포장재는 지역 배출 기준을 확인해요.",
  },
  {
    id: "styrofoam-box",
    name: "스티로폼 상자",
    aliases: ["흰스티로폼", "스티로폼박스", "EPS상자"],
    group: "플라스틱·비닐",
    category: "스티로폼류",
    recycleLabel: "깨끗한 흰색 포장재",
    description: [
      "송장과 테이프를 떼고 음식물과 물기를 제거해요.",
      "깨끗한 흰색 스티로폼은 지역 스티로폼 수거 기준에 따라 배출해요.",
    ],
    caution: "색이나 코팅이 있거나 오염을 제거하기 어려운 것은 별도 기준을 확인해요.",
  },
  {
    id: "colored-styrofoam",
    name: "유색 스티로폼",
    aliases: ["색깔스티로폼", "검정스티로폼", "코팅스티로폼"],
    group: "플라스틱·비닐",
    category: "지역 기준 확인",
    recycleLabel: "흰 스티로폼과 구분",
    description: [
      "색이나 코팅이 있는 스티로폼은 흰색 포장재 수거함에 섞지 않아요.",
      "재활용 수거 여부와 종량제 배출 여부를 지역 기준으로 확인해요.",
    ],
  },
  {
    id: "plastic-straw",
    name: "빨대",
    aliases: ["플라스틱빨대", "음료빨대", "일회용빨대"],
    group: "플라스틱·비닐",
    category: "일반쓰레기",
    recycleLabel: "플라스틱류 ×",
    description: [
      "작고 가벼운 플라스틱 빨대는 일반적으로 종량제 봉투에 버려요.",
    ],
    caution: "별도 회수 프로그램이 있다면 해당 수거 기준을 따라요.",
  },
  {
    id: "food-wrap",
    name: "식품용 랩",
    aliases: ["비닐랩", "주방랩", "일회용랩"],
    group: "플라스틱·비닐",
    category: "지역 기준 확인",
    recycleLabel: "재질·오염 확인",
    description: [
      "음식물 덩어리를 제거하고 랩의 재질 표시와 지역 비닐류 수거 기준을 확인해요.",
      "해당 재질이나 오염 상태의 랩을 수거하지 않는 지역은 종량제 봉투로 배출해요.",
    ],
    caution: "PVC 등 수거하지 않는 재질이 있을 수 있어요.",
  },
  {
    id: "plastic-lid",
    name: "플라스틱 뚜껑",
    aliases: ["플라스틱병뚜껑", "음료뚜껑", "컵뚜껑"],
    group: "플라스틱·비닐",
    category: "플라스틱류",
    recycleLabel: "재질별 배출",
    description: [
      "내용물을 제거하고 다른 재질의 패킹 등이 쉽게 분리되면 떼어내요.",
      "뚜껑 재질과 크기에 대한 지역 수거 기준에 맞춰 배출해요.",
    ],
    caution: "투명 생수·음료 페트병의 뚜껑은 병을 압착한 뒤 닫아서 함께 배출해요.",
  },
  {
    id: "plastic-file",
    name: "클리어파일",
    aliases: ["투명파일", "L홀더", "플라스틱파일"],
    group: "플라스틱·비닐",
    category: "지역 기준 확인",
    recycleLabel: "문구류 수거 확인",
    description: [
      "종이와 금속 부속품을 빼고 플라스틱 부분의 재질을 확인해요.",
      "문구용 플라스틱 수거 대상인지 지역 기준을 확인해요.",
    ],
    caution: "재활용 수거 대상이 아니면 종량제 봉투에 버려요.",
  },
  // 유리·캔·금속 (14개)
  {
    id: "beverage-can",
    name: "음료캔",
    aliases: ["맥주캔", "알루미늄캔", "탄산캔"],
    group: "유리·캔·금속",
    category: "금속캔류",
    recycleLabel: "재활용 가능",
    description: [
      "남은 음료를 비우고 헹군 뒤 금속캔류로 배출해요.",
      "플라스틱 뚜껑 등 다른 재질은 분리해요.",
    ],
  },
  {
    id: "food-can",
    name: "통조림캔",
    aliases: ["참치캔", "스팸캔", "통조림통"],
    group: "유리·캔·금속",
    category: "금속캔류",
    recycleLabel: "이물질 제거",
    description: [
      "음식물과 기름기를 제거하고 금속캔류로 배출해요.",
      "플라스틱 덮개는 따로 분리해요.",
    ],
    caution: "날카로운 뚜껑에 손을 베지 않도록 주의해요.",
  },
  {
    id: "spray-can",
    name: "스프레이캔",
    aliases: ["스프레이", "에어로졸", "헤어스프레이캔"],
    group: "유리·캔·금속",
    category: "금속캔류",
    recycleLabel: "내용물·지역 기준 확인",
    description: [
      "제품을 정상 사용해 내용물이 없는 캔은 지역 금속캔 배출 기준을 확인해요.",
      "내용물이 남아 있거나 고장 난 캔은 주민센터나 청소 담당 부서에 처리 방법을 문의해요.",
    ],
    caution: "임의로 구멍을 뚫거나 가열·분해하지 마세요. 살충제·페인트 제품은 별도 기준을 확인해요.",
  },
  {
    id: "glass-bottle",
    name: "유리병",
    aliases: ["음료유리병", "소주병", "맥주병"],
    group: "유리·캔·금속",
    category: "유리병류",
    recycleLabel: "보증금 표시 확인",
    description: [
      "내용물을 비우고 담배꽁초 등 이물질을 넣지 않아요.",
      "보증금 표시가 있으면 판매처에 반환하고, 그 외 병은 지역 유리병 수거 기준을 따라요.",
    ],
  },
  {
    id: "broken-glass",
    name: "깨진 유리",
    aliases: ["깨진컵", "유리조각", "깨진유리컵", "깨진유리병"],
    group: "유리·캔·금속",
    category: "불연성 폐기물",
    recycleLabel: "유리병류 ×",
    description: [
      "신문지나 두꺼운 포장재로 안전하게 감싸고 깨진 유리임을 표시해요.",
      "불연성 전용 봉투·마대 등 지역에서 정한 방법으로 배출해요.",
    ],
    caution: "일반 유리병 수거함에 넣지 않아요. 봉투 종류는 지역 기준을 확인해요.",
  },
  {
    id: "glass-cup",
    name: "유리컵",
    aliases: ["유리잔", "맥주잔", "와인잔"],
    group: "유리·캔·금속",
    category: "불연성 폐기물",
    recycleLabel: "유리병류와 구분",
    description: [
      "유리컵은 포장용 유리병과 재질이 다를 수 있어 유리병 수거함에 섞지 않아요.",
      "지역 불연성 폐기물 배출 기준을 확인해요.",
    ],
    caution: "깨진 부분은 두꺼운 포장재로 감싸고 위험 표시를 해요.",
  },
  {
    id: "glass-jar",
    name: "유리잼병",
    aliases: ["잼병", "소스유리병", "피클병"],
    group: "유리·캔·금속",
    category: "유리병류",
    recycleLabel: "내용물 제거",
    description: [
      "내용물을 비우고 헹군 뒤 뚜껑 등 다른 재질을 분리해요.",
      "깨지지 않은 포장용 유리병은 지역 유리병 수거 기준을 따라요.",
    ],
    caution: "내열유리 보관용기와는 배출 방법이 달라요.",
  },
  {
    id: "metal-lid",
    name: "금속 뚜껑",
    aliases: ["철뚜껑", "잼병뚜껑", "금속마개"],
    group: "유리·캔·금속",
    category: "금속류",
    recycleLabel: "이물질 제거",
    description: [
      "병과 분리한 금속 뚜껑은 내용물을 닦아내요.",
      "안쪽 패킹과 혼합 재질 여부에 따라 지역 금속류 수거 기준을 확인해요.",
    ],
  },
  {
    id: "metal-hanger",
    name: "철사 옷걸이",
    aliases: ["세탁소옷걸이", "철옷걸이", "금속옷걸이"],
    group: "유리·캔·금속",
    category: "고철류",
    recycleLabel: "반납·지역 기준 확인",
    description: [
      "사용 가능한 것은 세탁소 반납 여부를 먼저 확인해요.",
      "버릴 때는 고철류 수거 여부를 지역 기준으로 확인해요.",
    ],
    caution: "플라스틱이나 천으로 두껍게 감싼 제품은 혼합 재질 기준을 확인해요.",
  },
  {
    id: "aluminum-foil",
    name: "알루미늄 포일",
    aliases: ["은박지", "쿠킹호일", "알루미늄호일"],
    group: "유리·캔·금속",
    category: "지역 기준 확인",
    recycleLabel: "작은 포일 수거 확인",
    description: [
      "음식물과 기름 오염을 제거하기 어려운 포일은 종량제 봉투에 버려요.",
      "깨끗한 포일은 지역 금속류 수거 대상인지 확인해요.",
    ],
    caution: "은색 비닐 포장지는 알루미늄 포일과 달라요.",
  },
  {
    id: "metal-tool",
    name: "금속 공구",
    aliases: ["스패너", "펜치", "드라이버공구"],
    group: "유리·캔·금속",
    category: "고철류",
    recycleLabel: "혼합 재질 확인",
    description: [
      "금속 공구는 지역 고철 수거처나 고철류 배출 기준을 확인해요.",
      "플라스틱 손잡이 등 분리하기 어려운 재질은 그대로 두고 수거 가능 여부를 문의해요.",
    ],
    caution: "전동공구는 배터리·폐가전 배출 기준을 따라요.",
  },
  {
    id: "nail",
    name: "못",
    aliases: ["나사", "피스", "금속못"],
    group: "유리·캔·금속",
    category: "고철류",
    recycleLabel: "찔림 주의",
    description: [
      "흩어지거나 찔리지 않도록 단단한 용기에 모아 위험 표시를 해요.",
      "지역 고철 수거처에 안전한 배출 방법을 확인해요.",
    ],
  },
  {
    id: "metal-scissors",
    name: "가위",
    aliases: ["문구가위", "주방가위", "금속가위"],
    group: "유리·캔·금속",
    category: "지역 기준 확인",
    recycleLabel: "날 보호 필요",
    description: [
      "날이 드러나지 않도록 두꺼운 종이 등으로 감싸 고정해요.",
      "금속과 플라스틱이 섞인 제품의 지역 배출 기준을 확인해요.",
    ],
    caution: "분리하기 위해 날을 억지로 떼어내지 않아요.",
  },
  {
    id: "metal-bottlecap",
    name: "왕관 병뚜껑",
    aliases: ["맥주병뚜껑", "철제병뚜껑", "왕관뚜껑"],
    group: "유리·캔·금속",
    category: "금속류",
    recycleLabel: "작은 금속 수거 확인",
    description: [
      "음료와 이물질을 제거하고 흩어지지 않게 모아요.",
      "작은 금속 뚜껑의 수거 방법은 지역 금속류 기준을 확인해요.",
    ],
  },
  // 전기·전자·배터리 (14개)
  {
    id: "battery",
    name: "건전지",
    aliases: ["배터리", "AA", "AAA", "AA건전지", "AAA건전지", "알카라인건전지", "일회용배터리"],
    group: "전기·전자·배터리",
    category: "폐건전지",
    recycleLabel: "전용 수거함",
    description: [
      "종량제 봉투나 일반 재활용품에 섞지 않아요.",
      "주민센터나 공동주택의 폐건전지 전용 수거함에 배출해요.",
    ],
    caution: "누액·파손이 있으면 만지거나 분해하지 말고 지역 수거 담당자에게 문의해요.",
  },
  {
    id: "power-bank",
    name: "보조배터리",
    aliases: ["보조배터리팩", "휴대용배터리", "파워뱅크", "power bank"],
    group: "전기·전자·배터리",
    category: "폐배터리",
    recycleLabel: "수거처 확인",
    description: [
      "종량제 봉투에 넣지 말고 보조배터리를 받는 전용 수거처를 확인해요.",
      "내장 전지를 억지로 꺼내지 않고 제품 상태로 배출해요.",
    ],
    caution: "부풀거나 파손된 제품은 일반 수거함에 바로 넣지 말고 지역 담당자나 제조사에 처리 방법을 문의해요.",
  },
  {
    id: "coin-battery",
    name: "동전형 건전지",
    aliases: ["버튼전지", "수은전지", "CR2032", "코인배터리"],
    group: "전기·전자·배터리",
    category: "폐건전지",
    recycleLabel: "전용 수거함",
    description: [
      "폐건전지 전용 수거함에 배출해요.",
      "서로 단자가 닿지 않도록 절연테이프 등으로 보호해요.",
    ],
    caution: "어린이가 삼킬 수 있으므로 손이 닿지 않는 곳에 따로 보관해요.",
  },
  {
    id: "fluorescent",
    name: "형광등",
    aliases: ["직관형광등", "전구형형광등", "형광램프"],
    group: "전기·전자·배터리",
    category: "폐형광등",
    recycleLabel: "전용 수거함",
    description: [
      "깨지지 않도록 보호해 폐형광등 전용 수거함에 배출해요.",
    ],
    caution: "깨졌다면 조각을 직접 만지지 말고 지역 담당 부서에 처리 방법을 확인해요. LED·백열전구와 구분해요.",
  },
  {
    id: "led-bulb",
    name: "LED 전구",
    aliases: ["LED등", "엘이디전구", "LED램프"],
    group: "전기·전자·배터리",
    category: "폐조명",
    recycleLabel: "지역 수거 기준 확인",
    description: [
      "LED 전구와 조명은 폐형광등 수거함에 임의로 섞지 않아요.",
      "지역의 LED 조명 전용 수거 또는 폐가전 배출 기준을 확인해요.",
    ],
  },
  {
    id: "incandescent-bulb",
    name: "백열전구",
    aliases: ["전구", "백열등", "할로겐전구", "할로겐등"],
    group: "전기·전자·배터리",
    category: "불연성 폐기물",
    recycleLabel: "폐형광등과 구분",
    description: [
      "깨지지 않게 포장하고 지역의 불연성 폐기물 배출 기준을 확인해요.",
      "폐형광등 수거함에는 넣지 않아요.",
    ],
    caution: "전구 종류가 LED·형광등이라면 해당 품목으로 다시 확인해요.",
  },
  {
    id: "charger",
    name: "충전기",
    aliases: ["휴대폰충전기", "충전어댑터", "전원어댑터", "USB충전기"],
    group: "전기·전자·배터리",
    category: "폐전자제품",
    recycleLabel: "수거처 확인",
    description: [
      "충전 어댑터는 플라스틱 수거함에 넣지 않아요.",
      "지역 소형 폐전자제품 수거처에서 받는지 확인해요.",
    ],
    caution: "선을 자르거나 내부를 분해하지 않아요.",
  },
  {
    id: "electric-cable",
    name: "충전 케이블",
    aliases: ["USB케이블", "충전선", "전선", "전기코드", "C타입케이블"],
    group: "전기·전자·배터리",
    category: "폐전선",
    recycleLabel: "지역 수거 기준 확인",
    description: [
      "금속과 피복이 섞인 케이블은 일반 플라스틱류에 넣지 않아요.",
      "지역 폐전선 또는 소형 폐전자제품 수거 기준을 확인해요.",
    ],
    caution: "피복을 태우거나 벗겨 처리하지 않아요.",
  },
  {
    id: "earphones",
    name: "이어폰",
    aliases: ["무선이어폰", "유선이어폰", "블루투스이어폰", "earbuds"],
    group: "전기·전자·배터리",
    category: "폐전자제품",
    recycleLabel: "배터리 포함 여부 확인",
    description: [
      "이어폰과 충전 케이스는 지역 폐전자제품 수거처에 배출 방법을 확인해요.",
      "내장 배터리를 억지로 분리하지 않아요.",
    ],
    caution: "배터리가 부풀거나 파손된 무선 제품은 수거 담당자에게 상태를 알리고 문의해요.",
  },
  {
    id: "smartphone",
    name: "휴대폰",
    aliases: ["스마트폰", "핸드폰", "공기계", "스마트 폰"],
    group: "전기·전자·배터리",
    category: "폐휴대폰",
    recycleLabel: "공식 회수처 이용",
    description: [
      "개인정보를 백업·초기화하고 유심·메모리카드를 제거해요.",
      "제조사나 지역 폐휴대폰 회수처의 안내에 따라 배출해요.",
    ],
    caution: "내장 배터리를 직접 분해하지 않아요.",
  },
  {
    id: "hair-dryer",
    name: "헤어드라이어",
    aliases: ["드라이기", "헤어드라이기", "머리드라이어"],
    group: "전기·전자·배터리",
    category: "폐소형가전",
    recycleLabel: "지역 수거처 확인",
    description: [
      "전원을 분리하고 지역 소형 폐가전 수거함이나 회수 서비스를 확인해요.",
      "방문 수거는 품목·수량 조건을 확인한 뒤 신청해요.",
    ],
  },
  {
    id: "electric-kettle",
    name: "전기포트",
    aliases: ["전기주전자", "커피포트", "전기케틀"],
    group: "전기·전자·배터리",
    category: "폐소형가전",
    recycleLabel: "지역 수거처 확인",
    description: [
      "남은 물을 비우고 전원 받침대와 함께 배출해요.",
      "지역 소형 폐가전 수거처나 방문 수거 조건을 확인해요.",
    ],
  },
  {
    id: "rice-cooker",
    name: "전기밥솥",
    aliases: ["밥솥", "전기보온밥솥", "전기압력밥솥"],
    group: "전기·전자·배터리",
    category: "폐소형가전",
    recycleLabel: "지역 수거처 확인",
    description: [
      "전기로 사용하는 밥솥은 음식물을 제거하고 지역 소형 폐가전 회수 방법을 확인해요.",
      "방문 수거의 품목·수량 조건에 맞춰 신청해요.",
    ],
    caution: "전기 기능 없는 압력솥이나 내솥만 버리는 경우 재질에 따라 금속류 등 지역 기준을 확인해요.",
  },
  {
    id: "electric-fan",
    name: "선풍기",
    aliases: ["서큘레이터", "써큘레이터", "탁상선풍기"],
    group: "전기·전자·배터리",
    category: "폐소형가전",
    recycleLabel: "지역 수거처 확인",
    description: [
      "전원을 분리하고 지역 폐가전 수거처의 안내에 따라 배출해요.",
      "크기나 수량에 따른 방문 수거 조건을 확인해요.",
    ],
    caution: "충전식 제품의 내장 배터리는 억지로 분리하지 않아요.",
  },
  // 의류·생활용품 (14개)
  {
    id: "clothes",
    name: "헌옷",
    aliases: ["옷", "의류", "티셔츠", "바지"],
    group: "의류·생활용품",
    category: "의류",
    recycleLabel: "재사용 가능 여부 확인",
    description: [
      "깨끗하고 다시 입을 수 있는 옷은 기부나 의류 수거함을 이용해요.",
      "젖거나 심하게 오염된 옷은 지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
    caution: "수거함에 적힌 수거 가능 품목을 먼저 확인해요.",
  },
  {
    id: "shoes",
    name: "신발",
    aliases: ["운동화", "구두", "헌신발"],
    group: "의류·생활용품",
    category: "의류·신발",
    recycleLabel: "수거함 기준 확인",
    description: [
      "다시 신을 수 있는 신발은 양쪽을 함께 묶어 수거함 기준에 맞게 배출해요.",
      "찢어지거나 심하게 오염된 신발은 지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
  },
  {
    id: "bag",
    name: "가방",
    aliases: ["백팩", "핸드백", "에코백"],
    group: "의류·생활용품",
    category: "의류·가방",
    recycleLabel: "수거함 기준 확인",
    description: [
      "내용물을 비우고 재사용 가능한 가방은 기부나 수거함 대상인지 확인해요.",
      "사용하기 어려운 가방은 크기와 재질에 따른 지역 배출 기준을 따라요.",
    ],
  },
  {
    id: "belt",
    name: "벨트",
    aliases: ["허리띠", "가죽벨트", "혁대"],
    group: "의류·생활용품",
    category: "일반쓰레기",
    recycleLabel: "혼합 재질 확인",
    description: [
      "사용하기 어려운 가죽·합성수지 벨트는 일반적으로 종량제 봉투에 버려요.",
      "쉽게 분리되는 금속 버클은 지역 고철류 기준을 확인해요.",
    ],
  },
  {
    id: "hat",
    name: "모자",
    aliases: ["야구모자", "비니", "캡모자"],
    group: "의류·생활용품",
    category: "의류",
    recycleLabel: "수거함 기준 확인",
    description: [
      "깨끗하고 재사용 가능한 모자는 의류 수거함에서 받는지 확인해요.",
      "오염되거나 망가진 모자는 지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
  },
  {
    id: "socks",
    name: "양말",
    aliases: ["헌양말", "스타킹", "덧신"],
    group: "의류·생활용품",
    category: "일반쓰레기",
    recycleLabel: "의류 수거 여부 확인",
    description: [
      "낡거나 오염된 양말과 스타킹은 일반적으로 종량제 봉투에 버려요.",
    ],
    caution: "의류 수거함마다 허용 품목이 달라 별도 수거 안내가 있는지 확인해요.",
  },
  {
    id: "underwear",
    name: "속옷",
    aliases: ["팬티", "브래지어", "런닝셔츠"],
    group: "의류·생활용품",
    category: "일반쓰레기",
    recycleLabel: "의류 수거 여부 확인",
    description: [
      "사용한 속옷은 일반적으로 종량제 봉투에 버려요.",
    ],
    caution: "재사용을 위한 의류 수거함에 넣기 전에 해당 수거함 기준을 확인해요.",
  },
  {
    id: "padded-quilt",
    name: "솜이불",
    aliases: ["이불", "차렵이불", "극세사이불"],
    group: "의류·생활용품",
    category: "대형·일반 폐기물",
    recycleLabel: "크기·지역 기준 확인",
    description: [
      "솜이 든 이불은 의류 수거함에 임의로 넣지 않아요.",
      "종량제 봉투 배출 또는 대형폐기물 신고 대상인지 지역 기준을 확인해요.",
    ],
  },
  {
    id: "pillow",
    name: "베개",
    aliases: ["배게", "쿠션", "베개솜"],
    group: "의류·생활용품",
    category: "대형·일반 폐기물",
    recycleLabel: "크기·지역 기준 확인",
    description: [
      "솜이나 충전재가 든 베개·쿠션은 의류 수거함에 넣지 않아요.",
      "크기에 따라 종량제 봉투 또는 대형폐기물로 배출하는지 지역 기준을 확인해요.",
    ],
  },
  {
    id: "curtain",
    name: "커튼",
    aliases: ["커텐", "암막커튼", "블라인드천"],
    group: "의류·생활용품",
    category: "의류·생활 폐기물",
    recycleLabel: "수거함·재질 확인",
    description: [
      "커튼의 고리 등 다른 재질을 분리해요.",
      "재사용 가능 여부와 수거함 허용 품목, 크기에 따른 지역 배출 기준을 확인해요.",
    ],
    caution: "금속·플라스틱 블라인드는 별도 대형폐기물 기준을 확인해요.",
  },
  {
    id: "towel",
    name: "수건",
    aliases: ["타월", "타올", "헌수건"],
    group: "의류·생활용품",
    category: "일반쓰레기",
    recycleLabel: "수거함 기준 확인",
    description: [
      "낡거나 오염된 수건은 일반적으로 종량제 봉투에 버려요.",
      "재사용할 수 있다면 기부처나 수거함에서 받는지 확인해요.",
    ],
  },
  {
    id: "umbrella",
    name: "우산",
    aliases: ["양산", "접이식우산", "장우산"],
    group: "의류·생활용품",
    category: "지역 기준 확인",
    recycleLabel: "혼합 재질",
    description: [
      "천과 금속이 섞인 우산은 지역 고철·생활폐기물 배출 기준을 확인해요.",
      "억지로 분해하지 말고 뾰족한 끝을 보호해 배출해요.",
    ],
  },
  {
    id: "plush-toy",
    name: "봉제인형",
    aliases: ["인형", "솜인형", "털인형"],
    group: "의류·생활용품",
    category: "일반·대형 폐기물",
    recycleLabel: "크기·배터리 확인",
    description: [
      "작은 봉제인형은 일반적으로 종량제 봉투에 버려요.",
      "큰 인형은 지역 대형폐기물 신고 기준을 확인해요.",
    ],
    caution: "전지함이 있는 제품은 안전하게 분리 가능한 건전지만 빼서 전용 수거함에 배출해요.",
  },
  {
    id: "disposable-mask",
    name: "일회용 마스크",
    aliases: ["마스크", "KF94마스크", "KF80마스크", "덴탈마스크"],
    group: "의류·생활용품",
    category: "일반쓰레기",
    recycleLabel: "재활용 ×",
    description: [
      "사용한 마스크는 흩어지지 않게 모아 종량제 봉투에 버려요.",
      "플라스틱이나 종이 재활용품에 섞지 않아요.",
    ],
  },
  // 주방 (14개)
  {
    id: "rubber-gloves",
    name: "고무장갑",
    aliases: ["설거지장갑", "주방장갑", "라텍스고무장갑"],
    group: "주방",
    category: "일반쓰레기",
    recycleLabel: "고무류 ×",
    description: [
      "다 쓴 고무장갑은 종량제 봉투에 버려요.",
      "플라스틱 재활용품과 섞지 않아요.",
    ],
  },
  {
    id: "sponge",
    name: "수세미",
    aliases: ["설거지스펀지", "주방스펀지", "아크릴수세미"],
    group: "주방",
    category: "일반쓰레기",
    recycleLabel: "재활용 ×",
    description: [
      "음식물과 물기를 제거하고 종량제 봉투에 버려요.",
      "금속으로 된 수세미는 금속 수세미 항목의 지역 기준을 확인해요.",
    ],
  },
  {
    id: "steel-scrubber",
    name: "철수세미",
    aliases: ["스텐수세미", "금속수세미", "스테인리스수세미"],
    group: "주방",
    category: "지역 기준 확인",
    recycleLabel: "작은 금속 수거 확인",
    description: [
      "음식물과 기름기를 제거하고 지역 고철 수거 대상인지 확인해요.",
    ],
    caution: "수거하지 않거나 오염을 제거할 수 없다면 지역에서 안내하는 생활폐기물 방식으로 배출해요.",
  },
  {
    id: "frying-pan",
    name: "프라이팬",
    aliases: ["후라이팬", "코팅팬", "프라이펜"],
    group: "주방",
    category: "고철류",
    recycleLabel: "손잡이·지역 기준 확인",
    description: [
      "음식물과 기름기를 제거한 뒤 지역 고철 수거 기준을 따라요.",
      "손잡이가 쉽게 분리되면 재질별로 나눠요.",
    ],
    caution: "손잡이를 억지로 분해하지 말고 혼합 재질 수거 여부를 확인해요.",
  },
  {
    id: "pot",
    name: "냄비",
    aliases: ["스테인리스냄비", "스텐냄비", "알루미늄냄비"],
    group: "주방",
    category: "고철류",
    recycleLabel: "다른 재질 확인",
    description: [
      "음식물을 제거한 금속 냄비는 지역 고철 수거 기준에 따라 배출해요.",
      "유리 뚜껑과 다른 재질의 손잡이는 분리 가능 여부를 확인해요.",
    ],
    caution: "도자기 뚝배기는 금속류가 아니에요.",
  },
  {
    id: "kitchen-knife",
    name: "칼",
    aliases: ["식칼", "주방칼", "과도"],
    group: "주방",
    category: "지역 기준 확인",
    recycleLabel: "날 보호·위험 표시",
    description: [
      "칼날을 두꺼운 종이나 포장재로 감싸 움직이지 않게 고정하고 위험 표시를 해요.",
      "금속류 또는 별도 생활폐기물 배출 방법을 지역 담당 부서에 확인해요.",
    ],
    caution: "날이 봉투 밖으로 나오지 않게 해요.",
  },
  {
    id: "wooden-chopsticks",
    name: "나무젓가락",
    aliases: ["일회용젓가락", "대나무젓가락", "젓가락나무"],
    group: "주방",
    category: "일반쓰레기",
    recycleLabel: "음식물류 ×",
    description: [
      "나무젓가락은 종량제 봉투에 버려요.",
      "음식물이 묻어 있어도 음식물쓰레기로 배출하지 않아요.",
    ],
  },
  {
    id: "wooden-cutting-board",
    name: "나무 도마",
    aliases: ["목재도마", "원목도마", "대나무도마"],
    group: "주방",
    category: "일반·대형 폐기물",
    recycleLabel: "크기·지역 기준 확인",
    description: [
      "나무 도마는 종이나 플라스틱 재활용품에 넣지 않아요.",
      "작은 도마의 종량제 배출 여부와 큰 도마의 대형폐기물 기준을 확인해요.",
    ],
  },
  {
    id: "plastic-cutting-board",
    name: "플라스틱 도마",
    aliases: ["도마", "합성수지도마", "PE도마"],
    group: "주방",
    category: "지역 기준 확인",
    recycleLabel: "재질·수거 여부 확인",
    description: [
      "음식물을 제거하고 단일 재질 플라스틱 도마를 수거하는지 확인해요.",
      "다른 재질이 섞였거나 수거 대상이 아니면 지역 생활폐기물 기준을 따라요.",
    ],
    caution: "나무 도마는 플라스틱류가 아니므로 나무 도마 항목을 확인해요.",
  },
  {
    id: "silicone-utensil",
    name: "실리콘 조리도구",
    aliases: ["실리콘주걱", "실리콘뒤집개", "실리콘국자"],
    group: "주방",
    category: "일반쓰레기",
    recycleLabel: "플라스틱류 ×",
    description: [
      "실리콘 부분은 일반적으로 종량제 봉투에 버려요.",
      "쉽게 분리되는 금속 손잡이는 지역 고철류 수거 기준을 확인해요.",
    ],
  },
  {
    id: "ceramic-dish",
    name: "도자기 그릇",
    aliases: ["접시", "사기그릇", "도자기접시", "뚝배기"],
    group: "주방",
    category: "불연성 폐기물",
    recycleLabel: "유리병류 ×",
    description: [
      "도자기·사기 그릇은 유리병 재활용에 섞지 않아요.",
      "불연성 전용 봉투·마대 등 지역 배출 기준을 확인해요.",
    ],
    caution: "깨진 부분을 안전하게 감싸요. 금속·플라스틱 접시는 해당 재질의 지역 배출 기준을 확인해요.",
  },
  {
    id: "ceramic-cup",
    name: "머그컵",
    aliases: ["도자기컵", "머그잔", "사기컵"],
    group: "주방",
    category: "불연성 폐기물",
    recycleLabel: "유리병류 ×",
    description: [
      "도자기 머그컵은 지역 불연성 폐기물 배출 기준에 따라 버려요.",
    ],
    caution: "깨졌다면 조각을 두꺼운 포장재로 감싸고 위험 표시를 해요.",
  },
  {
    id: "thermos",
    name: "텀블러",
    aliases: ["보온병", "보냉병", "스텐텀블러"],
    group: "주방",
    category: "지역 기준 확인",
    recycleLabel: "재질별 배출",
    description: [
      "내용물을 비우고 뚜껑·패킹 등 쉽게 분리되는 재질을 나눠요.",
      "금속 몸체나 혼합 재질 제품의 지역 수거 기준을 확인해요.",
    ],
    caution: "유리 내피가 있는 제품은 무리하게 분해하지 않아요.",
  },
  {
    id: "heatproof-glass-container",
    name: "내열유리 용기",
    aliases: ["유리밀폐용기", "내열유리", "유리반찬통", "유리도시락통"],
    group: "주방",
    category: "불연성 폐기물",
    recycleLabel: "유리병류 ×",
    description: [
      "내열유리 용기는 일반 유리병 수거함에 넣지 않아요.",
      "뚜껑은 재질별로 분리하고 몸체는 지역 불연성 폐기물 기준을 따라요.",
    ],
    caution: "깨진 부분은 안전하게 포장해요.",
  },
  // 욕실 (14개)
  {
    id: "toothbrush",
    name: "칫솔",
    aliases: ["치솔", "일반칫솔", "일회용칫솔"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "플라스틱류 ×",
    description: [
      "칫솔모와 손잡이가 섞인 일반 칫솔은 종량제 봉투에 버려요.",
    ],
    caution: "전동칫솔 본체는 배터리·폐전자제품 수거 기준을 확인해요.",
  },
  {
    id: "toothpaste-tube",
    name: "치약 튜브",
    aliases: ["치약", "치약통", "치약용기"],
    group: "욕실",
    category: "지역 기준 확인",
    recycleLabel: "재질·오염 확인",
    description: [
      "내용물을 최대한 사용하고 분리배출 표시를 확인해요.",
      "남은 치약을 제거하기 어렵거나 복합 재질이면 지역 종량제 배출 기준을 따라요.",
    ],
  },
  {
    id: "shampoo-bottle",
    name: "샴푸통",
    aliases: ["샴푸병", "린스통", "바디워시통"],
    group: "욕실",
    category: "플라스틱류",
    recycleLabel: "펌프 분리",
    description: [
      "내용물을 비우고 헹군 뒤 펌프를 분리해요.",
      "깨끗한 용기 몸체는 재질 표시와 지역 플라스틱류 수거 기준에 따라 배출해요.",
    ],
  },
  {
    id: "pump-dispenser",
    name: "샴푸 펌프",
    aliases: ["바디워시펌프", "디스펜서펌프", "펌프뚜껑"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "혼합 재질 확인",
    description: [
      "샴푸 등 생활용품 용기의 펌프에 금속 스프링이 들어 있고 분리하기 어렵다면 일반적으로 종량제 봉투에 버려요.",
    ],
    caution: "단일 재질로 표시된 제품은 제품 표시와 지역 수거 기준을 확인해요.",
  },
  {
    id: "bathroom-cleaner-bottle",
    name: "욕실 세제통",
    aliases: ["세제용기", "욕실세정제통", "욕실청소세제통"],
    group: "욕실",
    category: "플라스틱류",
    recycleLabel: "잔여 세제 확인",
    description: [
      "내용물을 정상 사용한 빈 용기는 제품의 배출 표시와 지역 기준에 따라 배출해요.",
      "분리 가능한 분무기·뚜껑은 재질별로 나눠요.",
    ],
    caution: "세제가 많이 남았다면 다른 약품과 섞거나 하수구에 붓지 말고 제조사·지역 담당 부서에 문의해요.",
  },
  {
    id: "razor",
    name: "면도기",
    aliases: ["일회용면도기", "수동면도기", "면도기헤드"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "날 보호 필요",
    description: [
      "플라스틱과 날이 분리되지 않는 수동 면도기는 날을 안전하게 덮어 종량제 봉투에 버려요.",
    ],
    caution: "전기면도기는 지역 폐가전·배터리 배출 기준을 확인해요.",
  },
  {
    id: "razor-blade",
    name: "면도날",
    aliases: ["교체면도날", "면도기날", "양날면도날"],
    group: "욕실",
    category: "지역 기준 확인",
    recycleLabel: "베임 주의",
    description: [
      "두꺼운 종이나 단단한 용기로 날을 보호하고 위험 표시를 해요.",
      "작은 날붙이의 지역 생활폐기물 배출 기준을 확인해요.",
    ],
  },
  {
    id: "cotton-swab",
    name: "면봉",
    aliases: ["나무면봉", "종이면봉", "플라스틱면봉"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "재활용 ×",
    description: [
      "사용한 면봉은 종량제 봉투에 버려요.",
      "종이·플라스틱 재활용품에 섞지 않아요.",
    ],
  },
  {
    id: "cotton-pad",
    name: "화장솜",
    aliases: ["클렌징솜", "솜패드", "메이크업솜"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "재활용 ×",
    description: [
      "사용한 화장솜은 종량제 봉투에 버려요.",
      "화장품이나 리무버가 묻은 솜은 재활용품에 섞지 않아요.",
    ],
  },
  {
    id: "dental-floss",
    name: "치실",
    aliases: ["치실픽", "일회용치실", "치간칫솔"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "재활용 ×",
    description: [
      "다 쓴 치실과 치간칫솔은 종량제 봉투에 버려요.",
      "작은 플라스틱 손잡이도 일반 재활용품에 섞지 않아요.",
    ],
  },
  {
    id: "sanitary-pad",
    name: "생리대",
    aliases: ["위생패드", "팬티라이너", "일회용생리대"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "재활용 ×",
    description: [
      "사용한 생리대는 내용물이 드러나지 않게 싸서 종량제 봉투에 버려요.",
      "변기에 넣지 않아요.",
    ],
  },
  {
    id: "wet-tissue",
    name: "물티슈",
    aliases: ["일회용물티슈", "청소물티슈", "비데물티슈"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "종이류 ×",
    description: [
      "사용한 물티슈는 종량제 봉투에 버려요.",
      "종이 재활용품이나 변기에 넣지 않아요.",
    ],
  },
  {
    id: "contact-lens",
    name: "콘택트렌즈",
    aliases: ["렌즈", "컨택트렌즈", "일회용렌즈"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "하수 배출 ×",
    description: [
      "다 쓴 콘택트렌즈는 종량제 봉투에 버려요.",
      "세면대나 변기에 흘려보내지 않아요.",
    ],
    caution: "포장재는 재질별로 배출해요. 안경·카메라 렌즈는 별도 제품이므로 지역 배출 기준을 확인해요.",
  },
  {
    id: "hair-comb",
    name: "빗",
    aliases: ["머리빗", "헤어브러시", "브러쉬"],
    group: "욕실",
    category: "일반쓰레기",
    recycleLabel: "혼합 재질 확인",
    description: [
      "머리카락을 제거하고 일반 빗·헤어브러시는 종량제 봉투에 버려요.",
    ],
    caution: "단일 재질 제품을 별도 수거하는 지역은 해당 기준을 확인해요.",
  },
  // 음식물 판단 (14개)
  {
    id: "eggshell",
    name: "달걀껍데기",
    aliases: ["계란껍질", "달걀껍질", "계란껍데기", "메추리알껍질"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "음식물류 ×",
    description: [
      "달걀·메추리알 껍데기는 음식물쓰레기와 분리해요.",
      "지역 기준에 따라 종량제 봉투에 배출해요.",
    ],
  },
  {
    id: "chicken-bone",
    name: "닭뼈",
    aliases: ["치킨뼈", "돼지뼈", "소뼈", "사골뼈"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "음식물류 ×",
    description: [
      "고기 뼈는 남은 살과 분리해 종량제 봉투로 배출해요.",
      "날카로운 부분이 봉투를 찢지 않게 감싸요.",
    ],
    caution: "지역 음식물쓰레기 제외 품목 기준을 확인해요.",
  },
  {
    id: "fish-bone",
    name: "생선뼈",
    aliases: ["생선가시", "생선뼈다귀", "고등어뼈"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "음식물류 ×",
    description: [
      "생선뼈와 가시는 남은 살과 분리해요.",
      "봉투를 찌르지 않게 감싸 지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
  },
  {
    id: "shellfish-shell",
    name: "조개껍데기",
    aliases: ["조개껍질", "굴껍데기", "홍합껍데기", "게껍데기"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "음식물류 ×",
    description: [
      "조개·게 등의 딱딱한 껍데기는 음식물쓰레기에 넣지 않아요.",
      "일반 봉투·불연성 마대 등 지역에서 정한 배출 방법을 확인해요.",
    ],
  },
  {
    id: "fruit-pit",
    name: "과일씨",
    aliases: ["복숭아씨", "자두씨", "살구씨", "감씨"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "딱딱한 씨는 음식물류 ×",
    description: [
      "복숭아·자두처럼 딱딱한 과일씨는 음식물쓰레기와 분리해요.",
      "지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
    caution: "작고 부드러운 씨까지 같은 기준으로 판단하지 말고 지역 안내를 확인해요.",
  },
  {
    id: "onion-peel",
    name: "양파껍질",
    aliases: ["양파껍데기", "마른양파껍질", "양파겉껍질"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "마른 겉껍질 구분",
    description: [
      "마른 양파 겉껍질은 일반적으로 음식물쓰레기에서 제외해요.",
      "지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
    caution: "양파 속살이나 무른 부분과 구분하고 지역 기준을 확인해요.",
  },
  {
    id: "garlic-peel",
    name: "마늘껍질",
    aliases: ["마늘껍데기", "마늘대", "마늘겉껍질"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "음식물류 제외 확인",
    description: [
      "마른 마늘 껍질과 줄기는 일반적으로 음식물쓰레기에 넣지 않아요.",
      "지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
  },
  {
    id: "corn-cob",
    name: "옥수수대",
    aliases: ["옥수수속대", "옥수수껍질", "옥수수심"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "음식물류 ×",
    description: [
      "단단한 옥수수 속대와 질긴 껍질은 음식물쓰레기와 분리해요.",
      "지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
  },
  {
    id: "nut-shell",
    name: "견과류 껍데기",
    aliases: ["호두껍질", "땅콩껍질", "밤껍질", "견과류껍질"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "음식물류 ×",
    description: [
      "호두·땅콩 등의 딱딱한 껍데기는 음식물쓰레기에 넣지 않아요.",
      "지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
  },
  {
    id: "coffee-grounds",
    name: "커피 찌꺼기",
    aliases: ["커피박", "원두찌꺼기", "커피가루찌꺼기"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "별도 수거 여부 확인",
    description: [
      "물기를 줄여 지역 기준에 따라 종량제 봉투에 배출해요.",
      "커피박 별도 수거처가 있다면 해당 수거 기준을 따라요.",
    ],
    caution: "음식물쓰레기 수거함에는 넣지 않아요.",
  },
  {
    id: "tea-bag",
    name: "티백",
    aliases: ["차티백", "녹차티백", "차찌꺼기", "한약찌꺼기"],
    group: "음식물 판단",
    category: "일반쓰레기",
    recycleLabel: "음식물류 ×",
    description: [
      "차·한약 찌꺼기와 사용한 티백은 물기를 줄여요.",
      "지역 기준에 따라 종량제 봉투로 배출해요.",
    ],
  },
  {
    id: "banana-peel",
    name: "바나나껍질",
    aliases: ["바나나껍데기", "바나나피", "바나나외피"],
    group: "음식물 판단",
    category: "음식물쓰레기",
    recycleLabel: "스티커 제거",
    description: [
      "스티커와 포장재를 떼고 물기를 줄여 음식물쓰레기로 배출해요.",
    ],
    caution: "질긴 꼭지 부분 등 제외 품목과 배출 용기는 지역 기준을 확인해요.",
  },
  {
    id: "tangerine-peel",
    name: "귤껍질",
    aliases: ["귤껍데기", "오렌지껍질", "감귤껍질"],
    group: "음식물 판단",
    category: "음식물쓰레기",
    recycleLabel: "스티커 제거",
    description: [
      "스티커 등 이물질을 제거하고 음식물쓰레기로 배출해요.",
    ],
    caution: "말랐다는 이유만으로 일반쓰레기로 바꾸지 말고 지역 음식물 배출 기준을 확인해요.",
  },
  {
    id: "watermelon-rind",
    name: "수박껍질",
    aliases: ["수박껍데기", "수박피", "수박외피"],
    group: "음식물 판단",
    category: "음식물쓰레기",
    recycleLabel: "크기·물기 줄이기",
    description: [
      "큰 껍질은 다루기 쉬운 작은 크기로 나누고 물기를 줄여요.",
      "지역 음식물쓰레기 전용 봉투나 용기 배출 기준을 따라요.",
    ],
  },
  // 특수폐기물 (14개)
  {
    id: "medicine",
    name: "알약",
    aliases: ["약", "폐의약품", "먹는약", "가루약", "캡슐약"],
    group: "특수폐기물",
    category: "폐의약품",
    recycleLabel: "전용 수거처",
    description: [
      "남은 약은 지역의 폐의약품 전용 수거처에 배출해요.",
      "조제 봉투·포장 처리 방식은 수거처 안내를 확인해요.",
    ],
    caution: "종량제 봉투·변기·하수구로 버리지 않아요. 모든 약국이 수거하는 것은 아니에요.",
  },
  {
    id: "liquid-medicine",
    name: "물약",
    aliases: ["시럽약", "액체약", "안약"],
    group: "특수폐기물",
    category: "폐의약품",
    recycleLabel: "액체 수거처 확인",
    description: [
      "용기 뚜껑을 잘 닫고 새지 않게 보호해 폐의약품 수거처에 배출해요.",
      "액체 약을 받는 장소와 포장 방법을 지역 기준으로 확인해요.",
    ],
    caution: "하수구에 붓거나 다른 약과 섞지 않아요. 우체통 배출 가능 여부를 임의로 판단하지 않아요.",
  },
  {
    id: "ointment",
    name: "연고",
    aliases: ["약연고", "피부연고", "연고튜브"],
    group: "특수폐기물",
    category: "폐의약품",
    recycleLabel: "용기째 수거",
    description: [
      "마개를 닫은 용기 상태로 폐의약품 수거처에 가져가요.",
      "지역 수거처의 포장·배출 안내를 따라요.",
    ],
    caution: "연고가 남은 튜브를 일반 플라스틱 수거함에 넣지 않아요.",
  },
  {
    id: "lighter",
    name: "라이터",
    aliases: ["가스라이터", "일회용라이터", "점화라이터"],
    group: "특수폐기물",
    category: "지역 기준 확인",
    recycleLabel: "잔여 연료 주의",
    description: [
      "남은 연료가 있거나 고장 난 라이터는 지역 청소 담당 부서에 안전한 처리 방법을 문의해요.",
      "사용을 마친 라이터도 지역 배출 기준을 확인해요.",
    ],
    caution: "연료를 억지로 빼거나 구멍을 뚫고 가열·분해하지 마세요.",
  },
  {
    id: "butane-can",
    name: "부탄가스",
    aliases: ["부탄가스통", "부탄캔", "휴대용부탄가스", "캠핑가스"],
    group: "특수폐기물",
    category: "지역 기준 확인",
    recycleLabel: "잔여 가스 주의",
    description: [
      "제품을 정상 사용한 빈 용기의 지역 배출 기준을 확인해요.",
      "가스가 남았거나 손상된 용기는 지역 담당 부서나 판매처에 문의해요.",
    ],
    caution: "임의 천공·가열·분해를 하지 말고, 실내에서 가스를 빼지 마세요.",
  },
  {
    id: "paint",
    name: "페인트",
    aliases: ["남은페인트", "수성페인트", "유성페인트", "페인트통"],
    group: "특수폐기물",
    category: "지역 기준 확인",
    recycleLabel: "성분·잔량별 처리",
    description: [
      "뚜껑을 닫아 새지 않게 보관하고 성분과 남은 양을 지역 청소 담당 부서에 알려 처리 방법을 확인해요.",
    ],
    caution: "하수구에 붓거나 다른 화학제품과 섞지 않아요. 내용물이 남은 통을 재활용함에 넣지 않아요.",
  },
  {
    id: "pesticide",
    name: "살충제",
    aliases: ["벌레약", "모기약", "바퀴벌레약"],
    group: "특수폐기물",
    category: "지역 기준 확인",
    recycleLabel: "제품 종류·잔량 확인",
    description: [
      "용기를 닫고 제품명과 남은 양을 지역 청소 담당 부서에 알려 처리 방법을 확인해요.",
    ],
    caution: "하수구에 붓거나 임의로 분사해 비우지 않아요. 압력 용기는 천공·가열하지 않아요.",
  },
  {
    id: "mercury-thermometer",
    name: "수은 체온계",
    aliases: ["수은온도계", "유리수은체온계", "수은계"],
    group: "특수폐기물",
    category: "유해 폐기물",
    recycleLabel: "지역 담당 부서 문의",
    description: [
      "깨지지 않도록 단단한 용기로 보호하고 지역 청소 담당 부서에 전용 처리 방법을 문의해요.",
    ],
    caution: "깨졌다면 수은을 맨손으로 만지거나 진공청소기로 빨아들이지 말고 담당 기관에 문의해요.",
  },
  {
    id: "cooking-oil",
    name: "폐식용유",
    aliases: ["식용유", "튀김기름", "남은식용유"],
    group: "특수폐기물",
    category: "폐식용유",
    recycleLabel: "전용 수거함",
    description: [
      "식힌 기름에 물이나 음식물이 섞이지 않게 모아 폐식용유 전용 수거처를 이용해요.",
      "수거처가 없거나 소량이라면 지역 배출 기준을 확인해요.",
    ],
    caution: "싱크대·변기·하수구에 붓지 않아요.",
  },
  {
    id: "fire-extinguisher",
    name: "소화기",
    aliases: ["폐소화기", "가정용소화기", "분말소화기"],
    group: "특수폐기물",
    category: "지역 기준 확인",
    recycleLabel: "신고·전문 수거 확인",
    description: [
      "지역 대형폐기물 신고 대상 또는 전문 수거처를 확인해요.",
      "신고가 필요하면 안내받은 방법과 장소에 맞춰 배출해요.",
    ],
    caution: "내용물을 임의로 분사하거나 용기를 분해·천공하지 마세요.",
  },
  {
    id: "nail-polish",
    name: "매니큐어",
    aliases: ["네일폴리시", "네일컬러", "메니큐어"],
    group: "특수폐기물",
    category: "지역 기준 확인",
    recycleLabel: "잔여 내용물 주의",
    description: [
      "뚜껑을 닫고 남은 내용물이 있는 상태의 지역 배출 방법을 문의해요.",
    ],
    caution: "용제를 하수구에 붓거나 임의로 증발시키지 않아요. 내용물이 남은 병은 유리병 재활용에 넣지 않아요.",
  },
  {
    id: "desiccant",
    name: "제습제",
    aliases: ["실리카겔", "방습제", "염화칼슘제습제"],
    group: "특수폐기물",
    category: "지역 기준 확인",
    recycleLabel: "성분 확인",
    description: [
      "실리카겔 봉지와 액체가 생기는 제습제는 처리 방법이 달라요.",
      "성분 표시·제품 안내와 지역 배출 기준을 확인해요.",
    ],
    caution: "내용물을 임의로 쏟거나 다른 화학제품과 섞지 않아요.",
  },
  {
    id: "hand-warmer",
    name: "일회용 핫팩",
    aliases: ["핫팩", "손난로팩", "철가루핫팩"],
    group: "특수폐기물",
    category: "일반쓰레기",
    recycleLabel: "완전히 식힌 뒤 배출",
    description: [
      "사용을 마치고 완전히 식은 일회용 핫팩은 종량제 봉투에 버려요.",
      "내용물은 꺼내지 않고 봉지째 배출해요.",
    ],
    caution: "충전식 손난로는 배터리·폐전자제품 수거 기준을 확인해요.",
  },
  {
    id: "glue",
    name: "접착제",
    aliases: ["순간접착제", "본드", "공업용접착제"],
    group: "특수폐기물",
    category: "지역 기준 확인",
    recycleLabel: "성분·잔량 확인",
    description: [
      "뚜껑을 닫고 제품 종류와 남은 양을 지역 청소 담당 부서에 알려 배출 방법을 확인해요.",
    ],
    caution: "하수구에 붓거나 가열하지 않아요. 용기 처리도 내용물 유무에 따라 확인해요.",
  },
  // 대형·기타 (14개)
  {
    id: "ice-pack",
    name: "아이스팩",
    aliases: ["보냉팩", "젤아이스팩", "물아이스팩"],
    group: "대형·기타",
    category: "아이스팩",
    recycleLabel: "내용물·지역 기준 확인",
    description: [
      "재사용 수거함이 있다면 수거 가능한 종류인지 확인해 이용해요.",
      "수거함이 없으면 물·젤 등 내용물 표시와 지역 배출 기준을 확인해요.",
    ],
    caution: "젤 내용물을 하수구에 버리지 않아요. 종류를 모르면 봉지를 임의로 뜯지 않아요.",
  },
  {
    id: "flowerpot",
    name: "화분",
    aliases: ["도자기화분", "토분", "플라스틱화분"],
    group: "대형·기타",
    category: "지역 기준 확인",
    recycleLabel: "재질별 배출",
    description: [
      "흙과 식물을 따로 분리하고 화분 재질을 확인해요.",
      "도자기·토분은 불연성, 플라스틱은 수거 여부를 지역 기준으로 확인해요.",
    ],
    caution: "큰 화분은 대형폐기물 신고 대상인지 확인해요.",
  },
  {
    id: "potting-soil",
    name: "화분 흙",
    aliases: ["흙", "배양토", "분갈이흙"],
    group: "대형·기타",
    category: "지역 기준 확인",
    recycleLabel: "토사 수거 기준 확인",
    description: [
      "흙은 음식물쓰레기나 재활용품에 넣지 않아요.",
      "불연성 마대 등 지역에서 정한 흙 배출 방법을 확인해요.",
    ],
    caution: "화단이나 공원에 임의로 버리지 않아요.",
  },
  {
    id: "mirror",
    name: "거울",
    aliases: ["손거울", "탁상거울", "전신거울"],
    group: "대형·기타",
    category: "불연성·대형 폐기물",
    recycleLabel: "크기별 배출",
    description: [
      "거울은 유리병 재활용에 넣지 않아요.",
      "작은 거울의 불연성 배출 방법과 큰 거울의 대형폐기물 신고 기준을 확인해요.",
    ],
    caution: "깨진 부분을 두꺼운 포장재로 감싸고 위험 표시를 해요.",
  },
  {
    id: "chair",
    name: "의자",
    aliases: ["책상의자", "접이식의자", "식탁의자"],
    group: "대형·기타",
    category: "대형폐기물",
    recycleLabel: "지역 신고 필요",
    description: [
      "지역 대형폐기물 신청에서 의자 종류와 크기를 확인해요.",
      "신고 후 안내받은 표시를 붙여 지정된 날짜와 장소에 배출해요.",
    ],
  },
  {
    id: "desk",
    name: "책상",
    aliases: ["테이블", "식탁", "컴퓨터책상"],
    group: "대형·기타",
    category: "대형폐기물",
    recycleLabel: "지역 신고 필요",
    description: [
      "지역 대형폐기물 신청에서 품목과 크기를 확인하고 신고해요.",
      "안내받은 날짜와 장소에 배출해요.",
    ],
    caution: "유리 상판이 있다면 파손되지 않게 보호하고 함께 신고할지 확인해요.",
  },
  {
    id: "mattress",
    name: "매트리스",
    aliases: ["침대매트리스", "매트리스토퍼", "침대토퍼"],
    group: "대형·기타",
    category: "대형폐기물",
    recycleLabel: "지역 신고 필요",
    description: [
      "크기와 종류를 확인해 지역 대형폐기물 배출을 신청해요.",
      "안내받은 방식으로 표시하고 지정 장소에 배출해요.",
    ],
    caution: "스프링을 꺼내려고 임의로 해체하지 않아요.",
  },
  {
    id: "sofa",
    name: "소파",
    aliases: ["쇼파", "1인소파", "2인소파"],
    group: "대형·기타",
    category: "대형폐기물",
    recycleLabel: "지역 신고 필요",
    description: [
      "인용 수와 크기를 확인해 지역 대형폐기물 배출을 신청해요.",
      "신고한 날짜와 장소에 맞춰 배출해요.",
    ],
  },
  {
    id: "bookshelf",
    name: "책장",
    aliases: ["수납장", "서랍장", "선반장"],
    group: "대형·기타",
    category: "대형폐기물",
    recycleLabel: "지역 신고 필요",
    description: [
      "내용물을 비우고 크기·재질에 맞는 지역 대형폐기물 품목으로 신고해요.",
      "안내받은 표시를 붙여 지정 장소에 배출해요.",
    ],
  },
  {
    id: "suitcase",
    name: "여행가방",
    aliases: ["캐리어", "캐리어가방", "트렁크가방"],
    group: "대형·기타",
    category: "대형폐기물",
    recycleLabel: "크기·지역 기준 확인",
    description: [
      "내용물을 비우고 지역 대형폐기물 품목과 크기 기준을 확인해요.",
      "신고가 필요한 경우 절차에 맞춰 배출해요.",
    ],
    caution: "작다는 이유만으로 의류 수거함에 넣지 않아요.",
  },
  {
    id: "rug",
    name: "카펫",
    aliases: ["카페트", "러그", "바닥러그"],
    group: "대형·기타",
    category: "대형·일반 폐기물",
    recycleLabel: "크기·지역 기준 확인",
    description: [
      "먼지가 흩어지지 않게 말아서 묶어요.",
      "종량제 봉투 배출 또는 대형폐기물 신고 대상인지 지역 기준을 확인해요.",
    ],
  },
  {
    id: "drying-rack",
    name: "빨래건조대",
    aliases: ["건조대", "접이식건조대", "빨래대"],
    group: "대형·기타",
    category: "지역 기준 확인",
    recycleLabel: "재질·크기 확인",
    description: [
      "접어서 날카로운 부분을 보호하고 지역 고철 수거 또는 대형폐기물 신고 기준을 확인해요.",
    ],
    caution: "플라스틱 연결부를 떼기 위해 억지로 분해하지 않아요.",
  },
  {
    id: "cat-litter",
    name: "고양이 모래",
    aliases: ["배변모래", "두부모래", "벤토나이트모래"],
    group: "대형·기타",
    category: "지역 기준 확인",
    recycleLabel: "재질별 배출",
    description: [
      "사용한 모래와 배설물은 흩어지지 않게 모아요.",
      "식물성·광물성 재질에 따라 종량제 봉투나 불연성 마대 등 지역 기준을 확인해요.",
    ],
    caution: "음식물쓰레기로 배출하거나 변기에 흘려보내지 않아요.",
  },
  {
    id: "compact-disc",
    name: "CD",
    aliases: ["DVD", "씨디", "디브이디", "광디스크"],
    group: "대형·기타",
    category: "일반쓰레기",
    recycleLabel: "복합 재질",
    description: [
      "별도 회수처가 없다면 CD·DVD는 일반적으로 종량제 봉투에 버려요.",
      "케이스와 종이 속지는 재질별 지역 수거 기준을 확인해요.",
    ],
    caution: "개인정보가 담긴 디스크는 안전한 정보 폐기 방법을 이용해요.",
  },
];

/** 검색 결과 아래에 작게 붙는 안내 — 지자체마다 기준이 달라 단정하지 않는다. */
export const TRASH_REGION_NOTICE = '지역에 따라 배출 방법이 다를 수 있어요.';

/** 공백·구두점·기호를 제거하고 전각 영문/숫자와 대소문자를 통일한다.
 * PET병 ↔ 페트병처럼 언어가 다른 표기는 품목별 aliases에서 연결한다. */
export function normalizeTrashQuery(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/* 원본 정적 배열을 변경하지 않고 검색용 표기만 한 번 정규화한다. */
const TRASH_SEARCH_INDEX = TRASH_ITEMS.map((item) => ({
  item,
  name: normalizeTrashQuery(item.name),
  aliases: item.aliases.map(normalizeTrashQuery),
}));

/** 이름/별칭의 완전 일치를 먼저 찾는다.
 * '보조배터리'가 '배터리'에, '깨진 유리병'이 '유리병'에 먼저 연결되지 않게 한다.
 * 부분 일치는 두 글자 이상이고 한 품목으로 좁혀질 때만 허용한다. */
export function findTrashItem(query: string): TrashItem | null {
  const needle = normalizeTrashQuery(query);
  if (!needle) return null;

  const exactName = TRASH_SEARCH_INDEX.find((entry) => entry.name === needle);
  if (exactName) return exactName.item;
  const exactAlias = TRASH_SEARCH_INDEX.find((entry) => entry.aliases.includes(needle));
  if (exactAlias) return exactAlias.item;

  if (needle.length < 2) return null;
  const matches = TRASH_SEARCH_INDEX.filter((entry) =>
    [entry.name, ...entry.aliases].some((keyword) => keyword.includes(needle)),
  );
  return matches.length === 1 ? matches[0].item : null;
}

/** 검색어 뒤에 붙는 '으로/로' 를 받침에 맞춰 고른다 — 받침이 없거나 ㄹ 이면 '로'. */
export function withDirectionParticle(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return `${word}로`;
  const finalConsonant = (code - 0xac00) % 28;
  return finalConsonant === 0 || finalConsonant === 8 ? `${word}로` : `${word}으로`;
}

/* ================= 잊기 전에 챙겨요 ================= */

/* 시간대나 시:분에 흔들리지 않도록 '날짜' 단위(로컬 자정 기준)로만 계산한다. */
const MS_PER_DAY = 86_400_000;

function toDayIndex(date: Date): number {
  return Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / MS_PER_DAY,
  );
}

/** Date → 'yyyy-mm-dd' (로컬 기준). */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** n일 전 날짜 문자열 — 목업 초기값과 시트 입력값을 같은 방식으로 만든다. */
export function isoDaysAgo(days: number, now: Date = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.max(0, days));
  return toIsoDate(date);
}

/** 마지막 관리일로부터 며칠 지났는지. 값이 이상하면 0(오늘)으로 본다 — UI 에 NaN 이 뜨지 않게. */
export function daysSinceManaged(lastManagedAt: string, now: Date = new Date()): number {
  const parsed = new Date(`${lastManagedAt}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.max(0, toDayIndex(now) - toDayIndex(parsed));
}

export interface HouseRoutine {
  id: string;
  name: string;
  /** public/assets/icon 안의 파일명 */
  iconFile: string;
  /** 권장 주기(일) */
  intervalDays: number;
  /** 화면에 보이는 주기 표기 — '1개월' 처럼 일수와 다르게 읽히는 값이 있어 따로 둔다 */
  intervalLabel: string;
  /** 마지막으로 관리한 날 'yyyy-mm-dd' (로컬 기준) */
  lastManagedAt: string;
}

export interface RoutineStatus {
  /** 다음 관리일까지 남은 일수. 0 이면 오늘, 음수면 지났다. */
  remainingDays: number;
  ddayLabel: string;
  lastManagedLabel: string;
  /** 확장 패널의 '다음 관리' 줄 */
  nextCareLabel: string;
  /** true면 강조(당일·지남) 칩, false면 옅은 칩 */
  urgent: boolean;
}

/** D-day 와 날짜 문구는 저장하지 않고 주기 + 마지막 관리일에서 매번 계산한다. */
export function routineStatus(routine: HouseRoutine, now: Date = new Date()): RoutineStatus {
  const since = daysSinceManaged(routine.lastManagedAt, now);
  const remainingDays = routine.intervalDays - since;
  return {
    remainingDays,
    ddayLabel:
      remainingDays > 0
        ? `D-${remainingDays}`
        : remainingDays === 0
          ? 'D-day'
          : `D+${-remainingDays}`,
    lastManagedLabel: since === 0 ? '오늘' : since === 1 ? '어제' : `${since}일 전`,
    nextCareLabel:
      remainingDays > 0
        ? `${remainingDays}일 뒤`
        : remainingDays === 0
          ? '오늘'
          : `${-remainingDays}일 지남`,
    urgent: remainingDays <= 0,
  };
}

/** 오늘 관리한 항목은 아래로, 나머지는 기한이 지난 순서부터 가까운 관리일 순서로.
 * 같은 기한과 오늘 관리한 항목끼리는 입력 순서를 유지한다. 원본 배열은 바꾸지 않는다. */
export function sortRoutinesByUrgency(
  routines: readonly HouseRoutine[],
  now: Date = new Date(),
): HouseRoutine[] {
  const today = toIsoDate(now);
  return [...routines].sort((a, b) => {
    const aManagedToday = a.lastManagedAt === today;
    const bManagedToday = b.lastManagedAt === today;
    if (aManagedToday !== bManagedToday) return aManagedToday ? 1 : -1;
    if (aManagedToday) return 0;
    return routineStatus(a, now).remainingDays - routineStatus(b, now).remainingDays;
  });
}

/* Figma daily_living 의 두 루틴.
 * 세탁조 청소는 '30일 전 · 권장 1개월' → D-day 로 목업과 정확히 일치한다.
 * 수세미 교체는 목업이 '30일 전'인데 같은 1개월 주기로는 D-day 가 나온다(목업 자체가
 * 어긋나 있다). D-day 를 실제 날짜에서 계산하기로 한 이상 둘 다 맞출 수는 없어서,
 * 칩에 보이는 D-9 를 살리고 마지막 관리일을 21일 전으로 맞춘다. */
export const DEFAULT_ROUTINES: HouseRoutine[] = [
  {
    id: 'washer-tub',
    name: '세탁조 청소',
    iconFile: 'menu-broom.svg',
    intervalDays: 30,
    intervalLabel: '1개월',
    lastManagedAt: isoDaysAgo(30),
  },
  {
    id: 'dish-sponge',
    name: '수세미 교체',
    iconFile: 'life-house-daily.svg',
    intervalDays: 30,
    intervalLabel: '1개월',
    lastManagedAt: isoDaysAgo(21),
  },
];

/** 루틴 추가 / 주기 수정 시트의 '관리 주기' 선택지 */
export const ROUTINE_INTERVALS = [
  { key: 'w1', label: '1주', days: 7 },
  { key: 'w2', label: '2주', days: 14 },
  { key: 'm1', label: '1개월', days: 30 },
  { key: 'm3', label: '3개월', days: 90 },
] as const;

export type RoutineInterval = (typeof ROUTINE_INTERVALS)[number];

/** 루틴 추가 시트의 '마지막 관리일' 선택지 */
export const ROUTINE_LAST_CARES = [
  { key: 'today', label: '오늘', daysAgo: 0 },
  { key: 'd3', label: '3일 전', daysAgo: 3 },
  { key: 'w1', label: '1주 전', daysAgo: 7 },
  { key: 'w2', label: '2주 전', daysAgo: 14 },
] as const;

/** 오늘 관리를 마친 루틴. 이미 오늘 완료한 루틴에 다시 써도 같은 값이라 연타에 안전하다. */
export function completeRoutine(routine: HouseRoutine, now: Date = new Date()): HouseRoutine {
  return { ...routine, lastManagedAt: toIsoDate(now) };
}

export interface NewRoutineInput {
  name: string;
  intervalDays: number;
  intervalLabel: string;
  lastCareDaysAgo: number;
}

/** 시트 입력값으로 새 루틴을 만든다 — 아이콘은 살림 카테고리 기본 아이콘을 쓴다. */
export function createRoutine(input: NewRoutineInput): HouseRoutine {
  const intervalDays = Number.isFinite(input.intervalDays) ? Math.max(1, input.intervalDays) : 30;
  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    iconFile: 'menu-broom.svg',
    intervalDays,
    intervalLabel: input.intervalLabel,
    lastManagedAt: isoDaysAgo(input.lastCareDaysAgo),
  };
}

/* ================= 지금 챙겨볼 살림 팁 ================= */

export interface HouseTip {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

/* 살림 팁 카드. 누르면 이 화면에서 상세를 펼치지 않고 커뮤니티 '자취 꿀팁' 으로 넘어가므로
 * 카드에 보이는 값만 둔다. */
export const HOUSE_TIP: HouseTip = {
  id: 'laundry-smell',
  image: 'life-tip-laundry.png',
  title: '빨래에서 쉰내가 나요',
  subtitle: '냄새 줄이는 세탁 순서',
};

/* 생활 > 살림 데이터.
 *
 * Figma daily_living (2289:24128) 은 "버릴 물건 검색 → 결과 1건"을 예시로 보여준다.
 * 실제 화면에서는 검색어에 매칭되는 분리배출 항목을 찾아 같은 형태로 보여줘야 하므로,
 * 자주 헷갈리는 분리배출 항목 몇 가지를 최소 데이터셋으로 둔다(48개 홈케어 시나리오처럼
 * 전부를 다루지는 않지만, 검색이 "죽은 기능"처럼 보이지 않을 만큼은 채운다).
 * 지자체마다 배출 기준이 다를 수 있는 항목은 확정적인 단언 대신 일반적인 기준으로 안내한다. */

export interface TrashItem {
  id: string;
  /** 검색 결과 제목 — 예: "일반쓰레기" */
  name: string;
  /** 검색어 자체이자 결과 상단에 보이는 굵은 제목 — 예: "영수증" */
  query: string;
  /** 결과 제목 옆 태그 — 예: "종이류" */
  category: string;
  /** 이 검색어로도 찾을 수 있게 하는 추가 키워드 */
  keywords: string[];
  /** 안내 본문 2줄 */
  lines: [string, string];
}

export const TRASH_ITEMS: TrashItem[] = [
  {
    id: 'receipt',
    query: '영수증',
    name: '일반쓰레기',
    category: '종이류',
    keywords: ['감열지', '리시트'],
    lines: [
      '종량제 봉투에 버려주세요.',
      '감열지는 종이처럼 보여도 재활용이 어려워요!',
    ],
  },
  {
    id: 'battery',
    query: '건전지',
    name: '유해폐기물',
    category: '전용 수거함',
    keywords: ['배터리'],
    lines: [
      '동네 주민센터나 아파트 전용 수거함에 넣어주세요.',
      '일반쓰레기나 재활용함에 섞으면 안 돼요.',
    ],
  },
  {
    id: 'fluorescent',
    query: '형광등',
    name: '유해폐기물',
    category: '전용 수거함',
    keywords: ['LED등', '전구'],
    lines: [
      '깨지지 않게 전용 수거함에 배출해주세요.',
      '일반쓰레기에 섞으면 수은이 새어 나올 수 있어요.',
    ],
  },
  {
    id: 'umbrella',
    query: '우산',
    name: '일반쓰레기',
    category: '복합재질',
    keywords: [],
    lines: [
      '철제·천이 섞여 있어 일반쓰레기로 버려주세요.',
      '우산살만 따로 분리하기 어려우니 통째로 배출해요.',
    ],
  },
  {
    id: 'broken-glass',
    query: '깨진 유리컵',
    name: '일반쓰레기',
    category: '파손 유리',
    keywords: ['유리컵', '깨진유리', '유리조각'],
    lines: [
      '신문지로 감싸 일반쓰레기로 버려주세요.',
      '깨진 유리는 재활용 선별이 불가능해요.',
    ],
  },
  {
    id: 'styrofoam',
    query: '스티로폼',
    name: '발포수지류',
    category: '분리배출',
    keywords: ['에어캡', '아이스박스'],
    lines: [
      '테이프·스티커를 떼고 깨끗하면 분리배출해요.',
      '음식물이 묻었거나 오염됐다면 일반쓰레기로 버려요.',
    ],
  },
  {
    id: 'pet-bottle',
    query: '투명 페트병',
    name: '무색페트류',
    category: '분리배출',
    keywords: ['페트병', '생수병'],
    lines: [
      '라벨을 떼고 압착해 별도로 배출해주세요.',
      '다른 플라스틱과 섞이면 재활용 품질이 떨어져요.',
    ],
  },
  {
    id: 'milk-carton',
    query: '우유팩',
    name: '종이팩',
    category: '분리배출',
    keywords: ['멸균팩', '두유팩'],
    lines: [
      '헹군 뒤 펼쳐서 종이류와 구분해 배출해요.',
      '종이팩 전용함이 있다면 일반 폐지함 대신 그쪽에 넣어요.',
    ],
  },
  {
    id: 'old-clothes',
    query: '헌 옷',
    name: '의류',
    category: '의류수거함',
    keywords: ['옷', '헌옷'],
    lines: [
      '동네 의류수거함에 넣어주세요.',
      '심하게 오염되거나 찢어졌다면 일반쓰레기로 버려요.',
    ],
  },
  {
    id: 'small-appliance',
    query: '소형가전',
    name: '소형가전',
    category: '전용 수거함',
    keywords: ['헤어드라이기', '전자제품'],
    lines: [
      '소형가전 전용 수거함이나 배출 스티커를 이용해요.',
      '일반쓰레기로 버리면 안 돼요.',
    ],
  },
];

/** 화면 진입 시 기본으로 보여줄 검색어 — Figma 목업의 기본 상태와 동일하게 맞춘다. */
export const DEFAULT_TRASH_QUERY = '영수증';

export function findTrashItem(query: string): TrashItem | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  return (
    TRASH_ITEMS.find(
      (item) =>
        item.query.includes(trimmed) ||
        trimmed.includes(item.query) ||
        item.keywords.some((keyword) => keyword.includes(trimmed) || trimmed.includes(keyword)),
    ) ?? null
  );
}

export interface HouseRoutine {
  id: string;
  name: string;
  /** public/assets/icon 안의 파일명 */
  iconFile: string;
  lastCheckedLabel: string;
  intervalLabel: string;
  ddayLabel: string;
  /** true면 강조(당일·임박) 칩, false면 옅은 칩 */
  urgent: boolean;
}

export const HOUSE_ROUTINES: HouseRoutine[] = [
  {
    id: 'washer-tub',
    name: '세탁조 청소',
    iconFile: 'menu-broom.svg',
    lastCheckedLabel: '30일 전',
    intervalLabel: '1개월',
    ddayLabel: 'D-day',
    urgent: true,
  },
  {
    id: 'dish-sponge',
    name: '수세미 교체',
    iconFile: 'life-house-daily.svg',
    lastCheckedLabel: '30일 전',
    intervalLabel: '1개월',
    ddayLabel: 'D-9',
    urgent: false,
  },
];

export interface HouseTip {
  image: string;
  title: string;
  subtitle: string;
}

export const HOUSE_TIP: HouseTip = {
  image: 'life-tip-laundry.png',
  title: '빨래에서 쉰내가 나요',
  subtitle: '냄새 줄이는 세탁 순서',
};

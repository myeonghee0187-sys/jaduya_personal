/** 홈 "자두 PICK" 개인화 광고 콘텐츠 — 관심 분야(6) × 관심 주제(6) = 36개 + fallback 4개.
 *
 * 전부 포트폴리오용 mock 이다 — 광고주는 가상이고 실제 브랜드·외부 URL 은 쓰지 않는다.
 * 관심 분야·주제의 원본은 data/livingProfile.ts 의 INTEREST_CATEGORIES / INTEREST_TOPICS 다.
 * 이 파일은 그 36개 각각에 붙는 광고만 담는다(주제 하나 = 광고 하나).
 *
 * 맞춤 팁(data/recommendationTips.ts)과 역할이 다르다:
 *   팁  = 정보·노하우·가이드
 *   광고 = 그 문제를 풀어 주는 상품·서비스·혜택
 * 두 노출 로직은 서로 독립이다 — 팁은 팁대로, 광고는 selectDiscoveryAds 로 따로 고른다.
 *
 * 이미지는 개별 파일이 아니라 2×2 아이콘 시트 6장(public/assets/img/ads/)을 CSS sprite 로
 * 쓴다 — imageSheet(어느 시트) + imagePosition(2×2 중 어느 칸)만 들고 있다(components/AdIcon.tsx).
 *   life      01_daily_life_icons        cleaning · laundry · daily-supplies · outdoor
 *   money     02_money_management_icons  payment · saving · budget · report
 *   grocery   03_grocery_icons           grocery · storage-food · small-food · meal-kit
 *   housing   04_moving_housing_icons    moving · home-service · contract · home-care
 *   interior  05_interior_icons          storage · furniture · lighting · decor
 *   alone     06_living_alone_icons      starter-kit · routine · safety · living-tools
 * (칸 순서: 좌상 · 우상 · 좌하 · 우하)
 */

import { INTEREST_CATEGORIES, INTEREST_TOPICS } from './livingProfile';
import type { InterestCategory, LivingProfilePreferences } from './livingProfile';

export type AdSheet = 'life' | 'money' | 'grocery' | 'housing' | 'interior' | 'alone';
export type AdIconPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** 혜택 표현의 종류 — 인접한 페이지에서 같은 종류가 이어지지 않게 고를 때만 쓴다. */
export type AdBenefitType = 'discount' | 'free' | 'coupon' | 'trial';

export interface AdContent {
  /** 광고 카테고리 — 4개 페이지 안에서 같은 카테고리가 두 번 나오지 않게 하는 기준 */
  adCategory: string;
  /** 카드 헤드라인(1줄, 8자 안팎) */
  headline: string;
  /** 카드 서브 카피(1줄) */
  sub: string;
  /** 상세 바텀시트 설명 — 홈 카드에는 나오지 않는다 */
  detail: string;
  /** 혜택 — 카드 하단에 "라벨 / 값" 으로 나온다 */
  benefitLabel: string;
  benefitValue: string;
  benefitType: AdBenefitType;
  imageSheet: AdSheet;
  imagePosition: AdIconPosition;
  /** 가상 광고주명 — 상세 바텀시트에서만 보여준다 */
  advertiser: string;
  /** 상세 바텀시트 버튼 문구 — 홈 카드에는 나오지 않는다 */
  cta: string;
}

export const ADS: Record<InterestCategory, Record<string, AdContent>> = {
  생활: {
    '분리수거 요령': {
      adCategory: '정리 박스',
      headline: '분리수거 쉽게',
      sub: '정리 박스 세트',
      detail: '종이·상자류를 모아 두기 좋은 접이식 정리 박스예요. 배출일까지 깔끔하게 보관해요.',
      benefitLabel: '묶음 구매',
      benefitValue: '15%',
      benefitType: 'discount',
      imageSheet: 'housing',
      imagePosition: 'top-left',
      advertiser: '정리한 상점',
      cta: '상품 보기',
    },
    '욕실·주방 청소': {
      adCategory: '청소용품',
      headline: '물때 싹 제거',
      sub: '욕실 클리너',
      detail: '욕실·주방 물때에 쓰는 클리너와 스펀지 세트예요. 이번 주 구매하면 1+1 행사예요.',
      benefitLabel: '이번 주',
      benefitValue: '1+1',
      benefitType: 'discount',
      imageSheet: 'life',
      imagePosition: 'top-left',
      advertiser: '반짝살림',
      cta: '상품 보기',
    },
    '세탁 관리': {
      adCategory: '세탁·건조',
      headline: '수건 뽀송하게',
      sub: '접이식 건조대',
      detail: '좁은 집에서도 펼쳐 쓰는 접이식 빨래건조대예요. 보관할 땐 얇게 접어 둘 수 있어요.',
      benefitLabel: '배송비',
      benefitValue: '무료',
      benefitType: 'free',
      imageSheet: 'life',
      imagePosition: 'top-right',
      advertiser: '뽀송하루',
      cta: '상품 보기',
    },
    '생활용품 관리': {
      adCategory: '생필품 정기배송',
      headline: '떨어지기 전에',
      sub: '생필품 정기배송',
      detail: '휴지·세제처럼 자주 떨어지는 생필품을 주기에 맞춰 보내 드려요. 첫 배송은 10% 할인이에요.',
      benefitLabel: '첫 배송',
      benefitValue: '10%',
      benefitType: 'discount',
      imageSheet: 'life',
      imagePosition: 'bottom-left',
      advertiser: '채움생활',
      cta: '구독하기',
    },
    '날씨·외출 팁': {
      adCategory: '우산·외출용품',
      headline: '비 와도 가볍게',
      sub: '초경량 접이식 우산',
      detail: '가방에 쏙 들어가는 초경량 접이식 우산이에요. 2개를 사면 10% 할인돼요.',
      benefitLabel: '2개 구매',
      benefitValue: '10%',
      benefitType: 'discount',
      imageSheet: 'life',
      imagePosition: 'bottom-right',
      advertiser: '가벼운하루',
      cta: '상품 보기',
    },
    '1인 가구 살림템': {
      adCategory: '생활 필수품',
      headline: '혼자 쓰기 딱',
      sub: '생활 필수품 모음전',
      detail: '혼자 살 때 자주 쓰는 생활 필수품을 한곳에 모았어요. 기획전 상품은 최대 30% 할인 중이에요.',
      benefitLabel: '최대',
      benefitValue: '30%',
      benefitType: 'discount',
      imageSheet: 'life',
      imagePosition: 'bottom-left',
      advertiser: '아담살림',
      cta: '기획전 보기',
    },
  },

  '돈 관리': {
    '월세·관리비': {
      adCategory: '납부 서비스',
      headline: '월세 자동납부',
      sub: '납부일 걱정 끝',
      detail: '월세와 관리비를 정해진 날짜에 자동으로 납부해 드려요. 이용 수수료는 없어요.',
      benefitLabel: '수수료',
      benefitValue: '0원',
      benefitType: 'free',
      imageSheet: 'money',
      imagePosition: 'bottom-left',
      advertiser: '한달페이',
      cta: '신청하기',
    },
    '공과금 절약': {
      adCategory: '에너지 절약',
      headline: '대기전력 차단',
      sub: '스마트 플러그',
      detail: '타이머로 쓰지 않는 시간의 대기전력을 끄는 스마트 플러그예요. 2개를 사면 15% 할인돼요.',
      benefitLabel: '2개 구매',
      benefitValue: '15%',
      benefitType: 'discount',
      imageSheet: 'money',
      imagePosition: 'bottom-right',
      advertiser: '플러그온',
      cta: '상품 보기',
    },
    '고정지출 관리': {
      adCategory: '통신·구독',
      headline: '요금제 한눈에',
      sub: '통신·구독 비교',
      detail: '통신·구독 요금제를 한눈에 비교해 볼 수 있어요. 비교 서비스는 무료예요.',
      benefitLabel: '비교',
      benefitValue: '무료',
      benefitType: 'free',
      imageSheet: 'money',
      imagePosition: 'top-left',
      advertiser: '요금한눈',
      cta: '비교하기',
    },
    '생활비 절약': {
      adCategory: '결제 혜택',
      headline: '결제 혜택 모아요',
      sub: '제휴 쿠폰 모음',
      detail: '마트·편의점 등 제휴처에서 쓸 수 있는 쿠폰을 모아 볼 수 있어요. 가입하면 쿠폰을 드려요.',
      benefitLabel: '가입 시',
      benefitValue: '쿠폰',
      benefitType: 'coupon',
      imageSheet: 'money',
      imagePosition: 'top-left',
      advertiser: '혜택모아',
      cta: '쿠폰 받기',
    },
    '예산 관리': {
      adCategory: '통장·가계부',
      headline: '통장 쪼개기',
      sub: '예산 통장 만들기',
      detail: '생활비를 항목별로 나눠 담는 예산 통장이에요. 개설 수수료는 없어요.',
      benefitLabel: '개설 수수료',
      benefitValue: '0원',
      benefitType: 'free',
      imageSheet: 'money',
      imagePosition: 'top-right',
      advertiser: '모아통장',
      cta: '자세히 보기',
    },
    '월별 지출 체크': {
      adCategory: '소비 분석 앱',
      headline: '주간 지출 리포트',
      sub: '자동 소비 분석',
      detail: '결제 내역을 모아 주간 지출 리포트로 보여 드려요. 첫 달은 무료로 이용해 볼 수 있어요.',
      benefitLabel: '첫 달',
      benefitValue: '무료',
      benefitType: 'trial',
      imageSheet: 'money',
      imagePosition: 'bottom-right',
      advertiser: '지출노트',
      cta: '무료 체험',
    },
  },

  장보기: {
    '장보기 할인': {
      adCategory: '온라인 마트',
      headline: '신선식품 특가',
      sub: '장바구니 쿠폰',
      detail: '신선식품 장바구니 쿠폰을 받아 보세요. 최대 30% 할인 쿠폰이 준비돼 있어요.',
      benefitLabel: '최대',
      benefitValue: '30%',
      benefitType: 'discount',
      imageSheet: 'grocery',
      imagePosition: 'top-left',
      advertiser: '마켓한바구니',
      cta: '쿠폰 받기',
    },
    '식재료 보관법': {
      adCategory: '보관용기',
      headline: '신선함 오래오래',
      sub: '밀폐 보관용기',
      detail: '채소와 남은 식재료를 오래 두기 좋은 밀폐 보관용기예요. 배송비는 무료예요.',
      benefitLabel: '배송비',
      benefitValue: '무료',
      benefitType: 'free',
      imageSheet: 'grocery',
      imagePosition: 'top-right',
      advertiser: '오래오래 키친',
      cta: '상품 보기',
    },
    '냉장고 관리': {
      adCategory: '냉장고 정리용품',
      headline: '냉장고 한눈에',
      sub: '정리 용기 세트',
      detail: '칸칸이 나눠 담는 냉장고 정리 용기 세트예요. 용기는 2+1 행사 중이에요.',
      benefitLabel: '용기',
      benefitValue: '2+1',
      benefitType: 'discount',
      imageSheet: 'grocery',
      imagePosition: 'top-right',
      advertiser: '냉장고정돈',
      cta: '상품 보기',
    },
    '소용량 식재료': {
      adCategory: '소포장 식품',
      headline: '한 끼에 딱',
      sub: '1인 소포장 식재료',
      detail: '한 끼에 필요한 만큼만 소분한 1인용 식재료예요. 첫 구매는 20% 할인이에요.',
      benefitLabel: '첫 구매',
      benefitValue: '20%',
      benefitType: 'discount',
      imageSheet: 'grocery',
      imagePosition: 'bottom-left',
      advertiser: '한끼상회',
      cta: '상품 보기',
    },
    '식비 절약': {
      adCategory: '마감 특가',
      headline: '마감 특가 모음',
      sub: '오늘 소진 식품',
      detail: '오늘 소진하면 좋은 마감 임박 식품을 특가로 모았어요. 최대 50% 할인 상품도 있어요.',
      benefitLabel: '마감 임박',
      benefitValue: '특가',
      benefitType: 'discount',
      imageSheet: 'grocery',
      imagePosition: 'bottom-right',
      advertiser: '마감마켓',
      cta: '특가 보기',
    },
    '간편 요리': {
      adCategory: '밀키트',
      headline: '10분이면 완성',
      sub: '1인 밀키트',
      detail: '손질된 재료와 소스가 들어 있는 1인 밀키트예요. 첫 주문 시 쿠폰을 드려요.',
      benefitLabel: '첫 주문',
      benefitValue: '쿠폰',
      benefitType: 'coupon',
      imageSheet: 'grocery',
      imagePosition: 'bottom-right',
      advertiser: '십분키친',
      cta: '메뉴 보기',
    },
  },

  '이사·주거': {
    '이사 준비': {
      adCategory: '소형이사',
      headline: '혼자 이사해요',
      sub: '원룸 소형이사',
      detail: '원룸·짐 적은 이사에 맞춘 소형 이사 서비스예요. 견적은 무료로 받아 볼 수 있어요.',
      benefitLabel: '견적',
      benefitValue: '무료',
      benefitType: 'free',
      imageSheet: 'housing',
      imagePosition: 'top-left',
      advertiser: '혼자이사',
      cta: '견적 받기',
    },
    '전기·가스 신청': {
      adCategory: '입주 세팅',
      headline: '입주날 바로 연결',
      sub: '인터넷 설치',
      detail: '이사 당일 바로 쓸 수 있게 인터넷 설치를 미리 신청해요. 신청하면 쿠폰을 드려요.',
      benefitLabel: '신청 시',
      benefitValue: '쿠폰',
      benefitType: 'coupon',
      imageSheet: 'housing',
      imagePosition: 'top-right',
      advertiser: '입주온',
      cta: '신청하기',
    },
    전입신고: {
      adCategory: '주소 변경 서비스',
      headline: '주소 변경 한번에',
      sub: '택배·우편·은행',
      detail: '은행·택배·우편 주소를 한 번에 바꿀 수 있게 도와드려요. 이용료는 없어요.',
      benefitLabel: '이용료',
      benefitValue: '무료',
      benefitType: 'free',
      imageSheet: 'housing',
      imagePosition: 'bottom-left',
      advertiser: '주소한번',
      cta: '자세히 보기',
    },
    '폐기물 배출': {
      adCategory: '대형폐기물 수거',
      headline: '큰 짐 걱정 끝',
      sub: '문 앞 방문 수거',
      detail: '큰 짐을 문 앞까지 방문해서 수거해 드려요. 첫 수거는 5천 원 할인이에요.',
      benefitLabel: '첫 수거',
      benefitValue: '5천원↓',
      benefitType: 'discount',
      imageSheet: 'housing',
      imagePosition: 'top-left',
      advertiser: '큰짐수거',
      cta: '예약하기',
    },
    '계약 체크': {
      adCategory: '부동산 안심',
      headline: '계약 전 점검',
      sub: '등기·시세 확인',
      detail: '등기부등본과 시세를 확인해 주는 서비스예요. 첫 열람은 무료로 해 볼 수 있어요.',
      benefitLabel: '첫 열람',
      benefitValue: '무료',
      benefitType: 'trial',
      imageSheet: 'housing',
      imagePosition: 'bottom-left',
      advertiser: '안심집체크',
      cta: '확인하기',
    },
    '집 관리': {
      adCategory: '청소·수리',
      headline: '구석구석 청소',
      sub: '입주 청소 예약',
      detail: '입주 전후 구석구석 청소를 예약할 수 있어요. 첫 예약은 15% 할인돼요.',
      benefitLabel: '첫 예약',
      benefitValue: '15%',
      benefitType: 'discount',
      imageSheet: 'housing',
      imagePosition: 'bottom-right',
      advertiser: '집안구석',
      cta: '예약하기',
    },
  },

  인테리어: {
    '원룸 공간 활용': {
      adCategory: '접이식 가구',
      headline: '좁아도 넓게',
      sub: '접이식 가구전',
      detail: '필요할 때만 펼쳐 쓰는 접이식 테이블·의자를 모았어요. 최대 40% 할인 중이에요.',
      benefitLabel: '최대',
      benefitValue: '40%',
      benefitType: 'discount',
      imageSheet: 'interior',
      imagePosition: 'top-right',
      advertiser: '접어담다',
      cta: '기획전 보기',
    },
    '수납 아이디어': {
      adCategory: '슬림 수납',
      headline: '틈새 수납장',
      sub: '슬림 수납장전',
      detail: '가구 사이 틈에 딱 들어가는 슬림 수납장이에요. 배송비는 무료예요.',
      benefitLabel: '배송비',
      benefitValue: '무료',
      benefitType: 'free',
      imageSheet: 'interior',
      imagePosition: 'top-left',
      advertiser: '틈새가구',
      cta: '기획전 보기',
    },
    '가구 배치': {
      adCategory: '배치 앱',
      headline: '배치 미리 해봐요',
      sub: '3D 방 꾸미기 앱',
      detail: '가구를 옮기기 전에 3D로 미리 배치해 볼 수 있는 앱이에요. 프리미엄을 1개월 체험해 봐요.',
      benefitLabel: '체험',
      benefitValue: '1개월',
      benefitType: 'trial',
      imageSheet: 'interior',
      imagePosition: 'top-right',
      advertiser: '방그리기',
      cta: '앱 체험',
    },
    홈데코: {
      adCategory: '소품',
      headline: '소품 하나로 뚝딱',
      sub: '무드 소품 모음전',
      detail: '작은 소품 하나로 방 분위기를 바꿀 수 있어요. 첫 구매 시 쿠폰을 드려요.',
      benefitLabel: '첫 구매',
      benefitValue: '쿠폰',
      benefitType: 'coupon',
      imageSheet: 'interior',
      imagePosition: 'bottom-right',
      advertiser: '소품가게 작은방',
      cta: '상품 보기',
    },
    '조명 활용': {
      adCategory: '조명',
      headline: '포근한 간접조명',
      sub: '무드등·스탠드',
      detail: '방 분위기를 포근하게 바꿔 주는 무드등·스탠드예요. 2개를 사면 10% 할인돼요.',
      benefitLabel: '2개 구매',
      benefitValue: '10%',
      benefitType: 'discount',
      imageSheet: 'interior',
      imagePosition: 'bottom-left',
      advertiser: '무드라이트',
      cta: '상품 보기',
    },
    '셀프 인테리어': {
      adCategory: '셀프 시공 공구',
      headline: '초보도 뚝딱 시공',
      sub: '시공 공구 세트',
      detail: '셀프 시공에 필요한 기본 공구를 한 번에 담았어요. 입문 세트는 배송비가 무료예요.',
      benefitLabel: '배송비',
      benefitValue: '무료',
      benefitType: 'free',
      imageSheet: 'alone',
      imagePosition: 'bottom-right',
      advertiser: '셀프시공소',
      cta: '상품 보기',
    },
  },

  자취: {
    '자취 꿀팁': {
      adCategory: '집안일 케어',
      headline: '집안일 덜어주기',
      sub: '청소 케어 세트',
      detail: '청소·정리에 필요한 케어 용품을 한 세트로 담았어요. 첫 구매는 15% 할인이에요.',
      benefitLabel: '첫 구매',
      benefitValue: '15%',
      benefitType: 'discount',
      imageSheet: 'life',
      imagePosition: 'top-left',
      advertiser: '집안일케어',
      cta: '상품 보기',
    },
    '초보 자취 가이드': {
      adCategory: '자취 시작 세트',
      headline: '첫 자취 필수템',
      sub: '필수템 세트',
      detail: '처음 자취할 때 필요한 기본 살림을 한 번에 담았어요. 세트로 사면 25% 할인돼요.',
      benefitLabel: '세트',
      benefitValue: '25%',
      benefitType: 'discount',
      imageSheet: 'alone',
      imagePosition: 'top-left',
      advertiser: '첫자취랩',
      cta: '세트 보기',
    },
    '혼자 사는 루틴': {
      adCategory: '빨래 구독',
      headline: '빨래는 맡기세요',
      sub: '요일별 수거 구독',
      detail: '요일을 정해 빨래를 수거하고 다시 가져다드려요. 첫 주는 무료로 이용해 볼 수 있어요.',
      benefitLabel: '첫 주',
      benefitValue: '무료',
      benefitType: 'trial',
      imageSheet: 'alone',
      imagePosition: 'top-right',
      advertiser: '빨래가방',
      cta: '구독하기',
    },
    '자취 실수 방지': {
      adCategory: '방범·안전',
      headline: '혼자여도 안심',
      sub: '도어 알림 센서',
      detail: '문이 열리면 알려 주는 간편 도어 센서예요. 설치비는 없어요.',
      benefitLabel: '설치비',
      benefitValue: '0원',
      benefitType: 'free',
      imageSheet: 'alone',
      imagePosition: 'bottom-left',
      advertiser: '혼자안심',
      cta: '상품 보기',
    },
    '자취 추천템': {
      adCategory: '공구',
      headline: '이거 하나면 끝',
      sub: '생활 공구 세트',
      detail: '자취방에서 자주 쓰는 30종 미니 공구를 담았어요. 배송비는 무료예요.',
      benefitLabel: '배송비',
      benefitValue: '무료',
      benefitType: 'free',
      imageSheet: 'alone',
      imagePosition: 'bottom-right',
      advertiser: '척척공구',
      cta: '상품 보기',
    },
    '자취 경험담': {
      adCategory: '추천 박스',
      headline: '선배가 담았어요',
      sub: '선배 추천 박스',
      detail: '자취 선배들이 꼽은 필수 살림을 상자에 담아 보내요. 첫 박스는 쿠폰을 드려요.',
      benefitLabel: '첫 박스',
      benefitValue: '쿠폰',
      benefitType: 'coupon',
      imageSheet: 'alone',
      imagePosition: 'top-left',
      advertiser: '선배노트',
      cta: '자세히 보기',
    },
  },
};

/** 맞춤 추천을 설정하지 않았을 때 쓰는 기본 광고 — 특정 관심사를 가정하지 않는 자취 공통 4가지.
 * 순서대로 쓰되 혜택 종류가 서로 달라, 이 순서 그대로 나열해도 인접 페이지가 겹치지 않는다. */
export const ADS_FALLBACK: readonly AdContent[] = [
  {
    adCategory: '자취 시작 세트',
    headline: '첫 자취 필수템',
    sub: '생필품 시작 세트',
    detail: '처음 자취할 때 필요한 생필품을 세트로 담았어요. 세트로 사면 25% 할인돼요.',
    benefitLabel: '세트',
    benefitValue: '25%',
    benefitType: 'discount',
    imageSheet: 'alone',
    imagePosition: 'top-left',
    advertiser: '첫자취랩',
    cta: '세트 보기',
  },
  {
    adCategory: '온라인 마트',
    headline: '신선식품 특가',
    sub: '오늘의 장바구니',
    detail: '신선식품 할인 쿠폰팩을 받아 보세요. 장 볼 때 바로 쓸 수 있어요.',
    benefitLabel: '신선식품',
    benefitValue: '쿠폰팩',
    benefitType: 'coupon',
    imageSheet: 'grocery',
    imagePosition: 'top-left',
    advertiser: '마켓한바구니',
    cta: '쿠폰 받기',
  },
  {
    adCategory: '생필품 정기배송',
    headline: '떨어지기 전에',
    sub: '생필품 정기배송',
    detail: '휴지·세제 같은 생필품을 정기 배송으로 받아 보세요. 첫 배송은 무료예요.',
    benefitLabel: '첫 배송',
    benefitValue: '무료',
    benefitType: 'free',
    imageSheet: 'life',
    imagePosition: 'bottom-left',
    advertiser: '채움생활',
    cta: '구독하기',
  },
  {
    adCategory: '방범·안전',
    headline: '혼자여도 안심',
    sub: '도어 알림 센서',
    detail: '문이 열리면 알려 주는 도어 센서예요. 30일 동안 체험해 볼 수 있어요.',
    benefitLabel: '30일',
    benefitValue: '체험',
    benefitType: 'trial',
    imageSheet: 'alone',
    imagePosition: 'bottom-left',
    advertiser: '혼자안심',
    cta: '상품 보기',
  },
];

/** Discovery 페이지 수 — 광고도 항상 이 개수만큼 고른다. */
export const AD_PAGE_COUNT = 4;

function isSameKind(a: AdContent, b: AdContent): boolean {
  return a.adCategory === b.adCategory || a.benefitType === b.benefitType;
}

function countRepeats(list: readonly AdContent[]): number {
  let repeats = 0;
  for (let i = 1; i < list.length; i += 1) if (isSameKind(list[i - 1], list[i])) repeats += 1;
  return repeats;
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]),
  );
}

/** 홈 Discovery 4개 페이지에 순서대로 보여줄 광고 4개를 고른다. 같은 설정이면 항상 같은 결과다.
 *
 *  - 선택한 주제가 4개 이상: 분야를 번갈아 가며(분야 순서 → 분야 안 정의 순서) 1개씩 4개.
 *  - 1~3개: ① 선택 주제 광고 → ② 선택한 분야마다 미선택 주제 광고 최대 1개 → ③ fallback.
 *  - 0개: fallback 4개.
 *  - 이미 뽑힌 광고와 광고 카테고리가 같은 후보는 넣지 않는다 → 같은 광고가 두 번 나오지 않는다.
 *  - fallback 은 이미 뽑힌 것과 혜택 종류가 다른 것을 먼저 고른다.
 *  - 순서: 선택 광고(①)는 나머지보다 앞에 두고, 선택 광고끼리 · 나머지끼리 각각 인접 페이지의
 *    광고 카테고리·혜택 종류가 겹치지 않는 배열로 바꾼다. 혜택 종류는 4가지뿐이라 선택 광고가
 *    같은 종류로 몰리면 피할 수 없다(최선). */
export function selectDiscoveryAds(topics: LivingProfilePreferences['topics']): AdContent[] {
  const picked: AdContent[] = [];
  const canAdd = (ad: AdContent) =>
    picked.length < AD_PAGE_COUNT && !picked.some((p) => p === ad || p.adCategory === ad.adCategory);
  const add = (ad: AdContent) => {
    if (canAdd(ad)) picked.push(ad);
  };

  const chosen = INTEREST_CATEGORIES.map((category) => ({
    category,
    topics: INTEREST_TOPICS[category].filter((topic) => (topics[category] ?? []).includes(topic)),
  })).filter((group) => group.topics.length > 0);
  const selectedCount = chosen.reduce((sum, group) => sum + group.topics.length, 0);

  if (selectedCount >= AD_PAGE_COUNT) {
    for (let round = 0; round < 6 && picked.length < AD_PAGE_COUNT; round += 1) {
      for (const group of chosen) {
        if (round < group.topics.length) add(ADS[group.category][group.topics[round]]);
      }
    }
  } else {
    for (const group of chosen) for (const topic of group.topics) add(ADS[group.category][topic]);
  }
  const fixedCount = picked.length;

  if (selectedCount < AD_PAGE_COUNT) {
    for (const group of chosen) {
      /* 선택 분야마다 미선택 주제 광고 1개 — 정의 순서 첫 번째이되, 이미 뽑힌 것과 혜택 종류가
       * 다른 후보가 있으면 그쪽을 먼저 쓴다. */
      const candidates = INTEREST_TOPICS[group.category]
        .filter((topic) => !group.topics.includes(topic))
        .map((topic) => ADS[group.category][topic])
        .filter(canAdd);
      const neighbor = candidates.find((ad) => !picked.some((p) => p.benefitType === ad.benefitType)) ?? candidates[0];
      if (neighbor) add(neighbor);
    }
    while (picked.length < AD_PAGE_COUNT) {
      const candidates = ADS_FALLBACK.filter(canAdd);
      const next =
        candidates.find((ad) => !picked.some((p) => p.benefitType === ad.benefitType)) ?? candidates[0];
      if (!next) break;
      add(next);
    }
  }

  /* 선택 광고끼리, 나머지끼리만 순서를 바꾼다 — 선택 광고는 항상 나머지보다 앞이다. 원래 순서가
   * 첫 후보라, 더 나은 배열이 없으면 그대로 남는다. */
  let best = picked;
  let bestRepeats = countRepeats(picked);
  for (const head of permutations(picked.slice(0, fixedCount))) {
    for (const tail of permutations(picked.slice(fixedCount))) {
      const order = [...head, ...tail];
      const repeats = countRepeats(order);
      if (repeats < bestRepeats) {
        best = order;
        bestRepeats = repeats;
      }
    }
  }
  return best;
}

/* 회귀 방지(개발 모드 전용) — data/recommendationTips.ts 의 findRecommendationTipMismatches 와
 * 같은 방식이다. 이 프로젝트에는 테스트 러너가 없어 모듈 로드 시 한 번만 대조한다:
 *   ① ADS 가 INTEREST_TOPICS 36개와 1:1 인지  ② 36개의 광고 카테고리가 서로 다른지
 *   ③ 카드에 들어가는 글자 수가 넘치지 않는지  ④ 대표 입력에서 선택 결과가 항상 4개·중복 없음인지 */
const MAX_LENGTH = { headline: 9, sub: 10, benefitLabel: 8, benefitValue: 8 } as const;

export function findAdMismatches(): string[] {
  const problems: string[] = [];
  const seenCategories = new Set<string>();
  (Object.keys(INTEREST_TOPICS) as InterestCategory[]).forEach((category) => {
    INTEREST_TOPICS[category].forEach((topic) => {
      const ad = ADS[category][topic];
      if (!ad) {
        problems.push(`missing: ${category}.${topic}`);
        return;
      }
      if (seenCategories.has(ad.adCategory)) problems.push(`duplicate adCategory: ${ad.adCategory}`);
      seenCategories.add(ad.adCategory);
      (Object.keys(MAX_LENGTH) as (keyof typeof MAX_LENGTH)[]).forEach((key) => {
        if ([...ad[key]].length > MAX_LENGTH[key]) problems.push(`too long ${key}: ${category}.${topic}`);
      });
    });
    Object.keys(ADS[category]).forEach((topic) => {
      if (!INTEREST_TOPICS[category].includes(topic)) problems.push(`extra: ${category}.${topic}`);
    });
  });

  const empty = { 생활: [], '돈 관리': [], 장보기: [], '이사·주거': [], 인테리어: [], 자취: [] } as Record<
    InterestCategory,
    string[]
  >;
  const samples: [string, Record<InterestCategory, string[]>][] = [
    ['none', empty],
    ['one', { ...empty, 장보기: ['소용량 식재료'] }],
    ['two-fields', { ...empty, 생활: ['세탁 관리'], 자취: ['자취 실수 방지'] }],
    ['one-field-all', { ...empty, 장보기: [...INTEREST_TOPICS['장보기']] }],
    ['everything', Object.fromEntries(INTEREST_CATEGORIES.map((c) => [c, [...INTEREST_TOPICS[c]]])) as Record<InterestCategory, string[]>],
  ];
  samples.forEach(([name, sample]) => {
    const ads = selectDiscoveryAds(sample);
    if (ads.length !== AD_PAGE_COUNT || new Set(ads).size !== ads.length) problems.push(`selection broken: ${name}`);
  });
  return problems;
}

if (import.meta.env.DEV) {
  const problems = findAdMismatches();
  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[adContents] 어긋난 항목 ${problems.length}건:`, problems);
  }
}

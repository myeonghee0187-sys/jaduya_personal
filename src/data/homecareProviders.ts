/** 공식 공개 정보의 확인일이다. 업체의 품질 인증이나 제휴를 의미하지 않는다. */
export const HOMECARE_PROVIDER_CHECKED_AT = '2026-09-21';

export type HomecareServiceCategory = 'mold-removal' | 'ventilation' | 'leak-inspection';

export type HomecareProviderSource = {
  readonly url: string;
  readonly title: string;
  readonly fields: readonly ('name' | 'serviceType' | 'description' | 'area' | 'address' | 'phone' | 'website' | 'mapUrl')[];
};

export type HomecareProvider = {
  readonly id: string;
  readonly category: HomecareServiceCategory;
  readonly name: string;
  readonly serviceType: string;
  readonly description?: string;
  readonly area?: string;
  readonly address?: string;
  readonly addressLabel?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly mapUrl?: string;
  readonly note?: string;
  readonly checkedAt: string;
  readonly sources: readonly HomecareProviderSource[];
};

/** 전화/주소는 각 업체가 공식 사이트에 공개한 사업 연락처만 사용한다.
 * 가격·평점·영업 상태·거리·미확인 출장 지역은 만들지 않는다.
 * 정렬은 등록 순서이며 추천 순위가 아니다. AI의 prototype 업체 데이터와 분리한다. */
export const HOMECARE_PROVIDERS: readonly HomecareProvider[] = [
  {
    id: 'moldmedical', category: 'mold-removal', name: '곰팡이메디칼',
    serviceType: '곰팡이 제거 · 결로·단열 시공',
    description: '곰팡이 제거와 결로·단열 시공, 방문진단을 안내해요.',
    area: '전국 시공', phone: '1544-5802', website: 'https://moldmedical.creatorlink.net/',
    checkedAt: HOMECARE_PROVIDER_CHECKED_AT,
    sources: [{ url: 'https://moldmedical.creatorlink.net/', title: '곰팡이메디칼 공식 홈페이지 · 시공 안내와 고객센터', fields: ['name', 'serviceType', 'description', 'area', 'phone', 'website'] }],
  },
  {
    id: 'primedm', category: 'mold-removal', name: '프라임디엠',
    serviceType: '곰팡이 제거 · 방지 도장',
    description: '곰팡이 제거와 방지 도장, 결로방지 단열공사를 안내해요.',
    phone: '070-7607-8685', website: 'https://primedm.co.kr/',
    // 지역 키워드 나열을 출장 보장 범위로 해석하지 않는다.
    checkedAt: HOMECARE_PROVIDER_CHECKED_AT,
    sources: [
      { url: 'https://primedm.co.kr/', title: '프라임디엠 공식 홈페이지 · 고객센터', fields: ['name', 'phone', 'website'] },
      { url: 'https://primedm.co.kr/a/', title: '프라임디엠 곰팡이 제거·결로방지 단열공사 안내', fields: ['serviceType', 'description'] },
    ],
  },
  {
    id: 'kohel', category: 'mold-removal', name: '코헬',
    serviceType: '곰팡이 시공 · 단열공사',
    description: '주거 공간의 곰팡이 시공과 결로·단열공사를 안내해요.',
    phone: '1566-8853', website: 'https://www.kohel.co.kr/',
    // 공식 메인/구 하위 페이지에 서로 다른 지사 주소가 남아 있어 주소·지도는 생략한다.
    checkedAt: HOMECARE_PROVIDER_CHECKED_AT,
    sources: [{ url: 'https://www.kohel.co.kr/', title: '코헬 공식 홈페이지 · 곰팡이시공/단열공사와 대표번호', fields: ['name', 'serviceType', 'description', 'phone', 'website'] }],
  },
  {
    id: 'himpel', category: 'ventilation', name: '힘펠',
    serviceType: '자사 욕실 환풍기 A/S',
    description: '힘펠 욕실 환풍기·휴젠뜨의 제품 이상 상담과 A/S를 접수해요.',
    phone: '1899-0991', website: 'https://himpel.com/kr',
    note: '힘펠 제품 대상이에요. 욕실 전체의 방습 시공과는 별도예요.',
    // 본사·공장 주소는 방문 수리센터 주소로 소개하지 않는다.
    checkedAt: HOMECARE_PROVIDER_CHECKED_AT,
    sources: [
      { url: 'https://himpel.com/kr', title: '힘펠 공식 홈페이지 · 욕실 환기가전과 고객센터', fields: ['name', 'serviceType', 'description', 'phone', 'website'] },
      { url: 'https://himpel.com/kr/asApplication?reqType=H', title: '힘펠 공식 A/S 신청 및 확인', fields: ['serviceType', 'description'] },
    ],
  },
  {
    id: 'haatz', category: 'ventilation', name: '하츠',
    serviceType: '자사 욕실 환풍기 A/S',
    description: '하츠 환풍기의 작동 불량·풍량 저하 등 제품 이상 상담과 A/S를 접수해요.',
    phone: '1644-0806', website: 'https://www.haatz.com/',
    note: '하츠 제품 대상이에요. 욕실 전체의 방습 시공과는 별도예요.',
    checkedAt: HOMECARE_PROVIDER_CHECKED_AT,
    sources: [
      { url: 'https://www.haatz.com/', title: '하츠 공식 홈페이지 · 고객지원과 A/S 연락처', fields: ['name', 'phone', 'website'] },
      { url: 'https://www.haatz.com/upload/manual/202601/1767658904_m0142591_20260106092144.pdf', title: '하츠 HBF-M701 환풍기 공식 사용설명서 · 고장 점검 및 A/S', fields: ['serviceType', 'description', 'phone'] },
    ],
  },
  {
    id: 'nusudajaba', category: 'leak-inspection', name: '누수다자바',
    serviceType: '누수 탐지 · 배관 보수',
    description: '주거 공간의 누수 원인을 점검하고 배관·방수 보수를 안내해요.',
    area: '서울·경기·인천', phone: '010-2709-9771', website: 'https://www.c2max.co.kr/',
    address: '경기도 오산시 죽담안로 33-7', addressLabel: '사업장',
    note: '결로 점검 가능 여부와 방문 접수는 상담할 때 확인해주세요.',
    checkedAt: HOMECARE_PROVIDER_CHECKED_AT,
    sources: [{ url: 'https://www.c2max.co.kr/', title: '누수다자바 공식 홈페이지 · 서비스, 수도권 안내, 씨투맥스 사업자 연락처', fields: ['name', 'serviceType', 'description', 'area', 'address', 'phone', 'website'] }],
  },
  {
    id: 'cleanns', category: 'leak-inspection', name: '클린앤누수',
    serviceType: '누수 탐지 · 방수·피해 복구',
    description: '천장·바닥·배관 누수를 탐지하고 방수와 피해 복구를 안내해요.',
    area: '수도권 및 전국 지점 운영 지역', phone: '1800-6954', website: 'https://cleanns.co.kr/',
    address: '서울 강남구 논현로 2길 60, 2층', addressLabel: '서울 본사',
    note: '결로 점검 가능 여부와 방문 접수는 상담할 때 확인해주세요.',
    checkedAt: HOMECARE_PROVIDER_CHECKED_AT,
    sources: [
      { url: 'https://cleanns.co.kr/', title: '클린앤누수 공식 홈페이지 · 전국 지점과 본사 연락처', fields: ['name', 'serviceType', 'area', 'address', 'phone', 'website'] },
      { url: 'https://cleanns.co.kr/leak/detection', title: '클린앤누수 공식 누수탐지 서비스 안내', fields: ['description'] },
    ],
  },
  {
    id: 'nusumaster', category: 'leak-inspection', name: '누수마스터',
    serviceType: '누수 점검 · 배관 수리',
    description: '급수관·보일러 배관·욕실·천장 누수를 점검하고 보수를 안내해요.',
    area: '서울·경기·인천', phone: '010-2980-5679', website: 'https://nusumaster.com/',
    address: '서울특별시 서초구 도구로 111, 1층', addressLabel: '사업장',
    note: '결로 점검 가능 여부와 방문 접수는 상담할 때 확인해주세요.',
    checkedAt: HOMECARE_PROVIDER_CHECKED_AT,
    sources: [{ url: 'https://nusumaster.com/', title: '누수마스터 공식 홈페이지 · 서비스 지역과 사업자 연락처', fields: ['name', 'serviceType', 'description', 'area', 'address', 'phone', 'website'] }],
  },
];

/** 버튼의 서비스 분야가 확인된 경우에만 같은 분야 업체를 연결한다. */
export function getHomecareProviders(category: HomecareServiceCategory | null): readonly HomecareProvider[] {
  return category ? HOMECARE_PROVIDERS.filter((provider) => provider.category === category) : [];
}

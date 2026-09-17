/** 로그인 계정별로 나뉘어야 하는 localStorage 데이터의 키를 만든다.
 * email 을 소문자로 정규화해서 대소문자 차이만으로 다른 계정처럼 갈라지지 않게 한다
 * (mockUsers.ts 의 MOCK_USERS 키와 같은 정규화 방식).
 * email 이 없으면(로그인 전 등 예외 상황) prefix 자체를 그대로 쓴다 — 계정별 Provider들이
 * 이미 로그인 이후에만 마운트되므로 정상 경로에서는 거의 일어나지 않는 방어용 분기다. */
export function accountKey(prefix: string, email: string | null | undefined): string {
  const normalized = email?.trim().toLowerCase();
  return normalized ? `${prefix}.${normalized}` : prefix;
}

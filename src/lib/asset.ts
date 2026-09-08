/* public/ 아래의 정적 에셋 경로를 만든다.
 *
 * 아이콘 경로가 카탈로그 데이터에서 문자열로 조립되기 때문에(정적 import 불가)
 * assets/ 는 public/ 에 두고 base 를 런타임에 붙인다.
 * import.meta.env.BASE_URL 은 Vercel 루트 배포 기준으로 '/'.
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

/** assets/icon/<name> 축약 */
export function icon(name: string): string {
  return asset(`assets/icon/${name}`);
}

/** assets/img/<name> 축약 */
export function img(name: string): string {
  return asset(`assets/img/${name}`);
}

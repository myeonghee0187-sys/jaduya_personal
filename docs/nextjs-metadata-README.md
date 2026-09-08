# Next.js App Router PWA 적용

1. ZIP의 `favicon` 폴더를 Next.js 프로젝트의 `public/favicon/`에 그대로 넣습니다.
2. `nextjs/metadata.ts`의 `manifest`와 `icons` 항목을 `app/layout.tsx`의 기존 `metadata`에 병합합니다.
3. 배포 뒤 `https://내도메인/favicon/site.webmanifest`가 열리는지 확인합니다.

192·512·maskable 아이콘과 `site.webmanifest`는 이 ZIP에 이미 포함되어 있습니다. 홈 화면 설치와 오프라인 동작까지 지원하려면 서비스 워커는 프로젝트 요구에 맞춰 별도로 구성하세요.

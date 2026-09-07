import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* GitHub Pages 프로젝트 페이지: https://phin0107.github.io/jaduya/
 * base 를 '/jaduya/' 로 두면 번들 및 public/ 에셋 경로가 모두 하위 경로로 생성된다. */
export default defineConfig({
  base: '/jaduya/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'build',
  },
});

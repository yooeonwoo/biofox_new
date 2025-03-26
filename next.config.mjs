/** @type {import('next').NextConfig} */
const config = {
  // 성능 최적화 설정
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true, // 더 빠른 Minification
  
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // 실험적 기능 활성화
  experimental: {
    // 더 빠른 서버 컴포넌트 스트리밍
    serverComponentsExternalPackages: [],
    // 병렬 라우트 최적화
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
    ],
    // 정적 페이지 캐싱 개선
    isrMemoryCacheSize: 0, // 0은 무제한
  },
  
  // 매니페스트 최적화 (PWA)
  productionBrowserSourceMaps: false,
  
  // Service Worker 설정
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default config; 
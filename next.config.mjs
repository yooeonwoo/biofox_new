/** @type {import('next').NextConfig} */
const config = {
  // 성능 최적화 설정
  poweredByHeader: false,
  reactStrictMode: true,
  // swcMinify: true, // 더 이상 사용되지 않음
  
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
    // serverExternalPackages도 더 이상 지원되지 않음
    // 병렬 라우트 최적화
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
    ],
    // isrMemoryCacheSize 옵션은 제거 (더 이상 지원되지 않음)
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
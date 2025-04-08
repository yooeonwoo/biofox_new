/** @type {import('next').NextConfig} */
const nextConfig = {
  // 성능 최적화 설정
  poweredByHeader: false,
  reactStrictMode: true,
  
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  
  // 실험적 기능 활성화
  experimental: {
    // 병렬 라우트 최적화
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
    ],
  },
  
  // 매니페스트 최적화 (PWA)
  productionBrowserSourceMaps: false,
  
  // Vercel 배포 시 타입스크립트 및 ESLint 오류 무시
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
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

module.exports = nextConfig;
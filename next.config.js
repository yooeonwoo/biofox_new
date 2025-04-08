/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! 경고 !!
    // 타입 검사를 건너뛰면 오류가 있을 수 있습니다.
    // 개발 중에는 타입 검사를 켜두는 것이 좋습니다.
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 과정에서 ESLint 검사를 건너뜁니다
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 
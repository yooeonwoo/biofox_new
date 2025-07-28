import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { storageId: string } }) {
  try {
    const { storageId } = params;

    // 프로덕션 환경 확인
    const isProduction =
      process.env.NODE_ENV === 'production' || request.headers.get('host')?.includes('vercel.app');

    // Convex site URL 설정
    const convexSiteUrl = isProduction
      ? 'https://aware-rook-16.convex.site'
      : process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site') ||
        'https://quiet-dog-358.convex.site';

    // Convex storage URL 생성
    const imageUrl = `${convexSiteUrl}/storage/${storageId}`;

    console.log('[Storage API] Proxying image:', {
      storageId,
      imageUrl,
      isProduction,
    });

    // Convex storage에서 이미지 가져오기
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error('[Storage API] Failed to fetch image:', {
        status: response.status,
        statusText: response.statusText,
      });
      return new NextResponse('Image not found', { status: 404 });
    }

    // 이미지 데이터와 헤더 전달
    const blob = await response.blob();
    const headers = new Headers();

    // Content-Type 설정
    const contentType = response.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 캐시 설정
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('[Storage API] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

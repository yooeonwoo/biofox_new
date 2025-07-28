/**
 * Convex HTTP 라우트 설정
 * Convex Auth 인증 라우트 포함
 */

import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { Id } from './_generated/dataModel';
import { auth } from './auth';

const http = httpRouter();

// Convex Auth HTTP 라우트 추가
auth.addHttpRoutes(http);

/**
 * Storage 파일을 제공하는 HTTP 엔드포인트
 * /api/storage/{storageId} 형태로 접근
 */
http.route({
  path: '/storage/:storageId',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const storageId = pathParts[pathParts.length - 1]; // 마지막 부분이 storageId

    console.log(`[HTTP /storage] Fetching file with ID: ${storageId}`);

    try {
      // Storage에서 파일 가져오기
      const blob = await ctx.storage.get(storageId as Id<'_storage'>);

      if (blob === null) {
        console.error(`[HTTP /storage] File not found: ${storageId}`);
        return new Response('File not found', {
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }

      console.log(`[HTTP /storage] File found, serving: ${storageId}`);

      // 파일 반환
      return new Response(blob, {
        headers: {
          // 기본 이미지 타입 설정 (실제로는 파일 메타데이터에서 가져와야 함)
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error(`[HTTP /storage] Error serving file:`, error);
      return new Response('Internal server error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  }),
});

export default http;

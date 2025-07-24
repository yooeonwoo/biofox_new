/**
 * Convex HTTP 라우트 설정
 * Convex Auth 인증 라우트 포함
 */

import { httpRouter } from 'convex/server';
import { auth } from './auth';

const http = httpRouter();

// Convex Auth HTTP 라우트 추가
auth.addHttpRoutes(http);

export default http;

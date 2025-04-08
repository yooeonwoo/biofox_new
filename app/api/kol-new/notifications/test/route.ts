import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: '알림 API 테스트 성공' });
} 
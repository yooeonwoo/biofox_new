import { NextRequest, NextResponse } from 'next/server';

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// OPTIONS 요청 처리
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 모든 메서드에 CORS 헤더 추가
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'CORS enabled' }, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'CORS enabled' }, { headers: corsHeaders });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ message: 'CORS enabled' }, { headers: corsHeaders });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ message: 'CORS enabled' }, { headers: corsHeaders });
}

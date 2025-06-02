import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('========== 테스트 웹훅 호출됨 ==========');
  console.log('시간:', new Date().toISOString());
  
  const body = await req.json();
  console.log('받은 데이터:', JSON.stringify(body, null, 2));
  
  return NextResponse.json({ 
    success: true, 
    message: 'Test webhook received',
    timestamp: new Date().toISOString(),
    data: body
  });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}
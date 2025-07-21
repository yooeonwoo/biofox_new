import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Starting connection test...');
    console.log('[TEST] Environment variables:');
    console.log('[TEST] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[TEST] NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('[TEST] NODE_ENV:', process.env.NODE_ENV);

    const cookieStore = await cookies();
    
    // 개발 환경에서는 서비스 키 사용 (RLS 우회)
    const isDev = process.env.NODE_ENV === 'development';
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      isDev 
        ? process.env.SUPABASE_SERVICE_ROLE_KEY!
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              console.log('[TEST] Cookie error (non-critical):', error);
            }
          },
        },
      }
    );

    console.log('[TEST] Supabase client created successfully');

    // 간단한 쿼리 테스트
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .limit(1);

    console.log('[TEST] Query executed');
    console.log('[TEST] Data:', data);
    console.log('[TEST] Error:', error);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Supabase query failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      data: data,
      rowCount: data?.length || 0
    });

  } catch (error: any) {
    console.error('[TEST] Exception:', error);
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 
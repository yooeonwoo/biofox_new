import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

// 화이트리스트 이메일 삭제
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId || sessionClaims?.role !== '본사관리자') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('whitelisted_emails')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('화이트리스트 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('화이트리스트 API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
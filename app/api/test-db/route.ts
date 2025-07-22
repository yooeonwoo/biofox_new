import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    console.log('Testing database connection...');

    // 기본 관계 데이터 테스트
    const { data: relationships, error: relError } = await supabase
      .from('shop_relationships')
      .select('*')
      .limit(5);

    if (relError) {
      console.error('Relationships query error:', relError);
      return NextResponse.json(
        {
          error: 'Relationships query failed',
          details: relError,
        },
        { status: 500 }
      );
    }

    console.log('Relationships data:', relationships);

    // 기본 profiles 데이터 테스트
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profileError) {
      console.error('Profiles query error:', profileError);
      return NextResponse.json(
        {
          error: 'Profiles query failed',
          details: profileError,
        },
        { status: 500 }
      );
    }

    console.log('Profiles data:', profiles);

    // JOIN 테스트
    const { data: joinedData, error: joinError } = await supabase
      .from('shop_relationships')
      .select(
        `
        id,
        is_active,
        shop_owner:profiles!shop_owner_id(
          id,
          name,
          shop_name
        ),
        parent:profiles!parent_id(
          id,
          name,
          shop_name
        )
      `
      )
      .limit(3);

    if (joinError) {
      console.error('Joined query error:', joinError);
      return NextResponse.json(
        {
          error: 'Joined query failed',
          details: joinError,
        },
        { status: 500 }
      );
    }

    console.log('Joined data:', joinedData);

    return NextResponse.json({
      success: true,
      data: {
        relationships,
        profiles,
        joinedData,
      },
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error,
      },
      { status: 500 }
    );
  }
}

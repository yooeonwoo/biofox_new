import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 체크
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { kol_id, additional_devices } = body

    // 현재 KOL 누적 정보 조회
    const { data: accumulator } = await supabase
      .from('kol_device_accumulator')
      .select('*')
      .eq('kol_id', kol_id)
      .single()

    const currentNetDevices = accumulator?.net_devices_sold || 0
    const currentTier = accumulator?.current_tier || 'tier_1_4'
    const currentCommissionPerDevice = currentTier === 'tier_5_plus' ? 2500000 : 1500000

    // 시뮬레이션
    const newNetDevices = currentNetDevices + additional_devices
    const newTier = newNetDevices >= 5 ? 'tier_5_plus' : 'tier_1_4'
    const newCommissionPerDevice = newTier === 'tier_5_plus' ? 2500000 : 1500000
    const tierChanged = currentTier !== newTier

    // 수수료 차이 계산
    const commissionDifference = (newCommissionPerDevice - currentCommissionPerDevice) * Math.abs(additional_devices)

    return NextResponse.json({
      current_state: {
        total_devices: currentNetDevices,
        current_tier: currentTier,
        commission_per_device: currentCommissionPerDevice
      },
      new_state: {
        total_devices: newNetDevices,
        new_tier: newTier,
        commission_per_device: newCommissionPerDevice,
        tier_changed: tierChanged
      },
      commission_difference: commissionDifference
    })

  } catch (error) {
    console.error('Tier simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to simulate tier change' },
      { status: 500 }
    )
  }
}
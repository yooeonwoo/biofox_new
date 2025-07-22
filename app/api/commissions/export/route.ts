import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
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

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM
    const format = searchParams.get('format') || 'csv'
    const include_details = searchParams.get('include_details') === 'true'

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 })
    }

    // 수수료 계산 조회
    const { data: commissions } = await supabase
      .from('commission_calculations')
      .select(`
        *,
        kol:profiles!kol_id (
          id,
          name,
          role,
          shop_name,
          email,
          bank_info
        )
      `)
      .eq('calculation_month', month)
      .order('total_commission', { ascending: false })

    if (format === 'csv') {
      const headers = [
        '정산월',
        'KOL/OL',
        '역할',
        '이메일',
        '소속샵 수수료',
        '본인샵 수수료',
        '기기 수수료',
        '조정금액',
        '총 수수료',
        '상태',
        '은행명',
        '계좌번호',
        '예금주'
      ]

      const rows = (commissions || []).map((c: any) => {
        const bankInfo = c.kol.bank_info || {}
        const adjustmentTotal = (c.adjustments || []).reduce((sum: number, adj: any) => sum + adj.amount, 0)
        
        return [
          c.calculation_month,
          c.kol.name,
          c.kol.role.toUpperCase(),
          c.kol.email,
          c.subordinate_shop_commission || 0,
          c.self_shop_commission || 0,
          c.device_commission || 0,
          adjustmentTotal,
          c.total_commission || 0,
          c.status === 'paid' ? '지급완료' : c.status === 'adjusted' ? '조정됨' : '계산완료',
          bankInfo.bank_name || '',
          bankInfo.account_number || '',
          bankInfo.account_holder || ''
        ]
      })

      // CSV 문자열 생성
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.map((cell: any) => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(','))
      ].join('\n')

      // BOM 추가 (한글 엑셀 호환)
      const bom = '\uFEFF'
      const csvWithBom = bom + csvContent

      return new NextResponse(csvWithBom, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="commission_${month}.csv"`
        }
      })
    }

    // JSON 형식
    return NextResponse.json({ data: commissions })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export commissions' },
      { status: 500 }
    )
  }
}
import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    // 기기 판매 데이터 조회
    let query = supabase
      .from('device_sales')
      .select(`
        *,
        shop:profiles!shop_id (
          name,
          shop_name,
          email,
          region
        )
      `)
      .order('sale_date', { ascending: false })

    if (date_from) {
      query = query.gte('sale_date', date_from)
    }
    if (date_to) {
      query = query.lte('sale_date', date_to)
    }

    const { data: sales, error } = await query

    if (error) throw error

    // KOL 정보 추가
    const salesWithKol = await Promise.all((sales || []).map(async (sale) => {
      const { data: relationship } = await supabase
        .from('shop_relationships')
        .select(`
          parent:profiles!parent_id (
            name,
            role
          )
        `)
        .eq('shop_owner_id', sale.shop_id)
        .eq('is_active', true)
        .single()

      return {
        ...sale,
        kol: relationship?.parent || null
      }
    }))

    // CSV 포맷으로 변환
    if (format === 'csv') {
      const headers = [
        '판매일',
        '샵명',
        '원장님',
        '이메일',
        '지역',
        'KOL/OL',
        'KOL역할',
        '기기명',
        '수량',
        '티어',
        '대당수수료',
        '총수수료',
        '시리얼번호',
        '비고'
      ]

      const rows = salesWithKol.map(sale => [
        sale.sale_date,
        sale.shop?.shop_name || '',
        sale.shop?.name || '',
        sale.shop?.email || '',
        sale.shop?.region || '',
        sale.kol?.name || '',
        sale.kol?.role?.toUpperCase() || '',
        sale.device_name || '',
        sale.quantity || 0,
        sale.tier_at_sale === 'tier_5_plus' ? '5대 이상' : '1-4대',
        sale.quantity !== 0 ? sale.standard_commission / Math.abs(sale.quantity) : 0,
        sale.actual_commission || 0,
        sale.serial_numbers?.join(', ') || '',
        sale.notes || ''
      ])

      // CSV 문자열 생성
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
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
          'Content-Disposition': `attachment; filename="device_sales_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // JSON 형식
    return NextResponse.json({ data: salesWithKol })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export device sales' },
      { status: 500 }
    )
  }
}
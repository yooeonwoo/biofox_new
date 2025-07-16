import { NextRequest, NextResponse } from 'next/server';
import { xanoDb, ApiResponse, Order, OrderItem } from '@/lib/xano-db';

/**
 * GET /api/xano/orders - 주문 목록 조회
 * 쿼리 파라미터:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지 크기 (기본값: 10)
 * - shop_id: 전문점 ID 필터
 * - commission_status: 수수료 상태 필터
 * - start_date: 시작일 필터
 * - end_date: 종료일 필터
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const shopId = searchParams.get('shop_id');
    const commissionStatus = searchParams.get('commission_status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const offset = (page - 1) * limit;

    // 기본 쿼리와 WHERE 조건 구성
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (shopId) {
      whereConditions.push(`shop_id = $${paramIndex}`);
      queryParams.push(parseInt(shopId));
      paramIndex++;
    }

    if (commissionStatus) {
      whereConditions.push(`commission_status = $${paramIndex}`);
      queryParams.push(commissionStatus);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`order_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`order_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders
      ${whereClause}
    `;

    const countResult = await xanoDb.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // 주문 목록 조회 (주문 아이템 포함)
    const ordersQuery = `
      SELECT 
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_name', oi.product_name,
              'product_code', oi.product_code,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          ) FILTER (WHERE oi.id IS NOT NULL), 
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const ordersResult = await xanoDb.query(ordersQuery, queryParams);

    return NextResponse.json(
      ApiResponse.paginated(ordersResult.rows, totalCount, page, limit)
    );

  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('주문 목록 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * POST /api/xano/orders - 새 주문 생성
 * 요청 본문:
 * {
 *   shop_id: number,
 *   order_date: string,
 *   total_amount: number,
 *   commission_rate: number,
 *   commission_amount: number,
 *   commission_status: string,
 *   is_self_shop_order: boolean,
 *   created_by?: number,
 *   items: Array<{
 *     product_name: string,
 *     product_code?: string,
 *     quantity: number,
 *     unit_price: number,
 *     subtotal: number
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shop_id,
      order_date,
      total_amount,
      commission_rate,
      commission_amount,
      commission_status = 'pending',
      is_self_shop_order = false,
      created_by,
      items = []
    } = body;

    // 필수 필드 검증
    if (!shop_id || !order_date || !total_amount) {
      return NextResponse.json(
        ApiResponse.error('필수 필드가 누락되었습니다. (shop_id, order_date, total_amount)', 400),
        { status: 400 }
      );
    }

    // 트랜잭션으로 주문과 주문 아이템 생성
    const result = await xanoDb.transaction(async (client) => {
      // 주문 생성
      const orderQuery = `
        INSERT INTO orders (
          shop_id, order_date, total_amount, commission_rate, 
          commission_amount, commission_status, is_self_shop_order, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const orderResult = await client.query(orderQuery, [
        shop_id,
        order_date,
        total_amount,
        commission_rate || 0,
        commission_amount || 0,
        commission_status,
        is_self_shop_order,
        created_by
      ]);

      const order = orderResult.rows[0];

      // 주문 아이템 생성
      const orderItems = [];
      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (
            order_id, product_name, product_code, quantity, unit_price, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const itemResult = await client.query(itemQuery, [
          order.id,
          item.product_name,
          item.product_code,
          item.quantity,
          item.unit_price,
          item.subtotal
        ]);

        orderItems.push(itemResult.rows[0]);
      }

      return {
        ...order,
        items: orderItems
      };
    });

    return NextResponse.json(
      ApiResponse.success(result, '주문이 성공적으로 생성되었습니다.'),
      { status: 201 }
    );

  } catch (error) {
    console.error('주문 생성 오류:', error);
    return NextResponse.json(
      ApiResponse.error('주문 생성 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/xano/orders - 주문 수정
 * 요청 본문에 주문 ID와 수정할 필드들을 포함
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('주문 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 동적 UPDATE 쿼리 생성
    const updateKeys = Object.keys(updateFields).filter(key => key !== 'items');
    if (updateKeys.length === 0) {
      return NextResponse.json(
        ApiResponse.error('수정할 필드가 없습니다.', 400),
        { status: 400 }
      );
    }

    const setClause = updateKeys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...updateKeys.map(key => updateFields[key])];

    const updateQuery = `
      UPDATE orders 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await xanoDb.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('주문을 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success(result.rows[0], '주문이 성공적으로 수정되었습니다.')
    );

  } catch (error) {
    console.error('주문 수정 오류:', error);
    return NextResponse.json(
      ApiResponse.error('주문 수정 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/xano/orders - 주문 삭제
 * 쿼리 파라미터: id (주문 ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('주문 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 트랜잭션으로 주문 아이템과 주문 삭제
    const result = await xanoDb.transaction(async (client) => {
      // 주문 아이템 삭제
      await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

      // 주문 삭제
      const deleteResult = await client.query(
        'DELETE FROM orders WHERE id = $1 RETURNING *',
        [id]
      );

      return deleteResult.rows[0];
    });

    if (!result) {
      return NextResponse.json(
        ApiResponse.error('주문을 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success(result, '주문이 성공적으로 삭제되었습니다.')
    );

  } catch (error) {
    console.error('주문 삭제 오류:', error);
    return NextResponse.json(
      ApiResponse.error('주문 삭제 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
} 
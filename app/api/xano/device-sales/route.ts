import { NextRequest, NextResponse } from 'next/server';
import { xanoDb, ApiResponse, DeviceSale } from '@/lib/xano-db';

/**
 * GET /api/xano/device-sales - 기기 판매 목록 조회
 * 쿼리 파라미터:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지 크기 (기본값: 10)
 * - kol_id: KOL ID 필터
 * - tier: 티어 필터 (tier_1_4, tier_5_plus)
 * - start_date: 시작일 필터
 * - end_date: 종료일 필터
 * - device_model: 기기 모델 필터
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const kolId = searchParams.get('kol_id');
    const tier = searchParams.get('tier');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const deviceModel = searchParams.get('device_model');

    const offset = (page - 1) * limit;

    // WHERE 조건 구성
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (kolId) {
      whereConditions.push(`kol_id = $${paramIndex}`);
      queryParams.push(parseInt(kolId));
      paramIndex++;
    }

    if (tier) {
      whereConditions.push(`tier = $${paramIndex}`);
      queryParams.push(tier);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`sale_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`sale_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    if (deviceModel) {
      whereConditions.push(`device_model ILIKE $${paramIndex}`);
      queryParams.push(`%${deviceModel}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM device_sales
      ${whereClause}
    `;

    const countResult = await xanoDb.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // 기기 판매 목록 조회
    const salesQuery = `
      SELECT 
        ds.*,
        (SELECT COUNT(*) FROM unnest(ds.serial_numbers)) as device_count
      FROM device_sales ds
      ${whereClause}
      ORDER BY ds.sale_date DESC, ds.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const salesResult = await xanoDb.query(salesQuery, queryParams);

    // 요약 통계 추가
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(standard_commission) as total_standard_commission,
        SUM(actual_commission) as total_actual_commission,
        SUM(array_length(serial_numbers, 1)) as total_devices
      FROM device_sales
      ${whereClause}
    `;

    const statsResult = await xanoDb.query(statsQuery, queryParams.slice(0, -2));

    return NextResponse.json(
      ApiResponse.paginated(salesResult.rows, totalCount, page, limit, {
        stats: statsResult.rows[0]
      })
    );

  } catch (error) {
    console.error('기기 판매 목록 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('기기 판매 목록 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * POST /api/xano/device-sales - 새 기기 판매 등록
 * 요청 본문:
 * {
 *   kol_id: number,
 *   device_model: string,
 *   sale_date: string,
 *   serial_numbers: string[],
 *   standard_commission?: number,
 *   actual_commission?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      kol_id,
      device_model,
      sale_date,
      serial_numbers,
      standard_commission,
      actual_commission
    } = body;

    // 필수 필드 검증
    if (!kol_id || !device_model || !sale_date || !serial_numbers || !Array.isArray(serial_numbers) || serial_numbers.length === 0) {
      return NextResponse.json(
        ApiResponse.error('필수 필드가 누락되었습니다. (kol_id, device_model, sale_date, serial_numbers)', 400),
        { status: 400 }
      );
    }

    // 트랜잭션으로 기기 판매 등록 및 누적 데이터 업데이트
    const result = await xanoDb.transaction(async (client) => {
      // 1. 현재 KOL 누적 데이터 조회
      const accumulatorQuery = `
        SELECT * FROM kol_device_accumulator WHERE kol_id = $1
      `;
      const accumulatorResult = await client.query(accumulatorQuery, [kol_id]);
      
      let currentAccumulator = accumulatorResult.rows[0];
      const deviceCount = serial_numbers.length;
      const newTotalSold = (currentAccumulator?.total_devices_sold || 0) + deviceCount;
      
      // 2. 티어 결정 (5대 이상이면 tier_5_plus, 미만이면 tier_1_4)
      const tier = newTotalSold >= 5 ? 'tier_5_plus' : 'tier_1_4';
      
      // 3. 수수료 계산 (기본값 설정)
      const calculatedStandardCommission = standard_commission || (tier === 'tier_5_plus' ? 600000 : 500000);
      const calculatedActualCommission = actual_commission || calculatedStandardCommission;
      
      // 4. 기기 판매 기록 생성
      const salesQuery = `
        INSERT INTO device_sales (
          kol_id, device_model, sale_date, tier, 
          standard_commission, actual_commission, serial_numbers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const salesResult = await client.query(salesQuery, [
        kol_id,
        device_model,
        sale_date,
        tier,
        calculatedStandardCommission,
        calculatedActualCommission,
        serial_numbers
      ]);

      // 5. KOL 누적 데이터 업데이트
      if (currentAccumulator) {
        const updateAccumulatorQuery = `
          UPDATE kol_device_accumulator 
          SET 
            total_devices_sold = total_devices_sold + $1,
            net_devices_sold = total_devices_sold - total_devices_returned,
            current_tier = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE kol_id = $3
          RETURNING *
        `;

        const updateResult = await client.query(updateAccumulatorQuery, [
          deviceCount,
          tier,
          kol_id
        ]);

        return {
          sale: salesResult.rows[0],
          accumulator: updateResult.rows[0]
        };
      } else {
        const insertAccumulatorQuery = `
          INSERT INTO kol_device_accumulator (
            kol_id, total_devices_sold, total_devices_returned, 
            net_devices_sold, current_tier
          ) VALUES ($1, $2, 0, $2, $3)
          RETURNING *
        `;

        const insertResult = await client.query(insertAccumulatorQuery, [
          kol_id,
          deviceCount,
          tier
        ]);

        return {
          sale: salesResult.rows[0],
          accumulator: insertResult.rows[0]
        };
      }
    });

    return NextResponse.json(
      ApiResponse.success(result, '기기 판매가 성공적으로 등록되었습니다.'),
      { status: 201 }
    );

  } catch (error) {
    console.error('기기 판매 등록 오류:', error);
    return NextResponse.json(
      ApiResponse.error('기기 판매 등록 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/xano/device-sales - 기기 판매 수정
 * 요청 본문에 판매 ID와 수정할 필드들을 포함
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('판매 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 현재 판매 기록 조회
    const currentSaleQuery = `
      SELECT * FROM device_sales WHERE id = $1
    `;
    const currentSaleResult = await xanoDb.query(currentSaleQuery, [id]);

    if (currentSaleResult.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('판매 기록을 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    const currentSale = currentSaleResult.rows[0];

    // 동적 UPDATE 쿼리 생성
    const updateKeys = Object.keys(updateFields);
    if (updateKeys.length === 0) {
      return NextResponse.json(
        ApiResponse.error('수정할 필드가 없습니다.', 400),
        { status: 400 }
      );
    }

    const setClause = updateKeys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...updateKeys.map(key => updateFields[key])];

    const updateQuery = `
      UPDATE device_sales 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await xanoDb.query(updateQuery, values);

    // 시리얼 번호가 변경된 경우 누적 데이터 재계산
    if (updateFields.serial_numbers && Array.isArray(updateFields.serial_numbers)) {
      const oldCount = currentSale.serial_numbers.length;
      const newCount = updateFields.serial_numbers.length;
      const countDiff = newCount - oldCount;

      if (countDiff !== 0) {
        await xanoDb.query(`
          UPDATE kol_device_accumulator 
          SET 
            total_devices_sold = total_devices_sold + $1,
            net_devices_sold = total_devices_sold - total_devices_returned,
            updated_at = CURRENT_TIMESTAMP
          WHERE kol_id = $2
        `, [countDiff, currentSale.kol_id]);
      }
    }

    return NextResponse.json(
      ApiResponse.success(result.rows[0], '기기 판매가 성공적으로 수정되었습니다.')
    );

  } catch (error) {
    console.error('기기 판매 수정 오류:', error);
    return NextResponse.json(
      ApiResponse.error('기기 판매 수정 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/xano/device-sales - 기기 판매 삭제
 * 쿼리 파라미터: id (판매 ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('판매 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 트랜잭션으로 판매 삭제 및 누적 데이터 업데이트
    const result = await xanoDb.transaction(async (client) => {
      // 현재 판매 기록 조회
      const currentSaleQuery = `
        SELECT * FROM device_sales WHERE id = $1
      `;
      const currentSaleResult = await client.query(currentSaleQuery, [id]);

      if (currentSaleResult.rows.length === 0) {
        return null;
      }

      const currentSale = currentSaleResult.rows[0];
      const deviceCount = currentSale.serial_numbers.length;

      // 판매 기록 삭제
      const deleteResult = await client.query(
        'DELETE FROM device_sales WHERE id = $1 RETURNING *',
        [id]
      );

      // 누적 데이터 업데이트 (판매 수량 차감)
      await client.query(`
        UPDATE kol_device_accumulator 
        SET 
          total_devices_sold = GREATEST(0, total_devices_sold - $1),
          net_devices_sold = GREATEST(0, total_devices_sold - total_devices_returned),
          updated_at = CURRENT_TIMESTAMP
        WHERE kol_id = $2
      `, [deviceCount, currentSale.kol_id]);

      return deleteResult.rows[0];
    });

    if (!result) {
      return NextResponse.json(
        ApiResponse.error('판매 기록을 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success(result, '기기 판매가 성공적으로 삭제되었습니다.')
    );

  } catch (error) {
    console.error('기기 판매 삭제 오류:', error);
    return NextResponse.json(
      ApiResponse.error('기기 판매 삭제 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * GET /api/xano/device-sales/stats - 기기 판매 통계
 * 쿼리 파라미터:
 * - kol_id: KOL ID 필터
 * - start_date: 시작일 필터
 * - end_date: 종료일 필터
 */
export async function GET_STATS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kolId = searchParams.get('kol_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // WHERE 조건 구성
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (kolId) {
      whereConditions.push(`kol_id = $${paramIndex}`);
      queryParams.push(parseInt(kolId));
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`sale_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`sale_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 통계 쿼리
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(standard_commission) as total_standard_commission,
        SUM(actual_commission) as total_actual_commission,
        SUM(array_length(serial_numbers, 1)) as total_devices,
        COUNT(CASE WHEN tier = 'tier_1_4' THEN 1 END) as tier_1_4_sales,
        COUNT(CASE WHEN tier = 'tier_5_plus' THEN 1 END) as tier_5_plus_sales,
        AVG(standard_commission) as avg_standard_commission,
        AVG(actual_commission) as avg_actual_commission
      FROM device_sales
      ${whereClause}
    `;

    const statsResult = await xanoDb.query(statsQuery, queryParams);

    return NextResponse.json(
      ApiResponse.success(statsResult.rows[0], '기기 판매 통계 조회 성공')
    );

  } catch (error) {
    console.error('기기 판매 통계 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('기기 판매 통계 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
} 
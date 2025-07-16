import { NextRequest, NextResponse } from 'next/server';
import { xanoDb, ApiResponse, ClinicalCase, ClinicalSession } from '@/lib/xano-db';

/**
 * GET /api/xano/clinical-management - 임상 케이스 목록 조회
 * 쿼리 파라미터:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지 크기 (기본값: 10)
 * - kol_id: KOL ID 필터
 * - shop_id: 전문점 ID 필터
 * - status: 케이스 상태 필터 (active, completed, cancelled, on_hold)
 * - subject_type: 대상자 유형 필터 (customer, personal, model)
 * - consent_status: 동의서 상태 필터 (pending, approved, rejected)
 * - treatment_type: 치료 유형 필터
 * - start_date: 시작일 필터
 * - end_date: 종료일 필터
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const kolId = searchParams.get('kol_id');
    const shopId = searchParams.get('shop_id');
    const status = searchParams.get('status');
    const subjectType = searchParams.get('subject_type');
    const consentStatus = searchParams.get('consent_status');
    const treatmentType = searchParams.get('treatment_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

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

    if (shopId) {
      whereConditions.push(`shop_id = $${paramIndex}`);
      queryParams.push(parseInt(shopId));
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (subjectType) {
      whereConditions.push(`subject_type = $${paramIndex}`);
      queryParams.push(subjectType);
      paramIndex++;
    }

    if (consentStatus) {
      whereConditions.push(`consent_status = $${paramIndex}`);
      queryParams.push(consentStatus);
      paramIndex++;
    }

    if (treatmentType) {
      whereConditions.push(`treatment_type ILIKE $${paramIndex}`);
      queryParams.push(`%${treatmentType}%`);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`start_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`start_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM clinical_cases
      ${whereClause}
    `;

    const countResult = await xanoDb.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // 임상 케이스 목록 조회 (최신 세션 정보 포함)
    const casesQuery = `
      SELECT 
        cc.*,
        COALESCE(
          (SELECT COUNT(*) FROM clinical_sessions cs WHERE cs.case_id = cc.id),
          0
        ) as session_count,
        COALESCE(
          (SELECT 
            json_build_object(
              'session_number', cs.session_number,
              'session_date', cs.session_date,
              'session_type', cs.session_type,
              'next_session_date', cs.next_session_date
            )
           FROM clinical_sessions cs 
           WHERE cs.case_id = cc.id 
           ORDER BY cs.session_number DESC 
           LIMIT 1
          ),
          null
        ) as latest_session,
        CASE 
          WHEN cc.status = 'completed' THEN 100
          WHEN cc.status = 'cancelled' THEN 0
          WHEN cc.end_date IS NOT NULL THEN 
            CASE 
              WHEN cc.end_date < CURRENT_DATE THEN 100
              ELSE ROUND(
                (EXTRACT(EPOCH FROM (CURRENT_DATE - cc.start_date)) / 
                 EXTRACT(EPOCH FROM (cc.end_date - cc.start_date))) * 100
              )
            END
          ELSE 
            ROUND(
              (EXTRACT(EPOCH FROM (CURRENT_DATE - cc.start_date)) / 
               EXTRACT(EPOCH FROM (cc.estimated_duration_weeks * 7 * INTERVAL '1 day'))) * 100
            )
        END as progress_percentage
      FROM clinical_cases cc
      ${whereClause}
      ORDER BY cc.start_date DESC, cc.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const casesResult = await xanoDb.query(casesQuery, queryParams);

    // 통계 정보 조회
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cases,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_cases,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_cases,
        COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_cases,
        COUNT(CASE WHEN consent_status = 'approved' THEN 1 END) as approved_consent,
        COUNT(CASE WHEN consent_status = 'pending' THEN 1 END) as pending_consent,
        COUNT(CASE WHEN consent_status = 'rejected' THEN 1 END) as rejected_consent,
        COUNT(CASE WHEN subject_type = 'customer' THEN 1 END) as customer_cases,
        COUNT(CASE WHEN subject_type = 'personal' THEN 1 END) as personal_cases,
        COUNT(CASE WHEN subject_type = 'model' THEN 1 END) as model_cases,
        AVG(estimated_duration_weeks) as avg_duration_weeks
      FROM clinical_cases
      ${whereClause}
    `;

    const statsResult = await xanoDb.query(statsQuery, queryParams.slice(0, -2));

    return NextResponse.json(
      ApiResponse.paginated(casesResult.rows, totalCount, page, limit, {
        stats: statsResult.rows[0]
      })
    );

  } catch (error) {
    console.error('임상 케이스 목록 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('임상 케이스 목록 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * POST /api/xano/clinical-management - 새 임상 케이스 생성
 * 요청 본문:
 * {
 *   kol_id: number,
 *   shop_id: number,
 *   subject_type: 'customer' | 'personal' | 'model',
 *   subject_name: string,
 *   subject_age?: number,
 *   subject_gender?: 'male' | 'female' | 'other',
 *   subject_phone?: string,
 *   subject_email?: string,
 *   start_date: string,
 *   end_date?: string,
 *   estimated_duration_weeks?: number,
 *   treatment_type?: string,
 *   treatment_area?: string,
 *   notes?: string,
 *   consent_status?: 'pending' | 'approved' | 'rejected'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      kol_id,
      shop_id,
      subject_type,
      subject_name,
      subject_age,
      subject_gender,
      subject_phone,
      subject_email,
      start_date,
      end_date,
      estimated_duration_weeks = 4,
      treatment_type,
      treatment_area,
      notes,
      consent_status = 'pending'
    } = body;

    // 필수 필드 검증
    if (!kol_id || !shop_id || !subject_type || !subject_name || !start_date) {
      return NextResponse.json(
        ApiResponse.error('필수 필드가 누락되었습니다. (kol_id, shop_id, subject_type, subject_name, start_date)', 400),
        { status: 400 }
      );
    }

    // 유효성 검사
    const validSubjectTypes = ['customer', 'personal', 'model'];
    if (!validSubjectTypes.includes(subject_type)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 대상자 유형입니다.', 400),
        { status: 400 }
      );
    }

    const validConsentStatuses = ['pending', 'approved', 'rejected'];
    if (!validConsentStatuses.includes(consent_status)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 동의서 상태입니다.', 400),
        { status: 400 }
      );
    }

    if (subject_age && (subject_age < 1 || subject_age > 120)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 나이입니다.', 400),
        { status: 400 }
      );
    }

    if (estimated_duration_weeks && (estimated_duration_weeks < 1 || estimated_duration_weeks > 52)) {
      return NextResponse.json(
        ApiResponse.error('예상 기간은 1-52주 사이여야 합니다.', 400),
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO clinical_cases (
        kol_id, shop_id, subject_type, subject_name, subject_age, subject_gender,
        subject_phone, subject_email, start_date, end_date, estimated_duration_weeks,
        treatment_type, treatment_area, notes, consent_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING *
    `;

    const result = await xanoDb.query(insertQuery, [
      kol_id,
      shop_id,
      subject_type,
      subject_name,
      subject_age,
      subject_gender,
      subject_phone,
      subject_email,
      start_date,
      end_date,
      estimated_duration_weeks,
      treatment_type,
      treatment_area,
      notes,
      consent_status
    ]);

    return NextResponse.json(
      ApiResponse.success(result.rows[0], '임상 케이스가 성공적으로 생성되었습니다.'),
      { status: 201 }
    );

  } catch (error) {
    console.error('임상 케이스 생성 오류:', error);
    return NextResponse.json(
      ApiResponse.error('임상 케이스 생성 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/xano/clinical-management - 임상 케이스 수정
 * 요청 본문에 케이스 ID와 수정할 필드들을 포함
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('임상 케이스 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 현재 케이스 조회
    const currentCaseQuery = `
      SELECT * FROM clinical_cases WHERE id = $1
    `;
    const currentCaseResult = await xanoDb.query(currentCaseQuery, [id]);

    if (currentCaseResult.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('임상 케이스를 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    // 유효성 검사
    if (updateFields.subject_type && !['customer', 'personal', 'model'].includes(updateFields.subject_type)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 대상자 유형입니다.', 400),
        { status: 400 }
      );
    }

    if (updateFields.status && !['active', 'completed', 'cancelled', 'on_hold'].includes(updateFields.status)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 케이스 상태입니다.', 400),
        { status: 400 }
      );
    }

    if (updateFields.consent_status && !['pending', 'approved', 'rejected'].includes(updateFields.consent_status)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 동의서 상태입니다.', 400),
        { status: 400 }
      );
    }

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
      UPDATE clinical_cases 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await xanoDb.query(updateQuery, values);

    return NextResponse.json(
      ApiResponse.success(result.rows[0], '임상 케이스가 성공적으로 수정되었습니다.')
    );

  } catch (error) {
    console.error('임상 케이스 수정 오류:', error);
    return NextResponse.json(
      ApiResponse.error('임상 케이스 수정 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/xano/clinical-management - 임상 케이스 삭제
 * 쿼리 파라미터: id (케이스 ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('임상 케이스 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 트랜잭션으로 케이스와 관련 세션 삭제
    const result = await xanoDb.transaction(async (client) => {
      // 관련 세션 삭제
      await client.query('DELETE FROM clinical_sessions WHERE case_id = $1', [id]);

      // 케이스 삭제
      const deleteResult = await client.query(
        'DELETE FROM clinical_cases WHERE id = $1 RETURNING *',
        [id]
      );

      return deleteResult.rows[0];
    });

    if (!result) {
      return NextResponse.json(
        ApiResponse.error('임상 케이스를 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success(result, '임상 케이스가 성공적으로 삭제되었습니다.')
    );

  } catch (error) {
    console.error('임상 케이스 삭제 오류:', error);
    return NextResponse.json(
      ApiResponse.error('임상 케이스 삭제 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
} 
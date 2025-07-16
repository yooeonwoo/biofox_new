import { NextRequest, NextResponse } from 'next/server';
import { xanoDb, ApiResponse, ClinicalSession } from '@/lib/xano-db';

/**
 * GET /api/xano/clinical-sessions - 임상 세션 목록 조회
 * 쿼리 파라미터:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지 크기 (기본값: 10)
 * - case_id: 케이스 ID 필터 (필수)
 * - session_type: 세션 유형 필터 (consultation, treatment, followup, final)
 * - start_date: 시작일 필터
 * - end_date: 종료일 필터
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const caseId = searchParams.get('case_id');
    const sessionType = searchParams.get('session_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // case_id는 필수 파라미터
    if (!caseId) {
      return NextResponse.json(
        ApiResponse.error('case_id 파라미터가 필요합니다.', 400),
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // WHERE 조건 구성
    let whereConditions = [`case_id = $1`];
    let queryParams: any[] = [parseInt(caseId!)];
    let paramIndex = 2;

    if (sessionType) {
      whereConditions.push(`session_type = $${paramIndex}`);
      queryParams.push(sessionType);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`session_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`session_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM clinical_sessions
      ${whereClause}
    `;

    const countResult = await xanoDb.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // 임상 세션 목록 조회
    const sessionsQuery = `
      SELECT 
        *,
        array_length(before_photos, 1) as before_photos_count,
        array_length(after_photos, 1) as after_photos_count
      FROM clinical_sessions
      ${whereClause}
      ORDER BY session_number ASC, session_date ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const sessionsResult = await xanoDb.query(sessionsQuery, queryParams);

    // 세션 통계 조회
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN session_type = 'consultation' THEN 1 END) as consultation_sessions,
        COUNT(CASE WHEN session_type = 'treatment' THEN 1 END) as treatment_sessions,
        COUNT(CASE WHEN session_type = 'followup' THEN 1 END) as followup_sessions,
        COUNT(CASE WHEN session_type = 'final' THEN 1 END) as final_sessions,
        AVG(duration_minutes) as avg_duration_minutes,
        AVG(pain_level) as avg_pain_level,
        AVG(satisfaction_score) as avg_satisfaction_score,
        SUM(array_length(before_photos, 1)) as total_before_photos,
        SUM(array_length(after_photos, 1)) as total_after_photos
      FROM clinical_sessions
      ${whereClause}
    `;

    const statsResult = await xanoDb.query(statsQuery, queryParams.slice(0, -2));

    return NextResponse.json(
      ApiResponse.paginated(sessionsResult.rows, totalCount, page, limit, {
        stats: statsResult.rows[0]
      })
    );

  } catch (error) {
    console.error('임상 세션 목록 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('임상 세션 목록 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * POST /api/xano/clinical-sessions - 새 임상 세션 생성
 * 요청 본문:
 * {
 *   case_id: number,
 *   session_number: number,
 *   session_date: string,
 *   session_type?: 'consultation' | 'treatment' | 'followup' | 'final',
 *   duration_minutes?: number,
 *   notes?: string,
 *   before_photos?: string[],
 *   after_photos?: string[],
 *   pain_level?: number,
 *   satisfaction_score?: number,
 *   side_effects?: string,
 *   next_session_date?: string,
 *   next_session_notes?: string,
 *   session_metadata?: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      case_id,
      session_number,
      session_date,
      session_type = 'treatment',
      duration_minutes = 60,
      notes,
      before_photos = [],
      after_photos = [],
      pain_level = 0,
      satisfaction_score = 0,
      side_effects,
      next_session_date,
      next_session_notes,
      session_metadata = {}
    } = body;

    // 필수 필드 검증
    if (!case_id || !session_number || !session_date) {
      return NextResponse.json(
        ApiResponse.error('필수 필드가 누락되었습니다. (case_id, session_number, session_date)', 400),
        { status: 400 }
      );
    }

    // 유효성 검사
    const validSessionTypes = ['consultation', 'treatment', 'followup', 'final'];
    if (!validSessionTypes.includes(session_type)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 세션 유형입니다.', 400),
        { status: 400 }
      );
    }

    if (duration_minutes < 1 || duration_minutes > 480) {
      return NextResponse.json(
        ApiResponse.error('세션 시간은 1-480분 사이여야 합니다.', 400),
        { status: 400 }
      );
    }

    if (pain_level < 0 || pain_level > 10) {
      return NextResponse.json(
        ApiResponse.error('통증 레벨은 0-10 사이여야 합니다.', 400),
        { status: 400 }
      );
    }

    if (satisfaction_score < 0 || satisfaction_score > 10) {
      return NextResponse.json(
        ApiResponse.error('만족도 점수는 0-10 사이여야 합니다.', 400),
        { status: 400 }
      );
    }

    // 케이스 존재 확인
    const caseCheckQuery = `
      SELECT id FROM clinical_cases WHERE id = $1
    `;
    const caseCheckResult = await xanoDb.query(caseCheckQuery, [case_id]);

    if (caseCheckResult.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('해당 임상 케이스를 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    // 중복 세션 번호 확인
    const duplicateCheckQuery = `
      SELECT id FROM clinical_sessions WHERE case_id = $1 AND session_number = $2
    `;
    const duplicateCheckResult = await xanoDb.query(duplicateCheckQuery, [case_id, session_number]);

    if (duplicateCheckResult.rows.length > 0) {
      return NextResponse.json(
        ApiResponse.error('해당 케이스에 동일한 세션 번호가 이미 존재합니다.', 409),
        { status: 409 }
      );
    }

    const insertQuery = `
      INSERT INTO clinical_sessions (
        case_id, session_number, session_date, session_type, duration_minutes,
        notes, before_photos, after_photos, pain_level, satisfaction_score,
        side_effects, next_session_date, next_session_notes, session_metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
    `;

    const result = await xanoDb.query(insertQuery, [
      case_id,
      session_number,
      session_date,
      session_type,
      duration_minutes,
      notes,
      before_photos,
      after_photos,
      pain_level,
      satisfaction_score,
      side_effects,
      next_session_date,
      next_session_notes,
      session_metadata
    ]);

    return NextResponse.json(
      ApiResponse.success(result.rows[0], '임상 세션이 성공적으로 생성되었습니다.'),
      { status: 201 }
    );

  } catch (error) {
    console.error('임상 세션 생성 오류:', error);
    return NextResponse.json(
      ApiResponse.error('임상 세션 생성 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/xano/clinical-sessions - 임상 세션 수정
 * 요청 본문에 세션 ID와 수정할 필드들을 포함
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('임상 세션 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 현재 세션 조회
    const currentSessionQuery = `
      SELECT * FROM clinical_sessions WHERE id = $1
    `;
    const currentSessionResult = await xanoDb.query(currentSessionQuery, [id]);

    if (currentSessionResult.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('임상 세션을 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    // 유효성 검사
    if (updateFields.session_type && !['consultation', 'treatment', 'followup', 'final'].includes(updateFields.session_type)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 세션 유형입니다.', 400),
        { status: 400 }
      );
    }

    if (updateFields.duration_minutes && (updateFields.duration_minutes < 1 || updateFields.duration_minutes > 480)) {
      return NextResponse.json(
        ApiResponse.error('세션 시간은 1-480분 사이여야 합니다.', 400),
        { status: 400 }
      );
    }

    if (updateFields.pain_level && (updateFields.pain_level < 0 || updateFields.pain_level > 10)) {
      return NextResponse.json(
        ApiResponse.error('통증 레벨은 0-10 사이여야 합니다.', 400),
        { status: 400 }
      );
    }

    if (updateFields.satisfaction_score && (updateFields.satisfaction_score < 0 || updateFields.satisfaction_score > 10)) {
      return NextResponse.json(
        ApiResponse.error('만족도 점수는 0-10 사이여야 합니다.', 400),
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
      UPDATE clinical_sessions 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await xanoDb.query(updateQuery, values);

    return NextResponse.json(
      ApiResponse.success(result.rows[0], '임상 세션이 성공적으로 수정되었습니다.')
    );

  } catch (error) {
    console.error('임상 세션 수정 오류:', error);
    return NextResponse.json(
      ApiResponse.error('임상 세션 수정 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/xano/clinical-sessions - 임상 세션 삭제
 * 쿼리 파라미터: id (세션 ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('임상 세션 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    const deleteQuery = `
      DELETE FROM clinical_sessions WHERE id = $1 RETURNING *
    `;
    const result = await xanoDb.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('임상 세션을 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success(result.rows[0], '임상 세션이 성공적으로 삭제되었습니다.')
    );

  } catch (error) {
    console.error('임상 세션 삭제 오류:', error);
    return NextResponse.json(
      ApiResponse.error('임상 세션 삭제 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/xano/clinical-sessions/photos - 세션 사진 추가/제거
 * 요청 본문:
 * {
 *   id: number,
 *   action: 'add' | 'remove',
 *   photo_type: 'before' | 'after',
 *   photo_urls: string[]
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, photo_type, photo_urls } = body;

    if (!id || !action || !photo_type || !Array.isArray(photo_urls)) {
      return NextResponse.json(
        ApiResponse.error('필수 필드가 누락되었습니다. (id, action, photo_type, photo_urls)', 400),
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 액션입니다. (add, remove)', 400),
        { status: 400 }
      );
    }

    if (!['before', 'after'].includes(photo_type)) {
      return NextResponse.json(
        ApiResponse.error('유효하지 않은 사진 유형입니다. (before, after)', 400),
        { status: 400 }
      );
    }

    const photoColumn = photo_type === 'before' ? 'before_photos' : 'after_photos';

    let updateQuery;
    let queryParams;

    if (action === 'add') {
      // 사진 추가
      updateQuery = `
        UPDATE clinical_sessions 
        SET ${photoColumn} = ${photoColumn} || $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      queryParams = [id, photo_urls];
    } else {
      // 사진 제거
      updateQuery = `
        UPDATE clinical_sessions 
        SET ${photoColumn} = array(
          SELECT unnest(${photoColumn}) 
          EXCEPT 
          SELECT unnest($2::text[])
        ), updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      queryParams = [id, photo_urls];
    }

    const result = await xanoDb.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('임상 세션을 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success(result.rows[0], `사진이 성공적으로 ${action === 'add' ? '추가' : '제거'}되었습니다.`)
    );

  } catch (error) {
    console.error('세션 사진 업데이트 오류:', error);
    return NextResponse.json(
      ApiResponse.error('세션 사진 업데이트 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
} 
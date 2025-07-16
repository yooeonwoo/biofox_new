import { NextRequest, NextResponse } from 'next/server';
import { xanoDb, ApiResponse, CrmCard } from '@/lib/xano-db';

/**
 * GET /api/xano/crm-workflow - CRM 카드 목록 조회
 * 쿼리 파라미터:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지 크기 (기본값: 10)
 * - kol_id: KOL ID 필터
 * - stage: 현재 단계 필터 (1-10)
 * - status: 특정 단계 상태 필터
 * - tags: 태그 필터 (쉼표로 구분)
 * - installation_training: 설치 교육 완료 여부 필터
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const kolId = searchParams.get('kol_id');
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const tags = searchParams.get('tags');
    const installationTraining = searchParams.get('installation_training');

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

    if (stage && status) {
      whereConditions.push(`stage_${stage}_status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereConditions.push(`tags && $${paramIndex}`);
      queryParams.push(tagArray);
      paramIndex++;
    }

    if (installationTraining !== null) {
      whereConditions.push(`installation_training_completed = $${paramIndex}`);
      queryParams.push(installationTraining === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM crm_cards
      ${whereClause}
    `;

    const countResult = await xanoDb.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // CRM 카드 목록 조회
    const cardsQuery = `
      SELECT 
        *,
        CASE 
          WHEN stage_10_status = 'completed' THEN 10
          WHEN stage_9_status = 'completed' THEN 9
          WHEN stage_8_status = 'completed' THEN 8
          WHEN stage_7_status = 'completed' THEN 7
          WHEN stage_6_status = 'completed' THEN 6
          WHEN stage_5_status = 'completed' THEN 5
          WHEN stage_4_status = 'completed' THEN 4
          WHEN stage_3_status = 'completed' THEN 3
          WHEN stage_2_status = 'completed' THEN 2
          WHEN stage_1_status = 'completed' THEN 1
          ELSE 0
        END as current_stage,
        CASE 
          WHEN stage_10_status = 'completed' THEN 100
          WHEN stage_9_status = 'completed' THEN 90
          WHEN stage_8_status = 'completed' THEN 80
          WHEN stage_7_status = 'completed' THEN 70
          WHEN stage_6_status = 'completed' THEN 60
          WHEN stage_5_status = 'completed' THEN 50
          WHEN stage_4_status = 'completed' THEN 40
          WHEN stage_3_status = 'completed' THEN 30
          WHEN stage_2_status = 'completed' THEN 20
          WHEN stage_1_status = 'completed' THEN 10
          ELSE 0
        END as progress_percentage
      FROM crm_cards
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const cardsResult = await xanoDb.query(cardsQuery, queryParams);

    // 단계별 통계 추가
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN stage_1_status = 'completed' THEN 1 END) as stage_1_completed,
        COUNT(CASE WHEN stage_2_status = 'completed' THEN 1 END) as stage_2_completed,
        COUNT(CASE WHEN stage_3_status = 'completed' THEN 1 END) as stage_3_completed,
        COUNT(CASE WHEN stage_4_status = 'completed' THEN 1 END) as stage_4_completed,
        COUNT(CASE WHEN stage_5_status = 'completed' THEN 1 END) as stage_5_completed,
        COUNT(CASE WHEN stage_6_status = 'completed' THEN 1 END) as stage_6_completed,
        COUNT(CASE WHEN stage_7_status = 'completed' THEN 1 END) as stage_7_completed,
        COUNT(CASE WHEN stage_8_status = 'completed' THEN 1 END) as stage_8_completed,
        COUNT(CASE WHEN stage_9_status = 'completed' THEN 1 END) as stage_9_completed,
        COUNT(CASE WHEN stage_10_status = 'completed' THEN 1 END) as stage_10_completed,
        COUNT(CASE WHEN installation_training_completed = true THEN 1 END) as training_completed,
        AVG(CASE 
          WHEN stage_10_status = 'completed' THEN 100
          WHEN stage_9_status = 'completed' THEN 90
          WHEN stage_8_status = 'completed' THEN 80
          WHEN stage_7_status = 'completed' THEN 70
          WHEN stage_6_status = 'completed' THEN 60
          WHEN stage_5_status = 'completed' THEN 50
          WHEN stage_4_status = 'completed' THEN 40
          WHEN stage_3_status = 'completed' THEN 30
          WHEN stage_2_status = 'completed' THEN 20
          WHEN stage_1_status = 'completed' THEN 10
          ELSE 0
        END) as avg_progress
      FROM crm_cards
      ${whereClause}
    `;

    const statsResult = await xanoDb.query(statsQuery, queryParams.slice(0, -2));

    return NextResponse.json(
      ApiResponse.paginated(cardsResult.rows, totalCount, page, limit, {
        stats: statsResult.rows[0]
      })
    );

  } catch (error) {
    console.error('CRM 카드 목록 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('CRM 카드 목록 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * POST /api/xano/crm-workflow - 새 CRM 카드 생성
 * 요청 본문:
 * {
 *   kol_id: number,
 *   shop_id: number,
 *   tags?: string[],
 *   initial_stage?: number,
 *   q1_answer?: string,
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      kol_id,
      shop_id,
      tags = [],
      initial_stage = 1,
      q1_answer,
      q2_answer,
      q3_answer,
      q4_answer,
      q5_answer,
      q6_answer
    } = body;

    // 필수 필드 검증
    if (!kol_id || !shop_id) {
      return NextResponse.json(
        ApiResponse.error('필수 필드가 누락되었습니다. (kol_id, shop_id)', 400),
        { status: 400 }
      );
    }

    // 중복 shop_id 체크
    const existingCardQuery = `
      SELECT id FROM crm_cards WHERE shop_id = $1
    `;
    const existingCardResult = await xanoDb.query(existingCardQuery, [shop_id]);

    if (existingCardResult.rows.length > 0) {
      return NextResponse.json(
        ApiResponse.error('해당 전문점의 CRM 카드가 이미 존재합니다.', 409),
        { status: 409 }
      );
    }

    // 초기 단계 설정
    const initialStageFields: any = {};
    if (initial_stage >= 1 && initial_stage <= 10) {
      initialStageFields[`stage_${initial_stage}_status`] = 'in_progress';
    }

    const insertQuery = `
      INSERT INTO crm_cards (
        kol_id, shop_id, tags, 
        q1_answer, q2_answer, q3_answer, q4_answer, q5_answer, q6_answer,
        ${Object.keys(initialStageFields).join(', ')}
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
        ${Object.keys(initialStageFields).length > 0 ? ', ' + Object.keys(initialStageFields).map((_, i) => `$${10 + i}`).join(', ') : ''}
      )
      RETURNING *
    `;

    const queryParams = [
      kol_id,
      shop_id,
      tags,
      q1_answer,
      q2_answer,
      q3_answer,
      q4_answer,
      q5_answer,
      q6_answer,
      ...Object.values(initialStageFields)
    ];

    const result = await xanoDb.query(insertQuery, queryParams);

    return NextResponse.json(
      ApiResponse.success(result.rows[0], 'CRM 카드가 성공적으로 생성되었습니다.'),
      { status: 201 }
    );

  } catch (error) {
    console.error('CRM 카드 생성 오류:', error);
    return NextResponse.json(
      ApiResponse.error('CRM 카드 생성 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/xano/crm-workflow - CRM 카드 업데이트
 * 요청 본문:
 * {
 *   id: number,
 *   stage?: number,
 *   action?: 'start' | 'complete' | 'skip',
 *   tags?: string[],
 *   installation_training_completed?: boolean,
 *   q1_answer?: string,
 *   ...
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, stage, action, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('CRM 카드 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 현재 CRM 카드 조회
    const currentCardQuery = `
      SELECT * FROM crm_cards WHERE id = $1
    `;
    const currentCardResult = await xanoDb.query(currentCardQuery, [id]);

    if (currentCardResult.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('CRM 카드를 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    // 단계 상태 업데이트 처리
    if (stage && action) {
      if (stage < 1 || stage > 10) {
        return NextResponse.json(
          ApiResponse.error('단계는 1-10 사이여야 합니다.', 400),
          { status: 400 }
        );
      }

      const stageStatusField = `stage_${stage}_status`;
      const stageCompletedField = `stage_${stage}_completed_at`;

      if (action === 'start') {
        (updateFields as any)[stageStatusField] = 'in_progress';
      } else if (action === 'complete') {
        (updateFields as any)[stageStatusField] = 'completed';
        (updateFields as any)[stageCompletedField] = new Date().toISOString();
      } else if (action === 'skip') {
        (updateFields as any)[stageStatusField] = 'skipped';
      }
    }

    // 설치 교육 완료 시 날짜 자동 설정
    if (updateFields.installation_training_completed === true && !updateFields.installation_training_date) {
      updateFields.installation_training_date = new Date().toISOString();
    }

    // 동적 UPDATE 쿼리 생성
    const updateKeys = Object.keys(updateFields);
    if (updateKeys.length === 0) {
      return NextResponse.json(
        ApiResponse.error('업데이트할 필드가 없습니다.', 400),
        { status: 400 }
      );
    }

    const setClause = updateKeys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...updateKeys.map(key => updateFields[key])];

    const updateQuery = `
      UPDATE crm_cards 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await xanoDb.query(updateQuery, values);

    return NextResponse.json(
      ApiResponse.success(result.rows[0], 'CRM 카드가 성공적으로 업데이트되었습니다.')
    );

  } catch (error) {
    console.error('CRM 카드 업데이트 오류:', error);
    return NextResponse.json(
      ApiResponse.error('CRM 카드 업데이트 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/xano/crm-workflow - CRM 카드 삭제
 * 쿼리 파라미터: id (CRM 카드 ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('CRM 카드 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    // 관련 데이터 확인 (셀프 성장 카드)
    const relatedDataQuery = `
      SELECT COUNT(*) as count FROM self_growth_cards WHERE crm_card_id = $1
    `;
    const relatedDataResult = await xanoDb.query(relatedDataQuery, [id]);

    if (parseInt(relatedDataResult.rows[0].count) > 0) {
      return NextResponse.json(
        ApiResponse.error('관련된 셀프 성장 카드가 존재하여 삭제할 수 없습니다.', 409),
        { status: 409 }
      );
    }

    // CRM 카드 삭제
    const deleteQuery = `
      DELETE FROM crm_cards WHERE id = $1 RETURNING *
    `;
    const result = await xanoDb.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('CRM 카드를 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success(result.rows[0], 'CRM 카드가 성공적으로 삭제되었습니다.')
    );

  } catch (error) {
    console.error('CRM 카드 삭제 오류:', error);
    return NextResponse.json(
      ApiResponse.error('CRM 카드 삭제 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
}

/**
 * GET /api/xano/crm-workflow/stages - 단계별 상세 정보
 * 쿼리 파라미터: id (CRM 카드 ID)
 */
export async function GET_STAGES(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        ApiResponse.error('CRM 카드 ID가 필요합니다.', 400),
        { status: 400 }
      );
    }

    const stagesQuery = `
      SELECT 
        id,
        stage_1_status, stage_1_completed_at,
        stage_2_status, stage_2_completed_at,
        stage_3_status, stage_3_completed_at,
        stage_4_status, stage_4_completed_at,
        stage_5_status, stage_5_completed_at,
        stage_6_status, stage_6_completed_at,
        stage_7_status, stage_7_completed_at,
        stage_8_status, stage_8_completed_at,
        stage_9_status, stage_9_completed_at,
        stage_10_status, stage_10_completed_at,
        installation_training_completed,
        installation_training_date
      FROM crm_cards 
      WHERE id = $1
    `;

    const result = await xanoDb.query(stagesQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        ApiResponse.error('CRM 카드를 찾을 수 없습니다.', 404),
        { status: 404 }
      );
    }

    const card = result.rows[0];

    // 단계별 정보 구성
    const stages = [];
    for (let i = 1; i <= 10; i++) {
      stages.push({
        stage: i,
        status: card[`stage_${i}_status`],
        completed_at: card[`stage_${i}_completed_at`],
        is_current: card[`stage_${i}_status`] === 'in_progress'
      });
    }

    return NextResponse.json(
      ApiResponse.success({
        stages,
        installation_training: {
          completed: card.installation_training_completed,
          completed_at: card.installation_training_date
        }
      }, '단계별 정보 조회 성공')
    );

  } catch (error) {
    console.error('단계별 정보 조회 오류:', error);
    return NextResponse.json(
      ApiResponse.error('단계별 정보 조회 중 오류가 발생했습니다.', 500, error),
      { status: 500 }
    );
  }
} 
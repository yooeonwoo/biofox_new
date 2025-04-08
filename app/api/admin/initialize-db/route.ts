/**
 * 데이터베이스 초기화 API
 * 개발 환경에서만 사용하세요!
 */
import { NextRequest, NextResponse } from "next/server";
import { migrateDatabase } from "@/db/migrate";
import { auth } from "@clerk/nextjs/server";
import { initializeRpcFunctions, executeSql } from "@/db/init-rpc";
import { serverSupabase as supabase, serverSupabase as supabaseAdmin } from "@/lib/supabase";
import path from "path";
import fs from "fs";
import { getAuth } from "@/lib/auth";

/**
 * SQL 파일을 읽어서 반환하는 함수
 */
function readSqlFile(fileName: string): string {
  const filePath = path.join(process.cwd(), 'db', 'sql', fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`${filePath} 파일이 존재하지 않습니다.`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

export async function POST(req: NextRequest) {
  try {
    // 개발 환경인지 확인
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "이 API는 개발 환경에서만 사용할 수 있습니다." },
        { status: 403 }
      );
    }

    // 관리자 권한 확인 - getAuth 함수 사용
    const { userId, role } = await getAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 역할 확인
    if (role !== '본사관리자') {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 1. RPC 함수 초기화
    console.log("1. RPC 함수 초기화 중...");
    const rpcResult = await initializeRpcFunctions();
    console.log('RPC 함수 초기화 결과:', rpcResult);

    if (!rpcResult.success) {
      console.error("RPC 함수 초기화 실패:", rpcResult);
      return NextResponse.json(
        { 
          error: "RPC 함수 초기화에 실패했습니다.",
          details: rpcResult
        },
        { status: 500 }
      );
    }

    // 2. 테이블 생성
    console.log("2. 테이블 생성 중...");
    const tables = [
      { name: 'users', file: 'create_users_table.sql' },
      { name: 'kols', file: 'create_kols_table.sql' },
      { name: 'shops', file: 'create_shops_table.sql' },
      { name: 'products', file: 'create_products_table.sql' },
      { name: 'orders', file: 'create_orders_table.sql' },
      { name: 'order_items', file: 'create_order_items_table.sql' },
      { name: 'commissions', file: 'create_commissions_table.sql' },
      { name: 'notifications', file: 'create_notifications_table.sql' },
    ];

    const tableResults = [];
    
    // 2.1. 먼저 create_users_table 함수 호출 시도
    try {
      const { data, error } = await supabaseAdmin.rpc('create_users_table');
      
      if (error) {
        console.error("create_users_table 함수 호출 실패:", error);
        tableResults.push({
          table: 'users',
          success: false,
          error: error
        });
      } else {
        console.log("create_users_table 함수 호출 성공:", data);
        tableResults.push({
          table: 'users',
          success: true,
          data: data
        });
      }
    } catch (error) {
      console.error("create_users_table 함수 호출 중 오류:", error);
      tableResults.push({
        table: 'users',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 2.2. 나머지 테이블 SQL 파일 실행
    for (const table of tables) {
      if (table.name === 'users') continue; // users는 이미 처리함
      
      try {
        const sqlContent = readSqlFile(table.file);
        
        if (!sqlContent) {
          console.log(`${table.file} 파일이 없습니다. 건너뜁니다.`);
          continue;
        }
        
        console.log(`${table.name} 테이블 생성 중...`);
        const result = await executeSql(sqlContent, `${table.name} 테이블 생성`);
        
        tableResults.push({
          table: table.name,
          success: result.success,
          data: result.data,
          error: result.success ? null : result.message
        });
        
        console.log(`${table.name} 테이블 생성 결과:`, result.success ? '성공' : '실패');
      } catch (error) {
        console.error(`${table.name} 테이블 생성 중 오류:`, error);
        tableResults.push({
          table: table.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 3. 테이블 존재 확인
    console.log("3. 테이블 존재 확인 중...");
    const { data, error } = await supabase.from('users').select('count');
    if (error) {
      console.error('users 테이블이 없습니다:', error);
    } else {
      console.log('users 테이블이 확인되었습니다:', data);
    }

    // 4. 추가 마이그레이션 실행 (필요한 경우)
    console.log("4. 추가 마이그레이션 실행 중...");
    let migrationResult = null;
    try {
      const result = await migrateDatabase();
      console.log('데이터베이스 마이그레이션 결과:', result);
      migrationResult = result;
    } catch (error) {
      console.error('데이터베이스 마이그레이션 실패:', error);
      migrationResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    return NextResponse.json({ 
      success: true,
      message: "데이터베이스 초기화가 완료되었습니다.",
      rpcResult,
      tableResults,
      migrationResult,
      usersTable: error ? null : data
    });
  } catch (error) {
    console.error("데이터베이스 초기화 오류:", error);
    return NextResponse.json(
      { 
        error: "데이터베이스 초기화 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 데이터베이스 관리 페이지
 * 이 페이지는 클라이언트 컴포넌트를 import하여 SQL 실행 기능을 제공합니다.
 */
export default function DatabasePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">데이터베이스 관리</h1>
      
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>데이터베이스 관리 도구</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              다음 쿼리를 실행하여 데이터베이스 상태를 확인할 수 있습니다:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm mb-4 overflow-auto">
              {`-- 테이블 목록 조회
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- users 테이블 조회
SELECT * FROM users LIMIT 10;`}
            </pre>
            <p>
              <strong>참고:</strong> SQL 실행기는 아직 준비 중입니다. 컴포넌트가 준비되면 이 페이지에 추가됩니다.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <div className="border p-6 rounded-md bg-orange-50 dark:bg-orange-950">
          <h2 className="text-lg font-semibold mb-2 text-orange-700 dark:text-orange-300">
            중요 안내
          </h2>
          <p className="text-orange-700 dark:text-orange-300">
            이 도구는 개발 환경이나 관리자 계정에서만 접근 가능하며, 데이터베이스에 직접적인 변경을 가할 수 있습니다.
            항상 실행 전에 SQL 쿼리를 신중하게 검토하세요.
          </p>
        </div>
      </div>
    </div>
  );
} 
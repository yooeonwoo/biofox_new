-- SQL 쿼리를 안전하게 실행하는 함수 생성
CREATE OR REPLACE FUNCTION run_sql_query(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 소유자의 권한으로 실행
AS $$
DECLARE
  result JSONB;
BEGIN
  -- 여기에 추가적인 보안 검사를 추가할 수 있습니다
  -- 예: 특정 키워드(DROP, ALTER 등) 차단
  
  -- SQL 명령어 실행 및 결과를 JSON으로 변환
  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'code', SQLSTATE);
END;
$$;

-- 함수 권한 설정
ALTER FUNCTION run_sql_query(TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION run_sql_query(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION run_sql_query(TEXT) TO service_role; 
-- SQL 실행을 위한 함수 생성
CREATE OR REPLACE FUNCTION public.exec_sql(_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- 함수 소유자 권한으로 실행
AS $$
DECLARE
    _res jsonb;
    _lower_sql text;
BEGIN
    -- 소문자로 만들어 문장의 시작을 체크
    _lower_sql := lower(trim(_sql));

    IF _lower_sql LIKE 'select%' THEN
        -- SELECT문의 경우 결과를 JSON 배열로 만들어 반환
        EXECUTE format('SELECT jsonb_agg(row) FROM (%s) AS row', _sql)
        INTO _res;

        RETURN COALESCE(_res, '[]'::jsonb);
    ELSE
        -- SELECT가 아닌 DDL / DML 문은 결과 집합이 없으므로 실행 후 메시지 반환
        EXECUTE _sql;
        RETURN jsonb_build_object('message', 'Statement executed successfully');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- 권한 설정
ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role; 
/**
 * ⚠️ DEPRECATED: 이 파일은 Convex 전환으로 점진적으로 사용을 중단할 예정입니다
 *
 * 새로운 API 호출 방식:
 * - 읽기 작업: Convex useQuery 훅 사용
 * - 쓰기 작업: React Query + ConvexHttpClient 조합 사용
 *
 * 기존 코드 호환성을 위해 잠시 유지되지만,
 * 새로운 개발에서는 Convex 패턴을 사용하세요.
 */

/**
 * API 호출을 위한 유틸리티 함수들
 *
 * 모든 API 호출에서 인증 정보와 함께 요청을 보내기 위한 함수들을 제공합니다.
 * Supabase 세션 쿠키가 자동으로 전송되도록 credentials: 'include' 옵션을 사용합니다.
 */

/**
 * 인증 정보를 포함한 API 요청을 수행하는 함수
 * 모든 API 호출에서 이 함수를 사용하면 Supabase 인증이 자동으로 처리됩니다.
 *
 * @param url API 엔드포인트 URL
 * @param options fetch 옵션
 * @returns fetch 응답
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // credentials: 'include'를 설정하여 쿠키가 요청과 함께 전송되도록 합니다
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 옵션 병합
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    // 401 (Unauthorized) 응답을 받았을 때 처리
    if (response.status === 401) {
      console.error('인증 실패: API 세션이 만료되었거나 유효하지 않습니다.');

      // 로그인 페이지로 리다이렉트 (선택적)
      // window.location.href = '/signin';
    }

    return response;
  } catch (error) {
    console.error('API 요청 중 오류 발생:', error);
    throw error;
  }
};

/**
 * GET 요청을 수행하는 함수
 *
 * @param url API 엔드포인트 URL
 * @param options 추가 옵션
 * @returns fetch 응답
 */
export const getWithAuth = (url: string, options: RequestInit = {}) => {
  return fetchWithAuth(url, {
    method: 'GET',
    ...options,
  });
};

/**
 * POST 요청을 수행하는 함수
 *
 * @param url API 엔드포인트 URL
 * @param data 요청 본문 데이터
 * @param options 추가 옵션
 * @returns fetch 응답
 */
export const postWithAuth = (url: string, data: any, options: RequestInit = {}) => {
  return fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * PUT 요청을 수행하는 함수
 *
 * @param url API 엔드포인트 URL
 * @param data 요청 본문 데이터
 * @param options 추가 옵션
 * @returns fetch 응답
 */
export const putWithAuth = (url: string, data: any, options: RequestInit = {}) => {
  return fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * PATCH 요청을 수행하는 함수
 *
 * @param url API 엔드포인트 URL
 * @param data 요청 본문 데이터
 * @param options 추가 옵션
 * @returns fetch 응답
 */
export const patchWithAuth = (url: string, data: any, options: RequestInit = {}) => {
  return fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * DELETE 요청을 수행하는 함수
 *
 * @param url API 엔드포인트 URL
 * @param options 추가 옵션
 * @returns fetch 응답
 */
export const deleteWithAuth = (url: string, options: RequestInit = {}) => {
  return fetchWithAuth(url, {
    method: 'DELETE',
    ...options,
  });
};

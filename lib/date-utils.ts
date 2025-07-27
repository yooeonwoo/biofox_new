/**
 * 날짜 관련 유틸리티 함수
 * 전체 시스템에서 year_month는 "YYYY-MM" 형식으로 통일
 */

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 현재 월을 YYYY-MM 형식으로 반환 (표준 형식)
 * 전체 시스템에서 이 형식을 사용
 */
export function getCurrentYearMonth(): string {
  const currentDate = getCurrentDate();
  return currentDate.substring(0, 7); // "2025-05"
}

/**
 * 주어진 날짜의 전월을 YYYY-MM 형식으로 반환
 * @param dateStr YYYY-MM-DD 형식의 날짜 문자열
 */
export function getPreviousMonth(dateStr: string): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() - 1);

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  return `${year}-${month}`;
}

/**
 * 주어진 날짜의 전월을 YYYY-MM 형식으로 반환
 * @param dateStr YYYY-MM-DD 형식의 날짜 문자열
 * @deprecated getPreviousMonth를 사용하세요
 */
export function getPreviousYearMonth(dateStr: string): string {
  return getPreviousMonth(dateStr);
}

/**
 * 주어진 날짜의 다음 월을 YYYY-MM 형식으로 반환
 * @param dateStr YYYY-MM-DD 형식의 날짜 문자열
 */
export function getNextMonth(dateStr: string): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + 1);

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  return `${year}-${month}`;
}

/**
 * 날짜 범위의 모든 월을 YYYY-MM 형식 배열로 반환
 * @param startDate YYYY-MM-DD 형식 시작일
 * @param endDate YYYY-MM-DD 형식 종료일
 */
export function getMonthsBetween(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months: string[] = [];

  const current = new Date(start);
  current.setDate(1); // 월의 첫날로 설정

  while (current <= end) {
    const year = current.getFullYear();
    const month = (current.getMonth() + 1).toString().padStart(2, '0');
    months.push(`${year}-${month}`);

    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * YYYY-MM 형식의 문자열을 "YYYY년 M월" 형식으로 변환
 */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  if (!year || !month) {
    throw new Error(`Invalid yearMonth format: ${yearMonth}. Expected YYYY-MM format.`);
  }
  return `${year}년 ${parseInt(month, 10)}월`;
}

/**
 * YYYY-MM 형식을 YYYYMM 형식으로 변환 (레거시 호환용)
 * @param yearMonth YYYY-MM 형식 문자열
 * @returns YYYYMM 형식 문자열
 * @deprecated 가능한 YYYY-MM 형식을 직접 사용하세요
 */
export function toCompactYearMonth(yearMonth: string): string {
  return yearMonth.replace('-', '');
}

/**
 * YYYYMM 형식을 YYYY-MM 형식으로 변환 (레거시 호환용)
 * @param compactYearMonth YYYYMM 형식 문자열
 * @returns YYYY-MM 형식 문자열
 */
export function fromCompactYearMonth(compactYearMonth: string): string {
  if (compactYearMonth.length !== 6) {
    throw new Error('Invalid compact year month format. Expected YYYYMM');
  }
  return `${compactYearMonth.substring(0, 4)}-${compactYearMonth.substring(4, 6)}`;
}

/**
 * 년월 형식 검증 함수
 * @param yearMonth 검증할 년월 문자열
 * @returns YYYY-MM 형식이면 true, 아니면 false
 */
export function isValidYearMonth(yearMonth: string): boolean {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(yearMonth)) return false;

  const parts = yearMonth.split('-');
  if (parts.length !== 2) return false;

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  if (isNaN(year) || isNaN(month)) return false;

  return year >= 2020 && year <= 2030 && month >= 1 && month <= 12;
}

/**
 * 년월 형식 정규화 함수 (YYYYMM → YYYY-MM 또는 YYYY-MM 유지)
 * @param yearMonth YYYY-MM 또는 YYYYMM 형식 문자열
 * @returns 정규화된 YYYY-MM 형식 문자열
 */
export function normalizeYearMonth(yearMonth: string): string {
  if (!yearMonth) return '';

  // YYYY-MM 형식이면 그대로 반환
  if (isValidYearMonth(yearMonth)) {
    return yearMonth;
  }

  // YYYYMM 형식이면 YYYY-MM으로 변환
  if (yearMonth.length === 6 && /^\d{6}$/.test(yearMonth)) {
    return fromCompactYearMonth(yearMonth);
  }

  throw new Error(`Invalid year month format: ${yearMonth}. Expected YYYY-MM or YYYYMM`);
}

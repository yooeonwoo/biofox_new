/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
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
  
  let current = new Date(start);
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
  return `${year}년 ${parseInt(month)}월`;
} 
/**
 * 공통 유틸리티 함수
 */

// 날짜 형식 변환 (YYYY/MM/DD -> YYYY-MM-DD)
function convertDate(dateStr) {
  if (!dateStr) return null;
  return dateStr.replace(/\//g, '-');
}

// 비어있는 필드 처리
function handleEmptyField(value, defaultValue = null) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value;
}

// 커미션 비율 처리 (예: "100%" -> 100.00)
function convertCommissionRate(rateStr) {
  if (!rateStr) return null;
  return parseFloat(rateStr.replace('%', ''));
}

module.exports = {
  convertDate,
  handleEmptyField,
  convertCommissionRate
}; 
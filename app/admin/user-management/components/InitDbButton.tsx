"use client";

import React, { useState } from "react";

export default function InitDbButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function initializeDatabase() {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/initialize-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '데이터베이스 초기화 실패');
      }
      
      alert('데이터베이스가 성공적으로 초기화되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('초기화 오류:', error);
      alert(`초기화 오류: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={initializeDatabase}
      disabled={isLoading}
      className={`px-4 py-2 font-semibold text-purple-800 rounded-md ${
        isLoading 
          ? "bg-gray-400 cursor-not-allowed" 
          : "bg-amber-600 hover:bg-amber-700"
      }`}
    >
      {isLoading ? "처리 중..." : "데이터베이스 초기화 (개발용)"}
    </button>
  );
} 
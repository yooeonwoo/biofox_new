"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-6 text-center text-red-600">
      오류가 발생했습니다: {error.message}
    </div>
  );
} 
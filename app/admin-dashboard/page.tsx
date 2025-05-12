import { redirect } from 'next/navigation';

export default function AdminDashboardPage() {
  // 기본적으로 메인 페이지로 리다이렉트
  redirect('/admin-dashboard/main');
  
  // 실제로는 실행되지 않는 부분
  return null;
} 
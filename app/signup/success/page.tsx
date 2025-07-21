import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SignupSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>가입 확인</CardTitle>
          <CardDescription>계정 생성이 거의 완료되었습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            입력하신 이메일 주소로 인증 링크를 보냈습니다. 이메일을 확인하여 가입을 완료해주세요.
          </p>
          <p className="text-sm text-gray-500">
            이메일을 받지 못하셨다면, 스팸 메일함을 확인해보세요.
          </p>
          <Link href="/signin" className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            로그인 페이지로 돌아가기
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

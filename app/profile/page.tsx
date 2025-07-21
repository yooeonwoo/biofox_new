'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const profileSchema = z.object({
  fullName: z.string().min(2, { message: '이름은 2자 이상이어야 합니다.' }),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin');
      } else {
        setUser(user);
        setValue('email', user.email || '');
        setValue('fullName', user.user_metadata.full_name || '');
      }
      setLoading(false);
    };

    fetchUser();
  }, [router, setValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: data.fullName },
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      // Optionally, show a success message
      alert('프로필이 성공적으로 업데이트되었습니다.');
      // Refresh user data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>프로필 관리</CardTitle>
          <CardDescription>개인 정보를 수정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일 (수정 불가)</Label>
              <Input id="email" type="email" {...register('email')} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">이름</Label>
              <Input id="fullName" {...register('fullName')} />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '프로필 저장'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

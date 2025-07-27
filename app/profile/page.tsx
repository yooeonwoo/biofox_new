'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const profileSchema = z.object({
  display_name: z.string().min(2, { message: '표시 이름은 2자 이상이어야 합니다.' }),
  bio: z.string().optional(),
  shop_name: z.string().min(2, { message: '매장명은 2자 이상이어야 합니다.' }),
  region: z.string().optional(),
  naver_place_link: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  return (
    <ProtectedRoute requireAuth={true} fallbackUrl="/signin">
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, profile, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateProfile = useMutation(api.profiles.updateProfile);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      shop_name: profile?.shop_name || '',
      region: profile?.region || '',
      naver_place_link: '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!profile?._id) {
      setError('프로필 ID를 찾을 수 없습니다.');
      setIsSubmitting(false);
      return;
    }

    try {
      await updateProfile({
        profileId: profile._id as Id<'profiles'>,
        name: data.display_name,
        shop_name: data.shop_name,
        region: data.region,
        naver_place_link: data.naver_place_link || undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const completenessValue = 80; // 임시 완성도 값
  const missingFields: string[] = []; // 임시로 빈 배열

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* 헤더 섹션 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">프로필 관리</h1>
                <p className="mt-1 text-sm text-gray-500">
                  개인 정보와 매장 정보를 관리할 수 있습니다.
                </p>
              </div>
              <Badge variant={profile?.status === 'approved' ? 'default' : 'secondary'}>
                {profile?.status === 'approved'
                  ? '승인됨'
                  : profile?.status === 'pending'
                    ? '승인 대기'
                    : profile?.status === 'rejected'
                      ? '거절됨'
                      : '미확인'}
              </Badge>
            </div>
          </div>

          {/* 프로필 완성도 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                프로필 완성도
                <span className="text-sm font-normal">{completenessValue}%</span>
              </CardTitle>
              <CardDescription>프로필을 완성하여 더 나은 서비스를 이용하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={completenessValue} className="mb-4" />
              {missingFields.length > 0 && (
                <div className="text-sm text-gray-600">
                  <p className="mb-2">완성이 필요한 필드:</p>
                  <ul className="list-inside list-disc space-y-1">
                    {missingFields.map(field => (
                      <li key={field}>{getFieldLabel(field)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>변경할 수 없는 기본 정보입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>이메일</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <Label>역할</Label>
                  <Input value={getRoleLabel(profile?.role || '')} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 프로필 수정 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>프로필 정보</CardTitle>
              <CardDescription>수정 가능한 프로필 정보입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">표시 이름 *</Label>
                    <Input id="display_name" {...register('display_name')} />
                    {errors.display_name && (
                      <p className="text-sm text-red-500">{errors.display_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop_name">매장명 *</Label>
                    <Input id="shop_name" {...register('shop_name')} />
                    {errors.shop_name && (
                      <p className="text-sm text-red-500">{errors.shop_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">소개</Label>
                  <Textarea
                    id="bio"
                    {...register('bio')}
                    placeholder="자신이나 매장에 대한 간단한 소개를 작성해보세요."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="region">지역</Label>
                    <Input id="region" {...register('region')} placeholder="예: 서울 강남구" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="naver_place_link">네이버 플레이스 링크</Label>
                    <Input
                      id="naver_place_link"
                      {...register('naver_place_link')}
                      placeholder="https://place.naver.com/..."
                    />
                    {errors.naver_place_link && (
                      <p className="text-sm text-red-500">{errors.naver_place_link.message}</p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>
                )}

                {success && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-500">
                    프로필이 성공적으로 업데이트되었습니다.
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? '저장 중...' : '프로필 저장'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getFieldLabel(field: string): string {
  const fieldLabels: { [key: string]: string } = {
    display_name: '표시 이름',
    bio: '소개',
    profile_image_url: '프로필 이미지',
    shop_name: '매장명',
    region: '지역',
  };

  return fieldLabels[field] || field;
}

function getRoleLabel(role: string): string {
  const roleLabels: { [key: string]: string } = {
    admin: '관리자',
    kol: 'KOL',
    ol: 'OL',
    shop_owner: '매장 관리자',
  };

  return roleLabels[role] || role;
}

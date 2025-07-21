import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Personal Case Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 개발용 로그인 - localStorage에 mock 토큰 주입
    await page.addInitScript(() => {
      localStorage.setItem('mockAuth', 'true');
      // Supabase session mock
      localStorage.setItem('sb-cezxkgmzlkbjqataogtd-auth-token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: '00000000-0000-4000-8000-000000000001',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User'
          }
        }
      }));
    });
  });

  test('Personal 페이지 로딩 및 기본 렌더링', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/personal');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/biofox-kol/);
    
    // 기본 UI 요소 확인
    await expect(page.getByText('본인 케이스')).toBeVisible();
    
    // 케이스가 없을 때의 빈 상태 확인
    await expect(page.getByText('아직 본인 케이스가 없습니다')).toBeVisible();
    await expect(page.getByText('본인 케이스 추가')).toBeVisible();
  });

  test('본인 케이스 추가 플로우', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/personal');
    
    // 본인 케이스 추가 버튼 클릭
    await page.getByRole('button', { name: '본인 케이스 추가' }).click();
    
    // 새로운 케이스 카드가 나타나는지 확인
    // 시간을 좀 더 주고 기다림
    await page.waitForTimeout(1000);
    
    // 케이스 카드의 기본 요소들이 보이는지 확인
    await expect(page.getByText('Before')).toBeVisible();
    await expect(page.getByText('정면')).toBeVisible();
    await expect(page.getByText('좌측')).toBeVisible();
    await expect(page.getByText('우측')).toBeVisible();
  });

  test('사진 업로드 시뮬레이션', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/personal');
    
    // 본인 케이스 추가
    await page.getByRole('button', { name: '본인 케이스 추가' }).click();
    await page.waitForTimeout(1000);
    
    // 파일 input이 hidden이므로 JavaScript로 직접 조작
    await page.evaluate(() => {
      // 파일 업로드 이벤트 시뮬레이션
      const event = new Event('change', { bubbles: true });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        // Mock file 생성
        const dt = new DataTransfer();
        const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(event);
      }
    });
    
    // 업로드 관련 UI 변화 확인 (실제 업로드는 모킹되므로 에러 메시지나 상태 변화를 확인)
    await page.waitForTimeout(2000);
  });

  test('정보 메시지 표시 확인', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/personal');
    
    // 본인 케이스 추가
    await page.getByRole('button', { name: '본인 케이스 추가' }).click();
    await page.waitForTimeout(1000);
    
    // 제한 메시지가 표시되는지 확인
    await expect(page.getByText('본인 케이스는 1개만 생성할 수 있습니다')).toBeVisible();
  });

  test('네비게이션 확인', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/personal');
    
    // 본인 케이스 추가
    await page.getByRole('button', { name: '본인 케이스 추가' }).click();
    await page.waitForTimeout(1000);
    
    // 페이지 헤더의 네비게이션 링크들 확인
    await expect(page.getByText('임상사진')).toBeVisible();
    
    // 상위 페이지로 이동 테스트
    await page.getByRole('link', { name: '임상사진' }).first().click();
    await expect(page.url()).toContain('/clinical-photos');
  });

  test('반응형 디자인 확인', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE 크기
    
    await page.goto('/kol-new/clinical-photos/upload/personal');
    
    // 모바일에서도 기본 요소들이 보이는지 확인
    await expect(page.getByText('아직 본인 케이스가 없습니다')).toBeVisible();
    await expect(page.getByText('본인 케이스 추가')).toBeVisible();
    
    // 본인 케이스 추가
    await page.getByRole('button', { name: '본인 케이스 추가' }).click();
    await page.waitForTimeout(1000);
    
    // 모바일에서도 케이스 카드가 제대로 표시되는지 확인
    await expect(page.getByText('Before')).toBeVisible();
  });
}); 
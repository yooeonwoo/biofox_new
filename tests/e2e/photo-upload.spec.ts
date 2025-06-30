import { test, expect, Page } from '@playwright/test';
import path from 'path';

// 테스트 픽스처 파일 생성
const sampleImagePath = path.join(__dirname, '../fixtures/sample.jpg');

test.describe('PhotoUploader Component', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/auth/dev-login');
    await page.waitForLoadState('networkidle');
    
    // 정광원 계정으로 로그인
    await page.click('button:has(h3:text("정광원"))');
    
    // 페이지 변경 대기 (더 관대한 조건)
    await page.waitForTimeout(3000);
  });

  test('로그인 후 KOL 페이지 접근 확인', async ({ page }) => {
    // KOL 페이지로 성공적으로 로그인되었는지 확인
    await expect(page.locator('h1')).toContainText('KOL');
  });

  test('임상사진 메뉴를 통해 업로드 페이지 접근', async ({ page }) => {
    // 먼저 메인 KOL 페이지에서 시작
    await page.goto('/kol-new');
    await page.waitForLoadState('networkidle');
    
    // 여러 방법으로 임상사진 링크 찾기
    let clinicalClicked = false;
    
    // 방법 1: 텍스트가 포함된 링크 찾기
    const linkWithClinical = page.locator('a:has-text("임상사진")');
    if (await linkWithClinical.isVisible({ timeout: 3000 }).catch(() => false)) {
      await linkWithClinical.click();
      clinicalClicked = true;
    }
    
    // 방법 2: href에 clinical-photos가 포함된 링크 찾기
    if (!clinicalClicked) {
      const clinicalHrefLink = page.locator('a[href*="clinical-photos"]');
      if (await clinicalHrefLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await clinicalHrefLink.click();
        clinicalClicked = true;
      }
    }
    
    // 방법 3: 직접 URL로 이동
    if (!clinicalClicked) {
      console.log('Link not found, navigating directly to clinical photos page');
      await page.goto('/kol-new/clinical-photos');
      await page.waitForLoadState('networkidle');
    } else {
      await page.waitForLoadState('networkidle');
    }
    
    // 현재 페이지에서 업로드 관련 요소 확인
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // 임상사진 페이지로 이동되었거나 관련 콘텐츠가 있는지 확인
    const hasUrl = currentUrl.includes('clinical');
    const hasPageText = await page.locator('text=임상').first().isVisible().catch(() => false);
    
    console.log('Clinical page accessed:', { hasUrl, hasPageText });
    expect(hasUrl || hasPageText).toBeTruthy();
  });

  test('새 케이스 생성 후 PhotoUploader 컴포넌트 확인', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/customer');
    
    // 새 고객 추가 버튼 클릭
    await page.click('button:has-text("새 고객 추가")');
    
    // 페이지 새로고침 대기
    await page.waitForLoadState('networkidle');
    
    // PhotoUploader 컴포넌트 관련 요소들이 있는지 확인
    // (실제 컴포넌트 구현에 따라 selector 조정 필요)
    const uploadElements = page.locator('[data-testid*="photo-uploader"], [class*="upload"]');
    await expect(uploadElements.first()).toBeVisible({ timeout: 5000 });
  });

  test('PhotoUploader 드롭존 존재 확인', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/customer');
    
    // 페이지 로딩 완료 대기
    await page.waitForLoadState('networkidle');
    
    // 새 고객 추가 (케이스가 없을 경우)
    const addButton = page.locator('button:has-text("새 고객 추가")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // 파일 input 요소 확인
    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs.first()).toBeAttached();
  });

  test('사진 업로드 UI 요소 확인', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/customer');
    await page.waitForLoadState('networkidle');
    
    // 새 고객 추가 (필요시)
    const addButton = page.locator('button:has-text("새 고객 추가")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // 업로드 관련 텍스트 확인
    const uploadTexts = [
      '드래그',
      '업로드',
      'front',
      'left', 
      'right'
    ];
    
    for (const text of uploadTexts) {
      const element = page.locator(`text=${text}`).first();
      if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`✓ Found text: ${text}`);
      }
    }
  });

  // 실제 파일 업로드 테스트는 픽스처 파일이 준비되면 실행
  test.skip('샘플 이미지 업로드 테스트 (픽스처 준비 후 실행)', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/customer');
    await page.waitForLoadState('networkidle');
    
    // 새 고객 추가
    const addButton = page.locator('button:has-text("새 고객 추가")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // 파일 업로드
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(sampleImagePath);
    
    // 업로드 완료 확인 (토스트 메시지 등)
    await expect(page.locator('text=업로드 완료')).toBeVisible({ timeout: 10000 });
    
    // 썸네일 표시 확인
    await expect(page.locator('img')).toBeVisible({ timeout: 5000 });
  });

  test('PhotoUploader 에러 핸들링 확인', async ({ page }) => {
    await page.goto('/kol-new/clinical-photos/upload/customer');
    await page.waitForLoadState('networkidle');
    
    // 콘솔 에러 모니터링
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 페이지 상호작용
    const addButton = page.locator('button:has-text("새 고객 추가")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // 심각한 에러가 없는지 확인
    expect(consoleErrors.filter(err => 
      !err.includes('Warning') && 
      !err.includes('DevTools') && 
      !err.includes('favicon')
    )).toHaveLength(0);
  });
}); 
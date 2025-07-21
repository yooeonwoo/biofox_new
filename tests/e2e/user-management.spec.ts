import { test, expect, Page } from '@playwright/test';

test.describe('User Management E2E Tests', () => {
  let page: Page;

  // 테스트용 계정 정보 (실제 환경에 맞게 수정 필요)
  const adminCredentials = {
    email: 'admin@biofox.test',
    password: 'testpassword123'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Admin으로 로그인
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', adminCredentials.email);
    await page.fill('[data-testid="password-input"]', adminCredentials.password);
    await page.click('[data-testid="login-button"]');
    
    // 로그인 완료까지 대기
    await page.waitForURL('/biofox-admin/dashboard');
    
    // 사용자 관리 페이지로 이동
    await page.goto('/biofox-admin/users');
    await page.waitForLoadState('networkidle');
  });

  test.describe('User List Management', () => {
    test('should display user list with pagination', async () => {
      // 사용자 목록이 로드되는지 확인
      await expect(page.locator('[data-testid="user-table"]')).toBeVisible();
      
      // 테이블 헤더 확인
      await expect(page.locator('[data-testid="user-table"] thead')).toContainText(['이름', '이메일', '역할', '상태']);
      
      // 최소 1개 이상의 사용자 행이 있는지 확인
      const userRows = page.locator('[data-testid="user-row"]');
      await expect(userRows.first()).toBeVisible();
      
      // 페이지네이션 컴포넌트 확인
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    });

    test('should filter users by status', async () => {
      // 상태 필터 드롭다운 클릭
      await page.click('[data-testid="status-filter"]');
      
      // 'approved' 필터 선택
      await page.click('[data-testid="status-option-approved"]');
      
      // 필터링된 결과 확인
      await page.waitForTimeout(1000); // API 응답 대기
      
      const statusCells = page.locator('[data-testid="user-status"]');
      const count = await statusCells.count();
      
      if (count > 0) {
        // 모든 표시된 사용자가 'approved' 상태인지 확인
        for (let i = 0; i < count; i++) {
          await expect(statusCells.nth(i)).toContainText('승인됨');
        }
      }
    });

    test('should search users by name or email', async () => {
      // 검색 입력
      const searchTerm = 'test';
      await page.fill('[data-testid="search-input"]', searchTerm);
      await page.press('[data-testid="search-input"]', 'Enter');
      
      // 검색 결과 대기
      await page.waitForTimeout(1000);
      
      // 검색 결과에 검색어가 포함되어 있는지 확인
      const userRows = page.locator('[data-testid="user-row"]');
      const count = await userRows.count();
      
      if (count > 0) {
        // 첫 번째 결과에 검색어가 포함되어 있는지 확인
        const firstRow = userRows.first();
        const nameCell = firstRow.locator('[data-testid="user-name"]');
        const emailCell = firstRow.locator('[data-testid="user-email"]');
        
        const nameText = await nameCell.textContent();
        const emailText = await emailCell.textContent();
        
        expect(
          nameText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emailText?.toLowerCase().includes(searchTerm.toLowerCase())
        ).toBe(true);
      }
    });
  });

  test.describe('User Detail Modal', () => {
    test('should open user detail modal when clicking user row', async () => {
      // 첫 번째 사용자 행 클릭
      await page.click('[data-testid="user-row"]:first-child');
      
      // 사용자 상세 모달 열림 확인
      await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible();
      
      // 모달 탭들 확인
      await expect(page.locator('[data-testid="tab-basic-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-relationships"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-activity"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-stats"]')).toBeVisible();
      
      // 모달 닫기
      await page.click('[data-testid="close-modal-button"]');
      await expect(page.locator('[data-testid="user-detail-modal"]')).not.toBeVisible();
    });

    test('should switch between tabs in user detail modal', async () => {
      // 사용자 상세 모달 열기
      await page.click('[data-testid="user-row"]:first-child');
      await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible();
      
      // 관계 탭 클릭
      await page.click('[data-testid="tab-relationships"]');
      await expect(page.locator('[data-testid="relationships-content"]')).toBeVisible();
      
      // 활동 탭 클릭
      await page.click('[data-testid="tab-activity"]');
      await expect(page.locator('[data-testid="activity-content"]')).toBeVisible();
      
      // 통계 탭 클릭
      await page.click('[data-testid="tab-stats"]');
      await expect(page.locator('[data-testid="stats-content"]')).toBeVisible();
    });
  });

  test.describe('User Add Modal', () => {
    test('should open add user modal and create new user', async () => {
      // 사용자 추가 버튼 클릭
      await page.click('[data-testid="add-user-button"]');
      
      // 사용자 추가 모달 열림 확인
      await expect(page.locator('[data-testid="user-add-modal"]')).toBeVisible();
      
      // 폼 필드들 확인
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-select"]')).toBeVisible();
      
      // 테스트 사용자 정보 입력
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        name: `테스트 사용자 ${Date.now()}`,
        role: 'kol',
        shopName: '테스트 상점',
        region: '서울',
        commissionRate: '10'
      };
      
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="name-input"]', testUser.name);
      
      // 역할 선택
      await page.click('[data-testid="role-select"]');
      await page.click(`[data-testid="role-option-${testUser.role}"]`);
      
      // KOL인 경우 추가 필드 입력
      await page.fill('[data-testid="shop-name-input"]', testUser.shopName);
      await page.fill('[data-testid="region-input"]', testUser.region);
      await page.fill('[data-testid="commission-rate-input"]', testUser.commissionRate);
      
      // 저장 버튼 클릭
      await page.click('[data-testid="save-user-button"]');
      
      // 성공 토스트 메시지 확인
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('사용자가 성공적으로 추가되었습니다');
      
      // 모달 닫힘 확인
      await expect(page.locator('[data-testid="user-add-modal"]')).not.toBeVisible();
      
      // 새 사용자가 목록에 추가되었는지 확인 (이메일로 검색)
      await page.fill('[data-testid="search-input"]', testUser.email);
      await page.press('[data-testid="search-input"]', 'Enter');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('[data-testid="user-row"]')).toContainText(testUser.email);
    });

    test('should validate required fields in add user form', async () => {
      // 사용자 추가 모달 열기
      await page.click('[data-testid="add-user-button"]');
      await expect(page.locator('[data-testid="user-add-modal"]')).toBeVisible();
      
      // 빈 폼으로 저장 시도
      await page.click('[data-testid="save-user-button"]');
      
      // 검증 에러 메시지 확인
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-error"]')).toBeVisible();
      
      // 잘못된 이메일 형식 테스트
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="save-user-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('유효한 이메일 주소를 입력해주세요');
    });
  });

  test.describe('Bulk Actions', () => {
    test('should perform bulk approval action', async () => {
      // pending 상태 사용자들만 표시
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-option-pending"]');
      await page.waitForTimeout(1000);
      
      // 체크박스가 있는지 확인
      const checkboxes = page.locator('[data-testid="user-checkbox"]');
      const count = await checkboxes.count();
      
      if (count > 0) {
        // 첫 번째 사용자 선택
        await checkboxes.first().check();
        
        // 일괄 작업 버튼 활성화 확인
        await expect(page.locator('[data-testid="bulk-actions-dropdown"]')).toBeEnabled();
        
        // 일괄 승인 액션 선택
        await page.click('[data-testid="bulk-actions-dropdown"]');
        await page.click('[data-testid="bulk-action-approve"]');
        
        // 확인 다이얼로그
        await page.click('[data-testid="confirm-bulk-action"]');
        
        // 성공 메시지 확인
        await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-toast"]')).toContainText('승인 작업이 완료되었습니다');
      }
    });

    test('should perform bulk role change action', async () => {
      // 전체 사용자 표시
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-option-all"]');
      await page.waitForTimeout(1000);
      
      const checkboxes = page.locator('[data-testid="user-checkbox"]');
      const count = await checkboxes.count();
      
      if (count > 0) {
        // 첫 번째 사용자 선택
        await checkboxes.first().check();
        
        // 일괄 역할 변경 액션
        await page.click('[data-testid="bulk-actions-dropdown"]');
        await page.click('[data-testid="bulk-action-change-role"]');
        
        // 역할 선택 모달
        await expect(page.locator('[data-testid="role-change-modal"]')).toBeVisible();
        await page.click('[data-testid="role-option-ol"]');
        await page.click('[data-testid="confirm-role-change"]');
        
        // 성공 메시지 확인
        await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-toast"]')).toContainText('역할 변경 작업이 완료되었습니다');
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('should export users to CSV', async () => {
      // 내보내기 버튼 클릭
      await page.click('[data-testid="export-button"]');
      
      // 다운로드 시작 대기
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="confirm-export"]');
      
      const download = await downloadPromise;
      
      // 파일명 확인
      expect(download.suggestedFilename()).toMatch(/users_export_\d{4}-\d{2}-\d{2}_\d{4}\.csv/);
      
      // 파일 저장 (테스트용)
      await download.saveAs(`./test-exports/${download.suggestedFilename()}`);
    });

    test('should export filtered users', async () => {
      // 필터 적용
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-option-approved"]');
      await page.waitForTimeout(1000);
      
      // 역할 필터도 적용
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="role-option-kol"]');
      await page.waitForTimeout(1000);
      
      // 내보내기
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="confirm-export"]');
      
      const download = await downloadPromise;
      
      // 필터가 적용된 파일명 확인
      expect(download.suggestedFilename()).toMatch(/status-approved/);
      expect(download.suggestedFilename()).toMatch(/role-kol/);
    });
  });

  test.describe('User Edit and Delete', () => {
    test('should edit user information', async () => {
      // 첫 번째 사용자 상세 모달 열기
      await page.click('[data-testid="user-row"]:first-child');
      await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible();
      
      // 편집 버튼 클릭
      await page.click('[data-testid="edit-user-button"]');
      
      // 편집 모드 확인
      await expect(page.locator('[data-testid="name-edit-input"]')).toBeVisible();
      
      // 이름 수정
      const newName = `수정된 이름 ${Date.now()}`;
      await page.fill('[data-testid="name-edit-input"]', newName);
      
      // 저장
      await page.click('[data-testid="save-edit-button"]');
      
      // 성공 메시지 확인
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // 수정된 정보 확인
      await expect(page.locator('[data-testid="user-name-display"]')).toContainText(newName);
    });

    test('should delete user with confirmation', async () => {
      // 테스트용 사용자 생성 (삭제할 사용자)
      const testUserEmail = `delete-test-${Date.now()}@example.com`;
      
      // 사용자 추가
      await page.click('[data-testid="add-user-button"]');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="name-input"]', '삭제 테스트 사용자');
      await page.click('[data-testid="role-select"]');
      await page.click('[data-testid="role-option-ol"]');
      await page.click('[data-testid="save-user-button"]');
      
      // 성공 토스트 사라질 때까지 대기
      await page.waitForTimeout(2000);
      
      // 생성된 사용자 검색
      await page.fill('[data-testid="search-input"]', testUserEmail);
      await page.press('[data-testid="search-input"]', 'Enter');
      await page.waitForTimeout(1000);
      
      // 사용자 상세 모달 열기
      await page.click('[data-testid="user-row"]:first-child');
      await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible();
      
      // 삭제 버튼 클릭
      await page.click('[data-testid="delete-user-button"]');
      
      // 확인 다이얼로그
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
      await page.click('[data-testid="confirm-delete-button"]');
      
      // 성공 메시지 확인
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('사용자가 성공적으로 삭제되었습니다');
      
      // 모달 닫힘 확인
      await expect(page.locator('[data-testid="user-detail-modal"]')).not.toBeVisible();
      
      // 사용자가 목록에서 제거되었는지 확인
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="user-row"]')).not.toContainText(testUserEmail);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // 네트워크 차단
      await page.route('/api/users**', route => route.abort());
      
      // 페이지 새로고침
      await page.reload();
      
      // 에러 메시지 표시 확인
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('데이터를 불러오는 중 오류가 발생했습니다');
      
      // 재시도 버튼 확인
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle unauthorized access', async () => {
      // 로그아웃
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // 사용자 관리 페이지 직접 접근 시도
      await page.goto('/biofox-admin/users');
      
      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should load user list within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto('/biofox-admin/users');
      await page.waitForSelector('[data-testid="user-table"]');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // 5초 이내 로딩
    });

    test('should be accessible with keyboard navigation', async () => {
      // 탭 키로 네비게이션 테스트
      await page.keyboard.press('Tab'); // 첫 번째 포커스 가능한 요소
      await page.keyboard.press('Tab'); // 두 번째 요소
      
      // 현재 포커스된 요소 확인
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
      
      // Enter 키로 액션 트리거
      await page.keyboard.press('Enter');
      
      // 액션이 실행되었는지 확인 (모달이 열리거나 필터가 적용되는 등)
    });
  });
}); 
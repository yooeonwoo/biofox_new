import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserAddModal } from '../../components/biofox-admin/users/UserAddModal';

// Mock toast notifications
const mockToast = vi.fn();
vi.mock('react-hot-toast', () => ({
  toast: {
    success: mockToast,
    error: mockToast,
  },
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UserAddModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API response by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링 테스트', () => {
    it('모달이 열렸을 때 올바르게 렌더링되어야 함', () => {
      render(<UserAddModal {...defaultProps} />);

      expect(screen.getByText('사용자 추가')).toBeInTheDocument();
      expect(screen.getByLabelText('이메일')).toBeInTheDocument();
      expect(screen.getByLabelText('이름')).toBeInTheDocument();
      expect(screen.getByLabelText('역할')).toBeInTheDocument();
      expect(screen.getByText('취소')).toBeInTheDocument();
      expect(screen.getByText('추가')).toBeInTheDocument();
    });

    it('모달이 닫혔을 때 렌더링되지 않아야 함', () => {
             render(<UserAddModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('사용자 추가')).not.toBeInTheDocument();
    });

    it('초기 상태에서 모든 필드가 비어있어야 함', () => {
      render(<UserAddModal {...defaultProps} />);

      expect(screen.getByLabelText('이메일')).toHaveValue('');
      expect(screen.getByLabelText('이름')).toHaveValue('');
    });
  });

  describe('폼 검증 테스트', () => {
    it('필수 필드가 비어있을 때 검증 오류가 표시되어야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      const submitButton = screen.getByText('추가');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('이메일은 필수입니다')).toBeInTheDocument();
        expect(screen.getByText('이름은 필수입니다')).toBeInTheDocument();
        expect(screen.getByText('역할을 선택해주세요')).toBeInTheDocument();
      });
    });

    it('잘못된 이메일 형식에 대해 오류가 표시되어야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      const emailInput = screen.getByLabelText('이메일');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByText('추가');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('유효한 이메일 주소를 입력해주세요')).toBeInTheDocument();
      });
    });

    it('이름이 2글자 미만일 때 오류가 표시되어야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('이름');
      await user.type(nameInput, 'A');

      const submitButton = screen.getByText('추가');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('이름은 최소 2글자 이상이어야 합니다')).toBeInTheDocument();
      });
    });
  });

  describe('역할별 조건부 필드 테스트', () => {
    it('KOL 역할 선택 시 추가 필드들이 표시되어야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      // 역할 select 요소 찾기 및 KOL 선택
      const roleSelect = screen.getByLabelText('역할');
      await user.selectOptions(roleSelect, 'kol');

      await waitFor(() => {
        expect(screen.getByLabelText('상점명')).toBeInTheDocument();
        expect(screen.getByLabelText('지역')).toBeInTheDocument();
        expect(screen.getByLabelText('수수료율 (%)')).toBeInTheDocument();
      });
    });

    it('OL 역할 선택 시 상점명과 지역 필드만 표시되어야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      const roleSelect = screen.getByLabelText('역할');
      await user.selectOptions(roleSelect, 'ol');

      await waitFor(() => {
        expect(screen.getByLabelText('상점명')).toBeInTheDocument();
        expect(screen.getByLabelText('지역')).toBeInTheDocument();
        expect(screen.queryByLabelText('수수료율 (%)')).not.toBeInTheDocument();
      });
    });

    it('Shop Owner 역할 선택 시 상점명과 지역 필드만 표시되어야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      const roleSelect = screen.getByLabelText('역할');
      await user.selectOptions(roleSelect, 'shop_owner');

      await waitFor(() => {
        expect(screen.getByLabelText('상점명')).toBeInTheDocument();
        expect(screen.getByLabelText('지역')).toBeInTheDocument();
        expect(screen.queryByLabelText('수수료율 (%)')).not.toBeInTheDocument();
      });
    });

    it('Admin 역할 선택 시 추가 필드들이 표시되지 않아야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      const roleSelect = screen.getByLabelText('역할');
      await user.selectOptions(roleSelect, 'admin');

      await waitFor(() => {
        expect(screen.queryByLabelText('상점명')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('지역')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('수수료율 (%)')).not.toBeInTheDocument();
      });
    });
  });

  describe('폼 제출 테스트', () => {
    it('유효한 데이터로 폼 제출이 성공해야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      // 폼 데이터 입력
      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('이름'), '테스트 사용자');
      await user.selectOptions(screen.getByLabelText('역할'), 'kol');
      await user.type(screen.getByLabelText('상점명'), '테스트 상점');
      await user.type(screen.getByLabelText('지역'), '서울');
      await user.type(screen.getByLabelText('수수료율 (%)'), '10');

      // 폼 제출
      const submitButton = screen.getByText('추가');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            name: '테스트 사용자',
            role: 'kol',
            shop_name: '테스트 상점',
            region: '서울',
            commission_rate: 10,
          }),
        });
      });

      expect(mockToast).toHaveBeenCalledWith('사용자가 성공적으로 추가되었습니다');
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('API 오류 시 에러 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup();
      
      // API 에러 응답 모킹
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: '이미 존재하는 이메일입니다',
        }),
      });

      render(<UserAddModal {...defaultProps} />);

      // 유효한 데이터 입력
      await user.type(screen.getByLabelText('이메일'), 'existing@example.com');
      await user.type(screen.getByLabelText('이름'), '테스트 사용자');
      await user.selectOptions(screen.getByLabelText('역할'), 'ol');

      // 폼 제출
      const submitButton = screen.getByText('추가');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('이미 존재하는 이메일입니다');
      });

      // 모달이 닫히지 않아야 함
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('네트워크 오류 시 기본 에러 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup();
      
      // 네트워크 에러 모킹
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<UserAddModal {...defaultProps} />);

      // 유효한 데이터 입력
      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('이름'), '테스트 사용자');
      await user.selectOptions(screen.getByLabelText('역할'), 'admin');

      // 폼 제출
      const submitButton = screen.getByText('추가');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('사용자 추가 중 오류가 발생했습니다');
      });
    });
  });

  describe('사용자 상호작용 테스트', () => {
    it('취소 버튼 클릭 시 모달이 닫혀야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      const cancelButton = screen.getByText('취소');
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('ESC 키 누를 시 모달이 닫혀야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('모달 외부 클릭 시 모달이 닫혀야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      // 모달 외부 영역 클릭 (overlay)
      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        await user.click(overlay);
      }

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('로딩 상태 테스트', () => {
    it('폼 제출 중 로딩 상태가 표시되어야 함', async () => {
      const user = userEvent.setup();
      
      // API 응답을 지연시켜 로딩 상태 테스트
      mockFetch.mockImplementationOnce(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: {} }),
            });
          }, 100);
        })
      );

      render(<UserAddModal {...defaultProps} />);

      // 유효한 데이터 입력
      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('이름'), '테스트 사용자');
      await user.selectOptions(screen.getByLabelText('역할'), 'admin');

      // 폼 제출
      const submitButton = screen.getByText('추가');
      await user.click(submitButton);

      // 로딩 상태 확인
      expect(screen.getByText('추가 중...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // 로딩 완료 대기
      await waitFor(() => {
        expect(screen.queryByText('추가 중...')).not.toBeInTheDocument();
      });
    });

    it('로딩 중에는 취소 버튼이 비활성화되어야 함', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockImplementationOnce(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: {} }),
            });
          }, 100);
        })
      );

      render(<UserAddModal {...defaultProps} />);

      // 유효한 데이터 입력 및 제출
      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('이름'), '테스트 사용자');
      await user.selectOptions(screen.getByLabelText('역할'), 'admin');
      await user.click(screen.getByText('추가'));

      // 취소 버튼 비활성화 확인
      expect(screen.getByText('취소')).toBeDisabled();

      // 완료 후 다시 활성화
      await waitFor(() => {
        expect(screen.queryByText('취소')).not.toBeInTheDocument();
      });
    });
  });

  describe('접근성 테스트', () => {
    it('적절한 ARIA 레이블이 설정되어야 함', () => {
      render(<UserAddModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
    });

    it('필수 필드가 aria-required로 표시되어야 함', () => {
      render(<UserAddModal {...defaultProps} />);

      expect(screen.getByLabelText('이메일')).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText('이름')).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText('역할')).toHaveAttribute('aria-required', 'true');
    });

    it('에러 상태가 aria-invalid로 표시되어야 함', async () => {
      const user = userEvent.setup();
      render(<UserAddModal {...defaultProps} />);

      const submitButton = screen.getByText('추가');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText('이메일')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('이름')).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
}); 
/**
 * CaseStatusTabs 컴포넌트 단위 테스트
 *
 * 이 테스트는 케이스 상태 탭 컴포넌트의 핵심 기능들을 검증합니다:
 * 1. 올바른 렌더링
 * 2. 상태 변경 이벤트 처리
 * 3. 스타일링 및 접근성
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CaseStatusTabs from '../components/CaseStatusTabs';

describe('CaseStatusTabs', () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기본 탭들을 올바르게 렌더링해야 함', () => {
    render(<CaseStatusTabs status="active" onStatusChange={mockOnStatusChange} />);

    expect(screen.getByText('진행중')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('현재 상태가 올바르게 활성화되어야 함', () => {
    render(<CaseStatusTabs status="active" onStatusChange={mockOnStatusChange} />);

    const activeButton = screen.getByText('진행중');
    const completedButton = screen.getByText('완료');

    // 활성 상태인 버튼은 특별한 스타일을 가져야 함
    expect(activeButton).toHaveClass('bg-white', 'text-biofox-dark-blue-violet');
    expect(completedButton).not.toHaveClass('bg-white');
  });

  it('완료 상태가 선택되었을 때 올바르게 표시되어야 함', () => {
    render(<CaseStatusTabs status="completed" onStatusChange={mockOnStatusChange} />);

    const activeButton = screen.getByText('진행중');
    const completedButton = screen.getByText('완료');

    expect(completedButton).toHaveClass('bg-white', 'text-biofox-dark-blue-violet');
    expect(activeButton).not.toHaveClass('bg-white');
  });

  it('진행중 탭 클릭 시 onStatusChange가 호출되어야 함', () => {
    render(<CaseStatusTabs status="completed" onStatusChange={mockOnStatusChange} />);

    const activeButton = screen.getByText('진행중');
    fireEvent.click(activeButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('active');
    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
  });

  it('완료 탭 클릭 시 onStatusChange가 호출되어야 함', () => {
    render(<CaseStatusTabs status="active" onStatusChange={mockOnStatusChange} />);

    const completedButton = screen.getByText('완료');
    fireEvent.click(completedButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('completed');
    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
  });

  it('같은 상태를 다시 클릭해도 onStatusChange가 호출되어야 함', () => {
    render(<CaseStatusTabs status="active" onStatusChange={mockOnStatusChange} />);

    const activeButton = screen.getByText('진행중');
    fireEvent.click(activeButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('active');
    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
  });

  it('커스텀 className이 적용되어야 함', () => {
    render(
      <CaseStatusTabs
        status="active"
        onStatusChange={mockOnStatusChange}
        className="custom-class"
      />
    );

    const container = screen.getByText('진행중').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('키보드 접근성을 지원해야 함 (button 요소)', () => {
    render(<CaseStatusTabs status="active" onStatusChange={mockOnStatusChange} />);

    const activeButton = screen.getByText('진행중');
    const completedButton = screen.getByText('완료');

    expect(activeButton.tagName).toBe('BUTTON');
    expect(completedButton.tagName).toBe('BUTTON');
  });

  it('호버 상태에서 스타일이 적용되어야 함', () => {
    render(<CaseStatusTabs status="active" onStatusChange={mockOnStatusChange} />);

    const completedButton = screen.getByText('완료');

    // 비활성 상태에서는 hover 클래스를 가져야 함
    expect(completedButton).toHaveClass('hover:text-gray-800');
  });

  it('전환 애니메이션 클래스가 적용되어야 함', () => {
    render(<CaseStatusTabs status="active" onStatusChange={mockOnStatusChange} />);

    const activeButton = screen.getByText('진행중');
    const completedButton = screen.getByText('완료');

    expect(activeButton).toHaveClass('transition-all', 'duration-150');
    expect(completedButton).toHaveClass('transition-all', 'duration-150');
  });
});

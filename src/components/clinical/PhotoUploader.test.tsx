import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PhotoUploader } from './PhotoUploader';
import { toast } from 'sonner';
import * as ClinicalHooks from '@/src/hooks/useClinicalCases';
import * as SerialQueue from '@/src/hooks/useSerialQueue';
import * as FileUtils from '@/src/utils/file';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/src/hooks/useClinicalCases', () => ({
  useUploadPhoto: () => ({
    mutateAsync: vi.fn().mockResolvedValue('uploaded-url'),
  }),
}));

vi.mock('@/src/hooks/useSerialQueue', () => ({
  useCaseSerialQueues: () => ({
    enqueueForCase: vi.fn((caseId, taskId, task) => {
      // 즉시 실행하여 테스트 단순화
      task();
    }),
  }),
}));

vi.mock('@/src/utils/file', () => ({
  isImage: vi.fn((file: File) => file.type.startsWith('image/')),
  getFileSizeMB: vi.fn((file: File) => (file.size / 1024 / 1024).toFixed(2)),
}));

// Test wrapper with QueryClient
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('PhotoUploader', () => {
  const defaultProps = {
    caseId: '123',
    roundId: '1',
    angle: 'front' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('컴포넌트가 정상적으로 렌더링된다', () => {
    render(
      <TestWrapper>
        <PhotoUploader {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('front 방향 사진 업로드')).toBeInTheDocument();
    expect(screen.getByText('이미지를 드래그하거나 클릭하여 선택하세요')).toBeInTheDocument();
    expect(screen.getByText('파일 선택')).toBeInTheDocument();
  });

  it('이미지 파일 드롭 시 업로드가 실행된다', async () => {
    const onUploaded = vi.fn();
    const mockUpload = vi.fn().mockResolvedValue('success');
    
    vi.spyOn(ClinicalHooks, 'useUploadPhoto').mockReturnValue({
      mutateAsync: mockUpload,
    } as any);

    render(
      <TestWrapper>
        <PhotoUploader {...defaultProps} onUploaded={onUploaded} />
      </TestWrapper>
    );

    // 이미지 파일 생성
    const imageFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    
    // 드롭 영역 찾기
    const dropZone = screen.getByText('front 방향 사진 업로드').closest('div');
    
    // 파일 드롭 시뮬레이션
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [imageFile],
      },
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith({
        caseId: 123,
        roundNumber: 1,
        angle: 'front',
        file: imageFile,
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('front 방향 사진이 업로드되었습니다.');
    });

    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalled();
    });
  });

  it('비 이미지 파일 업로드 시 에러 토스트가 표시된다', async () => {
    render(
      <TestWrapper>
        <PhotoUploader {...defaultProps} />
      </TestWrapper>
    );

    // 텍스트 파일 생성
    const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    // isImage를 false 반환하도록 mock
    vi.spyOn(FileUtils, 'isImage').mockReturnValue(false);

    const dropZone = screen.getByText('front 방향 사진 업로드').closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [textFile],
      },
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('이미지 파일만 업로드 가능합니다.');
    });
  });

  it('큰 파일 업로드 시 에러 토스트가 표시된다', async () => {
    render(
      <TestWrapper>
        <PhotoUploader {...defaultProps} maxSizeMB={5} />
      </TestWrapper>
    );

    // 큰 이미지 파일 생성
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    // 파일이 이미지임을 확인하도록 mock
    vi.spyOn(FileUtils, 'isImage').mockReturnValue(true);
    // getFileSizeMB를 큰 값 반환하도록 mock
    vi.spyOn(FileUtils, 'getFileSizeMB').mockReturnValue('10.00');

    const dropZone = screen.getByText('front 방향 사진 업로드').closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [largeFile],
      },
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('파일 크기는 5MB 이하여야 합니다.');
    });
  });

  it('파일 선택 버튼을 클릭하면 파일 다이얼로그가 열린다', () => {
    render(
      <TestWrapper>
        <PhotoUploader {...defaultProps} />
      </TestWrapper>
    );

    const fileInput = screen.getByLabelText('front 방향 사진 파일 선택');
    const clickSpy = vi.spyOn(fileInput, 'click');

    const selectButton = screen.getByText('파일 선택');
    fireEvent.click(selectButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('disabled 상태에서는 업로드가 비활성화된다', () => {
    render(
      <TestWrapper>
        <PhotoUploader {...defaultProps} disabled={true} />
      </TestWrapper>
    );

    expect(screen.getByText('업로드가 비활성화되었습니다')).toBeInTheDocument();
    
    const fileInput = screen.getByLabelText('front 방향 사진 파일 선택');
    expect(fileInput).toBeDisabled();
  });

  it('업로드 실패 시 에러 토스트가 표시된다', async () => {
    const mockUpload = vi.fn().mockRejectedValue(new Error('Upload failed'));
    
    vi.spyOn(ClinicalHooks, 'useUploadPhoto').mockReturnValue({
      mutateAsync: mockUpload,
    } as any);

    render(
      <TestWrapper>
        <PhotoUploader {...defaultProps} />
      </TestWrapper>
    );

    const imageFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    
    // 파일이 이미지임을 확인하도록 mock
    vi.spyOn(FileUtils, 'isImage').mockReturnValue(true);
    vi.spyOn(FileUtils, 'getFileSizeMB').mockReturnValue('1.00');
    
    const dropZone = screen.getByText('front 방향 사진 업로드').closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [imageFile],
      },
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('사진 업로드에 실패했습니다.');
    });
  });
}); 
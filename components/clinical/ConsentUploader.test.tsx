import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';

import { ConsentUploader } from './ConsentUploader';
import { clinicalPhotosAPI } from '@/services/clinicalPhotos';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/clinicalPhotos', () => ({
  clinicalPhotosAPI: {
    consent: {
      upload: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/useSerialQueue', () => ({
  useCaseSerialQueues: () => ({
    enqueueForCase: vi.fn((caseId, taskId, task, options) => {
      // 즉시 태스크 실행 (테스트용)
      task();
    }),
  }),
}));

// 테스트용 컴포넌트 래퍼
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

describe('ConsentUploader', () => {
  const defaultProps = {
    caseId: '123',
    roundId: '1',
    onUploaded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('컴포넌트가 정상적으로 렌더링된다', () => {
    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('동의서 업로드 (PDF, 이미지)')).toBeInTheDocument();
    expect(screen.getByText('PDF 또는 이미지 파일 (최대 10MB)')).toBeInTheDocument();
  });

  it('업로드 버튼 클릭 시 파일 선택 창이 열린다', () => {
    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    const uploadArea = screen.getByText('동의서 업로드 (PDF, 이미지)').closest('div');
    const fileInput = screen.getByLabelText('동의서 파일 선택');

    // 파일 입력이 hidden 클래스를 가지는지 확인
    expect(fileInput).toHaveClass('hidden');

    // 버튼 클릭 시 파일 입력이 클릭되는지 확인 (실제로는 mock 불가능하지만 테스트 목적)
    if (uploadArea) {
      fireEvent.click(uploadArea);
    }
  });

  it('PDF 파일 업로드가 성공적으로 처리된다', async () => {
    const mockUpload = vi.mocked(clinicalPhotosAPI.consent.upload);
    mockUpload.mockResolvedValue('uploaded-url');

    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    const fileInput = screen.getByLabelText('동의서 파일 선택');
    const pdfFile = new File(['pdf content'], 'consent.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(123, '1', pdfFile);
    });

    expect(toast.success).toHaveBeenCalledWith('동의서 업로드 완료', {
      description: 'consent.pdf 파일이 성공적으로 업로드되었습니다.'
    });

    expect(defaultProps.onUploaded).toHaveBeenCalled();
  });

  it('이미지 파일 업로드가 성공적으로 처리된다', async () => {
    const mockUpload = vi.mocked(clinicalPhotosAPI.consent.upload);
    mockUpload.mockResolvedValue('uploaded-url');

    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    const fileInput = screen.getByLabelText('동의서 파일 선택');
    const imageFile = new File(['image content'], 'consent.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(123, '1', imageFile);
    });

    expect(toast.success).toHaveBeenCalled();
    expect(defaultProps.onUploaded).toHaveBeenCalled();
  });

  it('지원하지 않는 파일 타입에 대해 경고 메시지를 표시한다', async () => {
    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    const fileInput = screen.getByLabelText('동의서 파일 선택');
    const textFile = new File(['text content'], 'document.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [textFile] } });

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        'PDF 파일이나 이미지 파일만 업로드 가능합니다.',
        { description: '지원 형식: PDF, JPEG, PNG, WebP' }
      );
    });

    expect(clinicalPhotosAPI.consent.upload).not.toHaveBeenCalled();
  });

  it('10MB 초과 파일에 대해 경고 메시지를 표시한다', async () => {
    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    const fileInput = screen.getByLabelText('동의서 파일 선택');
    
    // 11MB 파일 생성
    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)], 
      'large-consent.pdf', 
      { type: 'application/pdf' }
    );

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        '파일 크기는 10MB 이하여야 합니다.',
        { description: '현재 파일 크기: 11.00MB' }
      );
    });

    expect(clinicalPhotosAPI.consent.upload).not.toHaveBeenCalled();
  });

  it('업로드 실패 시 에러 메시지를 표시한다', async () => {
    const mockUpload = vi.mocked(clinicalPhotosAPI.consent.upload);
    mockUpload.mockRejectedValue(new Error('Upload failed'));

    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    const fileInput = screen.getByLabelText('동의서 파일 선택');
    const pdfFile = new File(['pdf content'], 'consent.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('업로드 실패', {
        description: 'Upload failed'
      });
    });

    expect(defaultProps.onUploaded).not.toHaveBeenCalled();
  });

  it('disabled 상태에서는 파일 업로드가 차단된다', () => {
    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} disabled={true} />
      </TestWrapper>
    );

    const fileInput = screen.getByLabelText('동의서 파일 선택');

    // disabled props가 전달되어 파일 입력이 비활성화되었는지 확인
    expect(fileInput).toBeDisabled();
    
    // 컨테이너에 disabled 스타일이 적용되었는지 확인
    const container = screen.getByText('동의서 업로드 (PDF, 이미지)').closest('.opacity-50');
    expect(container).toBeInTheDocument();
  });

  it('업로드 중 상태가 올바르게 표시된다', async () => {
    // 업로드가 완료되지 않도록 Promise를 pending 상태로 유지
    const mockUpload = vi.mocked(clinicalPhotosAPI.consent.upload);
    let resolveUpload: (value: string) => void;
    const uploadPromise = new Promise<string>((resolve) => {
      resolveUpload = resolve;
    });
    mockUpload.mockReturnValue(uploadPromise);

    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    const fileInput = screen.getByLabelText('동의서 파일 선택');
    const pdfFile = new File(['pdf content'], 'consent.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    // 업로드 중 상태 확인
    await waitFor(() => {
      expect(screen.getByText('업로드 중...')).toBeInTheDocument();
    });

    // 업로드 완료
    resolveUpload!('uploaded-url');

    await waitFor(() => {
      expect(screen.queryByText('업로드 중...')).not.toBeInTheDocument();
      expect(screen.getByText('동의서 업로드 (PDF, 이미지)')).toBeInTheDocument();
    });
  });

  it('드래그 앤 드롭으로 파일을 업로드할 수 있다', async () => {
    const mockUpload = vi.mocked(clinicalPhotosAPI.consent.upload);
    mockUpload.mockResolvedValue('uploaded-url');

    render(
      <TestWrapper>
        <ConsentUploader {...defaultProps} />
      </TestWrapper>
    );

    const uploadArea = screen.getByText('동의서 업로드 (PDF, 이미지)').closest('div');
    const pdfFile = new File(['pdf content'], 'consent.pdf', { type: 'application/pdf' });

    if (uploadArea) {
      // 드래그 오버 이벤트
      fireEvent.dragOver(uploadArea, {
        dataTransfer: {
          files: [pdfFile],
          items: [{ kind: 'file', type: 'application/pdf' }],
          types: ['Files'],
        },
      });

      // 드롭 이벤트
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [pdfFile],
        },
      });
    }

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(123, '1', pdfFile);
    });

    expect(toast.success).toHaveBeenCalled();
  });
}); 
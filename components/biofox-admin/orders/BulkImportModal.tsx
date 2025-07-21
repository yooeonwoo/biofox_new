'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Download,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportOptions {
  date_column: string;
  shop_identifier_column: string;
  amount_column: string;
  product_column?: string;
  quantity_column?: string;
  order_number_column?: string;
  skip_first_row: boolean;
  date_format: string;
}

interface ImportResult {
  success: boolean;
  summary: {
    total_rows: number;
    success_count: number;
    error_count: number;
    total_amount: number;
    total_commission: number;
    preview?: Array<{
      shop_name: string;
      order_date: string;
      total_amount: number;
      commission_amount: number;
    }>;
    errors?: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  };
}

export function BulkImportModal({ open, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [options, setOptions] = useState<ImportOptions>({
    date_column: '',
    shop_identifier_column: '',
    amount_column: '',
    product_column: '',
    quantity_column: '',
    order_number_column: '',
    skip_first_row: false,
    date_format: 'YYYY-MM-DD'
  });
  const [step, setStep] = useState<'upload' | 'mapping' | 'processing' | 'result'>('upload');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = useCallback((e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    let selectedFile: File | null = null;
    
    if ('dataTransfer' in e) {
      selectedFile = e.dataTransfer.files[0];
    } else if (e.target.files) {
      selectedFile = e.target.files[0];
    }

    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      
      // 파일 읽기
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFileContent(content);
        
        // 헤더 추출
        const lines = content.split('\n');
        if (lines.length > 0) {
          const headerLine = lines[0];
          const headers = headerLine.split(',').map(h => h.trim());
          setHeaders(headers);
          setStep('mapping');
        }
      };
      reader.readAsText(selectedFile);
    } else {
      alert('CSV 파일만 업로드 가능합니다.');
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    if (!file || !fileContent) return;

    // 필수 컬럼 확인
    if (!options.date_column || !options.shop_identifier_column || !options.amount_column) {
      alert('필수 컬럼을 모두 선택해주세요.');
      return;
    }

    setProcessing(true);
    setStep('processing');

    try {
      // Base64 인코딩
      const base64Content = btoa(unescape(encodeURIComponent(fileContent)));

      const response = await fetch('/api/orders/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_type: 'csv',
          data: base64Content,
          options
        })
      });

      const data = await response.json();
      setResult(data);
      setStep('result');

      if (data.success && data.summary.success_count > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('일괄 등록 오류:', error);
      alert('일괄 등록 중 오류가 발생했습니다.');
      setStep('mapping');
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'date,shop_email,amount,product,quantity,order_number\n2024-01-01,shop@example.com,100000,제품명,1,ORD-001';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadErrors = () => {
    if (!result?.summary.errors) return;

    const csv = ['행,오류,데이터'];
    result.summary.errors.forEach(error => {
      csv.push(`${error.row},"${error.error}","${JSON.stringify(error.data)}"`);
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setFileContent('');
    setHeaders([]);
    setOptions({
      date_column: '',
      shop_identifier_column: '',
      amount_column: '',
      product_column: '',
      quantity_column: '',
      order_number_column: '',
      skip_first_row: false,
      date_format: 'YYYY-MM-DD'
    });
    setStep('upload');
    setResult(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>주문 일괄 등록</DialogTitle>
          <DialogDescription>
            CSV 파일을 업로드하여 여러 주문을 한 번에 등록할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
                "hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800",
                "transition-colors"
              )}
              onDrop={handleFileSelect}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                CSV 파일을 드래그하거나 클릭하여 선택하세요
              </p>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                템플릿 다운로드
              </Button>
              <Alert className="flex-1 ml-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  UTF-8 인코딩된 CSV 파일만 지원됩니다.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                파일: {file?.name} ({headers.length}개 컬럼)
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>날짜 컬럼 *</Label>
                  <Select
                    value={options.date_column}
                    onValueChange={(value) => setOptions({ ...options, date_column: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>날짜 형식</Label>
                  <Select
                    value={options.date_format}
                    onValueChange={(value) => setOptions({ ...options, date_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shop 식별자 컬럼 * (이메일 또는 샵명)</Label>
                <Select
                  value={options.shop_identifier_column}
                  onValueChange={(value) => setOptions({ ...options, shop_identifier_column: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>금액 컬럼 *</Label>
                <Select
                  value={options.amount_column}
                  onValueChange={(value) => setOptions({ ...options, amount_column: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>제품명 컬럼 (선택)</Label>
                  <Select
                    value={options.product_column}
                    onValueChange={(value) => setOptions({ ...options, product_column: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">없음</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>수량 컬럼 (선택)</Label>
                  <Select
                    value={options.quantity_column}
                    onValueChange={(value) => setOptions({ ...options, quantity_column: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">없음</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">처리 중...</p>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{result.summary.success_count}</p>
                      <p className="text-sm text-gray-500">성공</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">{result.summary.error_count}</p>
                      <p className="text-sm text-gray-500">실패</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.summary.success_count > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  총 {formatCurrency(result.summary.total_amount)} 매출,{' '}
                  {formatCurrency(result.summary.total_commission)} 수수료가 등록되었습니다.
                </AlertDescription>
              </Alert>
            )}

            {result.summary.error_count > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.summary.error_count}개의 주문 등록에 실패했습니다.
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2"
                    onClick={downloadErrors}
                  >
                    오류 내역 다운로드
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {result.summary.preview && result.summary.preview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">등록된 주문 미리보기</h4>
                <div className="space-y-1">
                  {result.summary.preview.map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      {item.shop_name} - {item.order_date} - {formatCurrency(item.total_amount)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
          )}

          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={reset}>
                다시 선택
              </Button>
              <Button onClick={handleImport} disabled={processing}>
                등록 시작
              </Button>
            </>
          )}

          {step === 'result' && (
            <>
              <Button variant="outline" onClick={reset}>
                새 파일 등록
              </Button>
              <Button onClick={onClose}>
                완료
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Card 컴포넌트가 없으므로 간단히 구현
function Card({ children }: { children: React.ReactNode }) {
  return <div className="border rounded-lg">{children}</div>;
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

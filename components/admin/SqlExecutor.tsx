'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * SQL 실행 결과를 표시하는 컴포넌트
 */
const ResultDisplay = ({ result }: { result: any }) => {
  if (!result) return null;

  return (
    <div className="mt-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900 overflow-auto">
      <h3 className="text-lg font-medium mb-2">실행 결과</h3>
      <pre className="text-sm whitespace-pre-wrap">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
};

/**
 * SQL 쿼리를 실행할 수 있는 컴포넌트
 */
export default function SqlExecutor() {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!query.trim()) {
      setError('SQL 쿼리를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '쿼리 실행 중 오류가 발생했습니다.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>SQL 쿼리 실행</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="SQL 쿼리를 입력하세요..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[200px] font-mono"
        />
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        
        <ResultDisplay result={result} />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleExecute} 
          disabled={loading || !query.trim()}
          className="w-full"
        >
          {loading ? '실행 중...' : '쿼리 실행'}
        </Button>
      </CardFooter>
    </Card>
  );
} 
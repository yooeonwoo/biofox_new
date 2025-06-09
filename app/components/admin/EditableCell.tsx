'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditableCellProps {
  value: string | null;
  onSave: (newValue: string) => Promise<void>;
  type?: 'text' | 'email' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EditableCell({
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder = '',
  disabled = false,
  className = ''
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    if (disabled) return;
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue(value || '');
    setError(null);
  };

  const handleSave = async () => {
    if (editValue.trim() === (value || '').trim()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('저장 실패:', err);
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const displayValue = value || placeholder || '-';

  if (!isEditing) {
    return (
      <div 
        className={`
          cursor-pointer hover:bg-gray-50 px-2 py-1 rounded min-h-[36px] flex items-center
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${error ? 'border border-red-300 bg-red-50' : ''}
          ${className}
        `}
        onClick={startEditing}
        title={disabled ? '편집할 수 없습니다' : '클릭하여 편집'}
      >
        <span className={`${!value ? 'text-gray-400' : ''}`}>
          {displayValue}
        </span>
        {error && (
          <span className="ml-2 text-xs text-red-500" title={error}>
            ⚠️
          </span>
        )}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={editValue}
          onValueChange={setEditValue}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3 text-green-600" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelEditing}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder={placeholder}
        disabled={isLoading}
        className="h-8"
      />
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-green-600" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={cancelEditing}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    </div>
  );
}
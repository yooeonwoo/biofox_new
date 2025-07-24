'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, UserCheck, Trash2, UserX, Users, Shield } from 'lucide-react';

interface BulkActionButtonProps {
  action: 'approve' | 'reject' | 'delete' | 'activate' | 'deactivate' | 'change_role';
  count: number;
  onClick: () => void;
  disabled?: boolean;
}

const actionConfig = {
  approve: {
    label: '승인',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-green-600 hover:bg-green-700',
  },
  reject: {
    label: '거절',
    icon: XCircle,
    variant: 'destructive' as const,
    className: undefined,
  },
  delete: {
    label: '삭제',
    icon: Trash2,
    variant: 'destructive' as const,
    className: undefined,
  },
  activate: {
    label: '활성화',
    icon: UserCheck,
    variant: 'default' as const,
    className: 'bg-blue-600 hover:bg-blue-700',
  },
  deactivate: {
    label: '비활성화',
    icon: UserX,
    variant: 'secondary' as const,
    className: undefined,
  },
  change_role: {
    label: '역할 변경',
    icon: Shield,
    variant: 'outline' as const,
    className: undefined,
  },
};

export function BulkActionButton({
  action,
  count,
  onClick,
  disabled = false,
}: BulkActionButtonProps) {
  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <Button
      variant={config.variant}
      size="sm"
      onClick={onClick}
      disabled={disabled || count === 0}
      className={config.className}
    >
      <Icon className="mr-2 h-4 w-4" />
      {config.label} ({count})
    </Button>
  );
}

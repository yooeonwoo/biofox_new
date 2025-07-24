'use client';

import { useAdminNewKols } from '@/lib/hooks/adminNewKols-convex';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function KolSidebar({ selectedId, onSelect }: Props) {
  const { data = [], isLoading, isError } = useAdminNewKols();

  return (
    <aside className="w-48 overflow-y-auto border-r bg-white">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : isError ? (
        <div className="p-2 text-sm text-destructive">로드 실패</div>
      ) : (
        <ul className="space-y-1 p-2">
          {data.map(k => (
            <li key={k.id}>
              <Button
                variant={k.id === selectedId ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => onSelect(k.id)}
              >
                {k.name}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

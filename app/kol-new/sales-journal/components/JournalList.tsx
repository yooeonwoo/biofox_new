import { JournalEntryData } from "../lib/types";
import JournalCard from "./JournalCard";

interface Props {
  entries: JournalEntryData[];
  managedShops: string[];
  shopSpecialNotes: Record<string, string>;
  onUpdate: (id: string, content: string, shopName: string) => void;
  onDelete: (id: string) => void;
  onAddShop: (newShop: string) => void;
}

export default function JournalList({ 
    entries, 
    managedShops,
    shopSpecialNotes,
    onUpdate,
    onDelete,
    onAddShop
}: Props) {

  // 날짜별로 그룹화
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, JournalEntryData[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (entries.length === 0) {
    // '새 글 추가' 폼이 보이지 않을 때만 빈 상태 메시지를 표시합니다.
    return null;
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* 날짜 구분선 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="text-muted-foreground font-medium">{formatDate(date)}</div>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          
          {/* 해당 날짜의 일지들 */}
          <div className="space-y-4">
            {groupedEntries[date].map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                managedShops={managedShops}
                shopSpecialNotes={shopSpecialNotes}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddShop={onAddShop}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 
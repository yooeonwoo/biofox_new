import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Plus, Bell, Send, Clock } from 'lucide-react';

interface ReminderData {
  content: string;
  dateTime: string;
}

interface OwnerMessageData {
  content: string;
  dateTime: string;
  sendNow: boolean;
}

interface JournalEntryProps {
  id: string;
  date: string;
  shopName: string;
  content: string;
  specialNotes: string;
  reminder?: ReminderData;
  ownerMessage?: OwnerMessageData;
  updatedAt?: number;
  managedShops: string[];
  shopSpecialNotes: Record<string, string>;
  onUpdate: (id: string, content: string, shopName: string) => void;
  onDelete: (id: string) => void;
  onAddShop: (newShop: string) => void;
}

export function JournalEntry({ 
  id, 
  date, 
  shopName, 
  content, 
  specialNotes,
  reminder,
  ownerMessage,
  updatedAt,
  managedShops,
  shopSpecialNotes,
  onUpdate, 
  onDelete,
  onAddShop
}: JournalEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editShopName, setEditShopName] = useState(shopName);
  const [isAddingNewShop, setIsAddingNewShop] = useState(false);
  const [newShopInput, setNewShopInput] = useState('');

  const handleSave = () => {
    onUpdate(id, editContent, editShopName);
    setIsEditing(false);
    setIsAddingNewShop(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setEditShopName(shopName);
    setIsEditing(false);
    setIsAddingNewShop(false);
    setNewShopInput('');
  };

  const handleShopSelect = (value: string) => {
    if (value === 'add-new') {
      setIsAddingNewShop(true);
      setEditShopName('');
    } else {
      setEditShopName(value);
      setIsAddingNewShop(false);
    }
  };

  const handleAddNewShop = () => {
    if (newShopInput.trim() && !managedShops.includes(newShopInput.trim())) {
      const newShop = newShopInput.trim();
      onAddShop(newShop);
      setEditShopName(newShop);
      setNewShopInput('');
      setIsAddingNewShop(false);
    }
  };

  const handleCancelNewShop = () => {
    setNewShopInput('');
    setIsAddingNewShop(false);
    setEditShopName(shopName);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreviewContent = (text: string, maxLength: number = 100) => {
    // 첫 번째 줄만 추출
    const firstLine = text.split('\n')[0].trim();
    if (firstLine.length <= maxLength) return firstLine;
    return firstLine.slice(0, maxLength) + '...';
  };

  const getEditShopSpecialNotes = () => {
    return shopSpecialNotes[editShopName] || '';
  };

  return (
    <Card className="overflow-hidden">
      {/* 헤더 - 항상 표시 */}
      <div 
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground">
              {formatDate(date)}
            </div>
            {shopName && (
              <div className="px-3 py-1 bg-primary/10 rounded-full text-primary">
                {shopName}
              </div>
            )}
            {/* 리마인드 및 메시지 표시 */}
            <div className="flex items-center gap-2">
              {reminder && (
                <div className="px-2 py-1 bg-blue-100 rounded-full text-blue-600 flex items-center gap-1 text-xs">
                  <Bell className="w-3 h-3" />
                  리마인드
                </div>
              )}
              {ownerMessage && (
                <div className="px-2 py-1 bg-green-100 rounded-full text-green-600 flex items-center gap-1 text-xs">
                  <Send className="w-3 h-3" />
                  메시지
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 접혀있을 때 내용 미리보기 */}
        {!isExpanded && (
          <div className="mt-3 space-y-2">
            {/* 특이사항 미리보기 */}
            {specialNotes && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                <span className="text-amber-800">특이사항: </span>
                <span className="text-amber-700">{getPreviewContent(specialNotes, 50)}</span>
              </div>
            )}
            {/* 리마인드 미리보기 */}
            {reminder && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <span className="text-blue-800 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  리마인드:
                </span>
                <span className="text-blue-700">{getPreviewContent(reminder.content, 50)}</span>
              </div>
            )}
            {/* 원장님 메시지 미리보기 */}
            {ownerMessage && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                <span className="text-green-800 flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  원장님 메시지:
                </span>
                <span className="text-green-700">{getPreviewContent(ownerMessage.content, 50)}</span>
              </div>
            )}
            {/* 내용 미리보기 */}
            <div className="text-muted-foreground line-clamp-1">
              {getPreviewContent(content)}
            </div>
          </div>
        )}
      </div>

      {/* 펼쳐진 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t space-y-3">
          {/* 편집/삭제 버튼 */}
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={!editContent.trim()}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* 내용 */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`shop-name-${id}`}>샵명</Label>
                {isAddingNewShop ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newShopInput}
                      onChange={(e) => setNewShopInput(e.target.value)}
                      placeholder="새 샵명 입력"
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddNewShop();
                        } else if (e.key === 'Escape') {
                          handleCancelNewShop();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddNewShop}
                      disabled={!newShopInput.trim()}
                    >
                      추가
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelNewShop}
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <Select value={editShopName} onValueChange={handleShopSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="샵을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add-new" className="text-primary">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          새로 추가
                        </div>
                      </SelectItem>
                      {managedShops.map((shop) => (
                        <SelectItem key={shop} value={shop}>
                          {shop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 편집 중 선택된 샵의 특이사항 미리보기 */}
              {editShopName && getEditShopSpecialNotes() && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <Label className="text-amber-800">특이사항</Label>
                  <div className="text-amber-700 mt-1">
                    {getEditShopSpecialNotes()}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor={`content-${id}`}>일지 내용</Label>
                <Textarea
                  id={`content-${id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="일지 내용을 작성해주세요..."
                  className="min-h-[120px] resize-none"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 특이사항 (메모 위에 표시) */}
              {specialNotes && (
                <div className="space-y-2">
                  <Label>특이사항</Label>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="whitespace-pre-wrap text-amber-800">
                      {specialNotes}
                    </div>
                  </div>
                </div>
              )}

              {/* 메모 내용 */}
              <div className="space-y-2">
                <Label>일지 내용</Label>
                <div className="whitespace-pre-wrap min-h-[120px] p-3 bg-muted/30 rounded-md">
                  {content || (
                    <span className="text-muted-foreground italic">
                      내용이 없습니다.
                    </span>
                  )}
                </div>
              </div>

              {/* 리마인드 표시 */}
              {reminder && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <Label className="text-blue-800">리마인드</Label>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="whitespace-pre-wrap text-blue-800 mb-2">
                      {reminder.content}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(reminder.dateTime)}
                    </div>
                  </div>
                </div>
              )}

              {/* 원장님 메시지 표시 */}
              {ownerMessage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-green-600" />
                    <Label className="text-green-800">원장님 메시지</Label>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="whitespace-pre-wrap text-green-800 mb-2">
                      {ownerMessage.content}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Clock className="w-3 h-3" />
                      {ownerMessage.sendNow ? '즉시 발송됨' : `예약 발송: ${formatDateTime(ownerMessage.dateTime)}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
'use client';

import { useState } from 'react';
import { JournalEntryData } from '../lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Plus, Bell, Send, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface JournalCardProps {
  entry: JournalEntryData;
  managedShops: string[];
  shopSpecialNotes: Record<string, string>;
  onUpdate: (id: string, content: string, shopName: string) => void;
  onDelete: (id: string) => void;
  onAddShop: (newShop: string) => void;
}

export default function JournalCard({ 
  entry,
  managedShops,
  shopSpecialNotes,
  onUpdate, 
  onDelete,
  onAddShop
}: JournalCardProps) {
  const { id, date, shopName, content, specialNotes, reminder, ownerMessage } = entry;
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

    const formatTime = (timestamp: number) => {
        const d = new Date(timestamp);
        return d.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    const d = new Date(dateTimeString);
    return d.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseJournalContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const match = line.match(/^\* \[(\d{2}:\d{2})\] (.+)$/);
      if (match) {
        return { time: match[1], text: match[2] };
      }
      return { time: null, text: line };
    });
  };

  const parsedContent = parseJournalContent(content);

  const getEditShopSpecialNotes = () => {
    return shopSpecialNotes[editShopName] || '';
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* 헤더 - 항상 표시 */}
      <div 
        className="p-4 cursor-pointer bg-card hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-800">{shopName}</span>
            <div className="flex items-center gap-2">
                {reminder && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                        <Bell className="w-3 h-3" />
                        리마인드
                    </Badge>
                )}
                {ownerMessage && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                        <Send className="w-3 h-3" />
                        메시지
                    </Badge>
                )}
            </div>
            {entry.updatedAt && (
                <span className="text-xs text-muted-foreground">
                    (수정됨)
                </span>
            )}
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">{formatTime(entry.createdAt)}</span>
             <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
            >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* 펼쳐진 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t space-y-4 pt-4">
            <div className="flex justify-end gap-2">
                {isEditing ? (
                <>
                    <Button size="sm" variant="outline" onClick={handleSave} disabled={!editContent.trim()}>
                        <Check className="w-4 h-4 mr-2" /> 저장
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" /> 취소
                    </Button>
                </>
                ) : (
                <>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" /> 수정
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> 삭제
                    </Button>
                </>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`shop-name-${id}`}>샵명</Label>
                     {isAddingNewShop ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={newShopInput}
                          onChange={(e) => setNewShopInput(e.target.value)}
                          placeholder="새 샵명 입력"
                          className="flex-1 h-9"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNewShop()}
                        />
                        <Button size="sm" onClick={handleAddNewShop} disabled={!newShopInput.trim()}>추가</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsAddingNewShop(false)}>취소</Button>
                      </div>
                    ) : (
                      <Select value={editShopName} onValueChange={handleShopSelect}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue placeholder="샵을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add-new" className="text-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            <span>새로 추가</span>
                          </SelectItem>
                          {managedShops.map((shop) => (
                            <SelectItem key={shop} value={shop}>{shop}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                   {editShopName && getEditShopSpecialNotes() && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                      <Label className="text-amber-800 font-semibold">특이사항</Label>
                      <div className="text-amber-700 mt-1">{getEditShopSpecialNotes()}</div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor={`content-${id}`}>일지 내용</Label>
                    <Textarea
                      id={`content-${id}`}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="일지 내용을 작성해주세요..."
                      className="mt-1 min-h-[150px]"
                      autoFocus
                    />
                  </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {specialNotes && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                            <p className="font-semibold text-amber-900">특이사항</p>
                            <p className="text-amber-800 mt-1 whitespace-pre-wrap">{specialNotes}</p>
                        </div>
                    )}
                    <div className="text-sm text-gray-800 leading-relaxed space-y-2 whitespace-pre-wrap min-h-[120px] p-3 bg-muted/50 rounded-md">
                        {parsedContent.map((item, index) => (
                          <div key={index} className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              {item.time && <span className="text-muted-foreground mr-2 font-mono">[{item.time}]</span>}
                              {item.text}
                            </div>
                          </div>
                        ))}
                    </div>

                    {reminder && (
                         <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                             <div className="flex items-center gap-2 font-semibold text-blue-900">
                                 <Bell className="w-4 h-4" />
                                 <span>리마인드</span>
                             </div>
                            <p className="text-blue-800 mt-1.5">{reminder.content}</p>
                            <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-1">
                                <Clock className="w-3 h-3" />
                                {formatDateTime(reminder.dateTime)}
                            </div>
                        </div>
                    )}
                    {ownerMessage && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                            <div className="flex items-center gap-2 font-semibold text-green-900">
                                 <Send className="w-4 h-4" />
                                 <span>원장님 메시지</span>
                             </div>
                            <p className="text-green-800 mt-1.5">{ownerMessage.content}</p>
                            <div className="flex items-center gap-1.5 text-xs text-green-600 mt-1">
                                <Clock className="w-3 h-3" />
                                {ownerMessage.sendNow ? '즉시 발송됨' : `예약: ${formatDateTime(ownerMessage.dateTime)}`}
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
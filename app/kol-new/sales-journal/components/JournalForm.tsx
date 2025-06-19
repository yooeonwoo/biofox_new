"use client";

import { useState } from 'react';
import { JournalEntryData, ReminderData, OwnerMessageData } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Bell, Send, XCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface JournalFormProps {
    managedShops: string[];
    shopSpecialNotes: Record<string, string>;
    onSave: (newEntryData: Omit<JournalEntryData, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
    onAddShop: (newShop: string) => void;
}

export default function JournalForm({ managedShops, shopSpecialNotes, onSave, onCancel, onAddShop }: JournalFormProps) {
    const [content, setContent] = useState('');
    const [shopName, setShopName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [reminderContent, setReminderContent] = useState('');
    const [reminderDateTime, setReminderDateTime] = useState('');
    const [ownerMessageContent, setOwnerMessageContent] = useState('');
    const [ownerMessageDateTime, setOwnerMessageDateTime] = useState('');
    
    const [isAddingNewShop, setIsAddingNewShop] = useState(false);
    const [newShopInput, setNewShopInput] = useState('');

    const handleShopSelect = (value: string) => {
        if (value === 'add-new') {
            setIsAddingNewShop(true);
            setShopName('');
        } else {
            setShopName(value);
            setIsAddingNewShop(false);
        }
    };

    const handleAddNewShop = () => {
        if (newShopInput.trim()) {
            onAddShop(newShopInput.trim());
            setShopName(newShopInput.trim());
            setNewShopInput('');
            setIsAddingNewShop(false);
        }
    };

    const handleSaveClick = () => {
        if (!content.trim() || !shopName) {
            alert('샵 이름과 일지 내용을 입력해주세요.');
            return;
        }

        const newEntryData: Omit<JournalEntryData, 'id' | 'createdAt' | 'updatedAt'> = {
            date: selectedDate,
            shopName,
            content,
            specialNotes: shopSpecialNotes[shopName] || '',
            reminder: reminderContent.trim() && reminderDateTime ? { content: reminderContent, dateTime: reminderDateTime } : undefined,
            ownerMessage: ownerMessageContent.trim() ? { content: ownerMessageContent, dateTime: ownerMessageDateTime, sendNow: !ownerMessageDateTime } : undefined,
        };
        onSave(newEntryData);
    };


    return (
        <Card className="p-4 sm:p-6 space-y-4 shadow-md border-primary/20">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">새 영업일지 작성</h3>
                <Button variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground">
                    <XCircle />
                </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <Label htmlFor="journal-date" className="shrink-0">날짜</Label>
                    <Input
                        id="journal-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full sm:w-auto"
                    />
                </div>

                <div className="flex items-center gap-2 flex-1">
                    <Label htmlFor="shop-select" className="shrink-0">샵명</Label>
                    {isAddingNewShop ? (
                        <div className="flex items-center gap-2 w-full">
                            <Input
                                value={newShopInput}
                                onChange={(e) => setNewShopInput(e.target.value)}
                                placeholder="새 샵명 입력"
                                className="flex-1"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNewShop()}
                            />
                            <Button size="sm" onClick={handleAddNewShop} disabled={!newShopInput.trim()}>추가</Button>
                            <Button size="sm" variant="outline" onClick={() => { setIsAddingNewShop(false); setNewShopInput(''); }}>취소</Button>
                        </div>
                    ) : (
                        <Select value={shopName} onValueChange={handleShopSelect}>
                            <SelectTrigger id="shop-select" className="w-full">
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
            </div>

            {shopName && shopSpecialNotes[shopName] && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <Label className="text-amber-800 font-semibold">특이사항</Label>
                    <div className="text-amber-700 mt-1 text-sm">{shopSpecialNotes[shopName]}</div>
                </div>
            )}

            <div>
                 <Label htmlFor="journal-content">일지 내용</Label>
                 <Textarea
                    id="journal-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="영업 활동과 생각을 자유롭게 적어보세요... (팁: * [시간] 내용 형식으로 입력하면 시간대별로 정리됩니다)"
                    className="mt-1 min-h-[120px]"
                />
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <Label className="text-blue-800 text-sm font-semibold">리마인드 설정</Label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        value={reminderContent}
                        onChange={(e) => setReminderContent(e.target.value)}
                        placeholder="나중에 확인할 내용..."
                        className="flex-1 bg-white text-sm"
                    />
                    <Input
                        type="datetime-local"
                        value={reminderDateTime}
                        onChange={(e) => setReminderDateTime(e.target.value)}
                        className="bg-white text-sm w-full sm:w-auto"
                    />
                </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-green-600" />
                    <Label className="text-green-800 text-sm font-semibold">원장님께 메시지 보내기</Label>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        value={ownerMessageContent}
                        onChange={(e) => setOwnerMessageContent(e.target.value)}
                        placeholder="원장님께 전달할 메시지..."
                        className="flex-1 bg-white text-sm"
                    />
                     <Input
                        type="datetime-local"
                        value={ownerMessageDateTime}
                        onChange={(e) => setOwnerMessageDateTime(e.target.value)}
                        className="bg-white text-sm w-full sm:w-auto"
                    />
                </div>
                <p className="text-xs text-muted-foreground">시간을 설정하지 않으면 즉시 발송됩니다.</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={onCancel}>취소</Button>
                <Button onClick={handleSaveClick} disabled={!content.trim() || !shopName}>일지 저장</Button>
            </div>
        </Card>
    );
} 
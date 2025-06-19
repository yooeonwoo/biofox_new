"use client";

import { useState } from 'react';
import { JournalEntryData } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Bell, Send, Clock, Maximize2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface JournalFormProps {
    managedShops: string[];
    shopSpecialNotes: Record<string, string>;
    onSave: (newEntryData: Omit<JournalEntryData, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
    onAddShop: (newShop: string) => void;
}

export default function JournalForm({ managedShops, shopSpecialNotes, onSave, onCancel, onAddShop }: JournalFormProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [shopName, setShopName] = useState('');
    
    const [content, setContent] = useState('');
    
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
            const newShop = newShopInput.trim();
            onAddShop(newShop);
            setShopName(newShop);
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
            date: date,
            shopName,
            content,
            specialNotes: shopSpecialNotes[shopName] || '',
            reminder: reminderContent.trim() && reminderDateTime ? { content: reminderContent, dateTime: reminderDateTime } : undefined,
            ownerMessage: ownerMessageContent.trim() ? { content: ownerMessageContent, dateTime: ownerMessageDateTime, sendNow: !ownerMessageDateTime } : undefined,
        };
        onSave(newEntryData);
    };

    const getDefaultDateTime = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        return now.toISOString().slice(0, 16);
    };

    return (
        <div className="p-4 sm:p-6 space-y-3 shadow-sm border rounded-xl bg-card">
            {/* 날짜, 샵명 선택 */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <Label className="w-12 text-sm text-muted-foreground">날짜</Label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="flex items-center gap-2 flex-1">
                    <Label className="w-12 text-sm text-muted-foreground">샵명</Label>
                    {isAddingNewShop ? (
                        <div className="flex items-center gap-2 w-full">
                            <Input value={newShopInput} onChange={(e) => setNewShopInput(e.target.value)} placeholder="새 샵명" className="h-9" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddNewShop()} />
                            <Button size="sm" onClick={handleAddNewShop} disabled={!newShopInput.trim()}>추가</Button>
                            <Button size="sm" variant="outline" onClick={() => setIsAddingNewShop(false)}>취소</Button>
                        </div>
                    ) : (
                        <Select value={shopName} onValueChange={handleShopSelect}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="샵을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="add-new" className="text-primary flex items-center gap-2"><Plus className="w-4 h-4" /> 새로 추가</SelectItem>
                                {managedShops.map((shop) => (<SelectItem key={shop} value={shop}>{shop}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* 일지 내용 */}
            <div className="flex items-center gap-2 p-1.5 pl-3 border rounded-lg bg-gray-50">
                <Label className="text-sm text-muted-foreground shrink-0">일지 내용</Label>
                <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="영업 활동과 생각을 자유롭게 적어보세요..."
                    className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 h-8"
                />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0"><Maximize2 className="size-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>일지 내용 작성</DialogTitle>
                            <DialogDescription>내용을 자세하게 입력해주세요.</DialogDescription>
                        </DialogHeader>
                        <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[200px]" />
                        <DialogFooter>
                            <DialogClose asChild><Button>확인</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            
            {/* 리마인드 */}
            <div className="flex items-center gap-2 p-1.5 pl-3 border rounded-lg bg-blue-50 border-blue-200">
                <Bell className="size-4 text-blue-600 shrink-0" />
                <Label className="text-sm text-blue-800 shrink-0">리마인드</Label>
                <Input
                    value={reminderContent}
                    onChange={(e) => setReminderContent(e.target.value)}
                    placeholder="나중에 확인할 내용..."
                    className="flex-1 bg-white border-0 shadow-none focus-visible:ring-0 h-8"
                />
                <Input type="datetime-local" value={reminderDateTime} onChange={e => setReminderDateTime(e.target.value)} className="h-8 bg-white w-auto text-xs" />
                <Dialog>
                     <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0"><Maximize2 className="size-4" /></Button>
                    </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>리마인드 내용</DialogTitle>
                        </DialogHeader>
                        <Textarea value={reminderContent} onChange={(e) => setReminderContent(e.target.value)} className="min-h-[120px]" />
                        <DialogFooter>
                             <DialogClose asChild><Button>확인</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" onClick={() => alert('리마인드 저장 기능은 준비 중입니다.')}>저장</Button>
            </div>

            {/* 원장님 메시지 */}
            <div className="flex items-center gap-2 p-1.5 pl-3 border rounded-lg bg-green-50 border-green-200">
                <Send className="size-4 text-green-600 shrink-0" />
                <Label className="text-sm text-green-800 shrink-0">원장님 메시지</Label>
                <Input
                    value={ownerMessageContent}
                    onChange={(e) => setOwnerMessageContent(e.target.value)}
                    placeholder="원장님께 보낼 메시지"
                    className="flex-1 bg-white border-0 shadow-none focus-visible:ring-0 h-8"
                />
                 <Input type="datetime-local" value={ownerMessageDateTime} onChange={e => setOwnerMessageDateTime(e.target.value)} className="h-8 bg-white w-auto text-xs" />
                <Button size="sm" variant="outline" className="h-8 bg-white gap-1.5" onClick={() => alert('예약 발송 기능은 준비 중입니다.')}>
                    <Clock className="size-3" /> 예약발송
                </Button>
                <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 gap-1.5" onClick={() => alert('즉시 보내기 기능은 준비 중입니다.')}>
                    <Send className="size-3" /> 즉시보내기
                </Button>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel}>취소</Button>
                <Button onClick={handleSaveClick} disabled={!content.trim() || !shopName}>일지 저장</Button>
            </div>
        </div>
    );
} 
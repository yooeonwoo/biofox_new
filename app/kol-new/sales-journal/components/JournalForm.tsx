"use client";

import { useState } from 'react';
import { JournalEntryData } from '../lib/types';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Maximize2, CalendarIcon } from 'lucide-react'; // Bell, Send, Clock 아이콘 사용 중지
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
// TODO: MVP 알림 기능 비활성화
// import { DateTimePicker } from './DateTimePicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// TODO: MVP 알림 기능 비활성화: 더미 컴포넌트 정의로 타입 에러 방지
const Bell: React.FC<any> = () => null;
const Send: React.FC<any> = () => null;
const Clock: React.FC<any> = () => null;
const DateTimePicker: React.FC<any> = () => null;

interface JournalFormProps {
    managedShops: string[];
    shopSpecialNotes: Record<string, string>;
    onSave: (newEntryData: Omit<JournalEntryData, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
    onAddShop: (newShop: string) => void;
}

export default function JournalForm({ managedShops, shopSpecialNotes, onSave, onCancel, onAddShop }: JournalFormProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [shopName, setShopName] = useState('');
    
    const [content, setContent] = useState('');
    
    const [reminderContent, setReminderContent] = useState('');
    const [reminderDateTime, setReminderDateTime] = useState('');
    
    const [ownerMessageContent, setOwnerMessageContent] = useState('');
    const [ownerMessageDateTime, setOwnerMessageDateTime] = useState('');
    
    const [isAddingNewShop, setIsAddingNewShop] = useState(false);
    const [newShopInput, setNewShopInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

    const handleSaveClick = async () => {
        // 기존 검증 로직 유지
        if (!date || !shopName.trim() || !content.trim()) {
            toast({
                title: "오류",
                description: "날짜, 샵명, 내용은 필수입니다.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        
        try {
            // TODO: MVP 이후 알림 기능 재활성화 - 리마인드/원장 메시지 비활성화
            /*
            const reminder = (reminderContent.trim() && reminderDateTime) ? {
                content: reminderContent.trim(),
                dateTime: reminderDateTime
            } : undefined;

            const ownerMessage = (ownerMessageContent.trim()) ? {
                content: ownerMessageContent.trim(),
                dateTime: ownerMessageDateTime || '',
                sendNow: !ownerMessageDateTime
            } : undefined;
            */

            // 디버그: 전송할 데이터 확인
            const payload = {
                    date: format(date, 'yyyy-MM-dd'),
                    shopName: shopName.trim(),
                    content: content.trim(),
                    specialNotes: shopSpecialNotes[shopName] || undefined,
                } as const; // TODO: 알림 필드 제거
            console.log('전송할 데이터:', payload);

            const response = await fetch('/api/kol-new/sales-journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '저장에 실패했습니다.');
            }

            // 성공 처리
            toast({
                title: "저장 완료",
                description: "영업일지가 성공적으로 저장되었습니다.",
            });

            // 기존 onSave 호출 (상위 컴포넌트 알림용)
            const savedData: Omit<JournalEntryData, 'id' | 'createdAt' | 'updatedAt'> = {
                date: format(date, 'yyyy-MM-dd'),
                shopName: shopName.trim(),
                content: content.trim(),
                specialNotes: shopSpecialNotes[shopName] || ''
            };
            onSave(savedData);

        } catch (error) {
            console.error('영업일지 저장 오류:', error);
            toast({
                title: "저장 실패",
                description: error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOwnerMessageSend = (sendNow: boolean) => {
        if (!ownerMessageContent.trim()) {
            toast({
                title: "오류",
                description: "메시지 내용을 입력해주세요.",
                variant: "destructive",
            });
            return;
        }
        if (!sendNow && !ownerMessageDateTime) {
            toast({
                title: "오류", 
                description: "예약 발송 시간을 설정해주세요.",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "안내",
            description: "원장님 메시지는 영업일지 저장 시 함께 전송됩니다.",
        });
    }
    
    const formatDateTime = (dateTimeString: string) => {
        if (!dateTimeString) return '';
        const d = new Date(dateTimeString);
        return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 shadow-sm border rounded-xl bg-card">
            {/* 날짜, 샵명 선택 */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                    <Label className="w-12 text-sm text-muted-foreground">날짜</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                locale={ko}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                    <Label className="w-12 text-sm text-muted-foreground">샵명</Label>
                    {isAddingNewShop ? (
                        <div className="flex items-center gap-2 w-full">
                            <Input value={newShopInput} onChange={(e) => setNewShopInput(e.target.value)} placeholder="새 샵명" className="h-10 flex-1" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddNewShop()} />
                            <Button size="sm" onClick={handleAddNewShop} disabled={!newShopInput.trim()}>추가</Button>
                            <Button size="sm" variant="outline" onClick={() => setIsAddingNewShop(false)}>취소</Button>
                        </div>
                    ) : (
                        <Select value={shopName} onValueChange={handleShopSelect}>
                            <SelectTrigger className="h-10 flex-1"><SelectValue placeholder="샵을 선택하세요" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="add-new" className="text-primary flex items-center gap-2"><Plus className="w-4 h-4" /> 새로 추가</SelectItem>
                                {managedShops.map((shop) => (<SelectItem key={shop} value={shop}>{shop}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* 일지 내용 */}
            <div className="flex items-center gap-2 p-1.5 pl-3 border rounded-lg bg-gray-50/80">
                <Label className="text-sm font-semibold text-gray-700 shrink-0">일지 내용</Label>
                <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="영업 활동과 생각을 자유롭게 적어보세요..." className="flex-1 min-w-0 bg-transparent border-0 shadow-none focus-visible:ring-0 h-8" />
                <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" className="size-8 shrink-0"><Maximize2 className="size-4" /></Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>일지 내용 작성</DialogTitle></DialogHeader>
                        <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[200px]" />
                        <DialogFooter><DialogClose asChild><Button>확인</Button></DialogClose></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
                <div className="flex-1 min-w-0 relative">
                    <Input value={reminderContent} onChange={(e) => setReminderContent(e.target.value)} placeholder="나중에 확인할 내용..." className="bg-white border-0 shadow-none focus-visible:ring-0 h-8 pr-10" />
                    <Dialog>
                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 size-6 hover:bg-blue-100"><Maximize2 className="size-3" /></Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>리마인드 내용</DialogTitle></DialogHeader>
                            <Textarea value={reminderContent} onChange={(e) => setReminderContent(e.target.value)} className="min-h-[120px]" placeholder="나중에 확인할 내용을 자세히 입력하세요..." />
                            <DialogFooter><DialogClose asChild><Button>확인</Button></DialogClose></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <DateTimePicker value={reminderDateTime} onChange={setReminderDateTime} />
                <Button 
                    size="sm" 
                    className="h-8 bg-blue-600 hover:bg-blue-700 shrink-0" 
                    onClick={() => toast({
                        title: "안내",
                        description: "리마인더는 영업일지 저장 시 함께 저장됩니다.",
                    })}
                >
                    저장
                </Button>
            </div>

            /* TODO: MVP 알림 기능 비활성화 - 원장님 메시지 UI 시작
{/* 원장님 메시지 */}
            <div className="flex items-center gap-2 p-1.5 pl-3 border rounded-lg bg-green-50/80 border-green-200">
                <Send className="size-4 text-green-600 shrink-0" />
                <Label className="text-sm text-green-800 shrink-0 font-semibold">원장님</Label>
                <div className="flex-1 min-w-0 relative">
                    <Input value={ownerMessageContent} onChange={(e) => setOwnerMessageContent(e.target.value)} placeholder="원장님께 보낼 메시지" className="bg-white border-0 shadow-none focus-visible:ring-0 h-8 pr-10" />
                    <Dialog>
                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 size-6 hover:bg-green-100"><Maximize2 className="size-3" /></Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>원장님 메시지 작성</DialogTitle></DialogHeader>
                            <Textarea value={ownerMessageContent} onChange={(e) => setOwnerMessageContent(e.target.value)} className="min-h-[120px]" placeholder="원장님께 보낼 메시지를 자세히 입력하세요..." />
                            <DialogFooter><DialogClose asChild><Button>확인</Button></DialogClose></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex items-center gap-2 ml-auto shrink-0">
                    <DateTimePicker value={ownerMessageDateTime} onChange={setOwnerMessageDateTime} />
                    <Button size="sm" variant="outline" className="h-8 bg-white gap-1.5 text-green-800 border-green-300 hover:bg-green-100 hover:text-green-900 shrink-0" onClick={() => handleOwnerMessageSend(false)}>
                        <Clock className="size-3" /> 예약
                    </Button>
                    <Button size="sm" className="h-8 bg-green-500 hover:bg-green-600 text-white gap-1.5 shrink-0" onClick={() => handleOwnerMessageSend(true)}>
                        <Send className="size-3" /> 즉시
                    </Button>
                </div>
            </div>

             <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel} disabled={isLoading}>취소</Button>
                <Button 
                    onClick={handleSaveClick} 
                    disabled={isLoading || !content.trim() || !shopName}
                >
                    {isLoading ? "저장 중..." : "일지 저장"}
                </Button>
            </div>
        </div>
    );
} 
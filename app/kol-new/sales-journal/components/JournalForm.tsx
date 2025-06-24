"use client";

import { useState } from 'react';
import { JournalEntryData } from '../lib/types';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Maximize2, CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// TODO: MVP 알림 기능 비활성화 - 더미 컴포넌트로 TypeScript 오류 방지
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
    
    // TODO: MVP 알림 기능 비활성화 - 상태 유지하되 UI에서 제외
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
            setNewShopInput('');
        } else {
            setShopName(value);
        }
    };

    const handleAddNewShop = () => {
        if (newShopInput.trim()) {
            onAddShop(newShopInput.trim());
            setShopName(newShopInput.trim());
            setIsAddingNewShop(false);
            setNewShopInput('');
        }
    };

    const handleSaveClick = async () => {
        if (!content.trim() || !shopName) {
            toast({
                title: "필수 항목 누락",
                description: "일지 내용과 샵명을 모두 입력해주세요.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            // MVP: 알림 데이터 제외한 기본 영업일지 데이터만 전송
            const newEntryData = {
                date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                shopName,
                content,
                specialNotes: shopSpecialNotes[shopName] || ''
            };

            await onSave(newEntryData);
            
            toast({
                title: "영업일지 저장 완료",
                description: "영업일지가 성공적으로 저장되었습니다.",
            });
        } catch (error) {
            console.error('영업일지 저장 오류:', error);
            toast({
                title: "저장 실패",
                description: "영업일지 저장 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // TODO: MVP 알림 기능 비활성화 - 핸들러 함수 유지하되 미사용
    const handleReminderSave = () => {
        toast({
            title: "안내",
            description: "리마인더는 영업일지 저장 시 함께 저장됩니다.",
        });
    };

    const handleOwnerMessageSend = (isImmediate: boolean) => {
        toast({
            title: "안내", 
            description: "원장님 메시지는 영업일지 저장 시 함께 전송됩니다.",
        });
    };
    
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
                            <Input 
                                value={newShopInput} 
                                onChange={(e) => setNewShopInput(e.target.value)} 
                                placeholder="새 샵명" 
                                className="h-10 flex-1" 
                                autoFocus 
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNewShop()} 
                            />
                            <Button size="sm" onClick={handleAddNewShop} disabled={!newShopInput.trim()}>
                                추가
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setIsAddingNewShop(false)}>
                                취소
                            </Button>
                        </div>
                    ) : (
                        <Select value={shopName} onValueChange={handleShopSelect}>
                            <SelectTrigger className="h-10 flex-1">
                                <SelectValue placeholder="샵을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="add-new" className="text-primary flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> 새로 추가
                                </SelectItem>
                                {managedShops.map((shop) => (
                                    <SelectItem key={shop} value={shop}>{shop}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* 일지 내용 */}
            <div className="flex items-start gap-2 p-1.5 pl-3 border rounded-lg bg-gray-50/80">
                <Label className="text-sm font-semibold text-gray-700 shrink-0 pt-1">일지 내용</Label>
                <Textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    placeholder="영업 활동과 생각을 자유롭게 적어보세요..." 
                    className="flex-1 min-w-0 bg-transparent border-0 shadow-none focus-visible:ring-0 min-h-[60px] resize-none" 
                />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0">
                            <Maximize2 className="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>일지 내용 작성</DialogTitle>
                        </DialogHeader>
                        <Textarea 
                            value={content} 
                            onChange={(e) => setContent(e.target.value)} 
                            className="min-h-[200px]" 
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button>확인</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* TODO: MVP 알림 기능 비활성화 - 리마인더 및 원장님 메시지 UI 숨김 */}
            {false && (
                <>
                    {/* 리마인더 UI */}
                    <div className="flex items-center gap-2 p-1.5 pl-3 border rounded-lg bg-blue-50/80 border-blue-200">
                        <Bell className="size-4 text-blue-600 shrink-0" />
                        <Label className="text-sm text-blue-800 shrink-0 font-semibold">리마인더</Label>
                        <div className="flex-1 min-w-0 relative">
                            <Input 
                                value={reminderContent} 
                                onChange={(e) => setReminderContent(e.target.value)} 
                                placeholder="나중에 확인할 내용..." 
                                className="bg-white border-0 shadow-none focus-visible:ring-0 h-8 pr-10" 
                            />
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 size-6 hover:bg-blue-100">
                                        <Maximize2 className="size-3" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>리마인드 내용</DialogTitle>
                                    </DialogHeader>
                                    <Textarea 
                                        value={reminderContent} 
                                        onChange={(e) => setReminderContent(e.target.value)} 
                                        className="min-h-[120px]" 
                                        placeholder="나중에 확인할 내용을 자세히 입력하세요..." 
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button>확인</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <DateTimePicker value={reminderDateTime} onChange={setReminderDateTime} />
                        <Button 
                            size="sm" 
                            className="h-8 bg-blue-600 hover:bg-blue-700 shrink-0" 
                            onClick={handleReminderSave}
                        >
                            저장
                        </Button>
                    </div>

                    {/* 원장님 메시지 UI */}
                    <div className="flex items-center gap-2 p-1.5 pl-3 border rounded-lg bg-green-50/80 border-green-200">
                        <Send className="size-4 text-green-600 shrink-0" />
                        <Label className="text-sm text-green-800 shrink-0 font-semibold">원장님</Label>
                        <div className="flex-1 min-w-0 relative">
                            <Input 
                                value={ownerMessageContent} 
                                onChange={(e) => setOwnerMessageContent(e.target.value)} 
                                placeholder="원장님께 보낼 메시지" 
                                className="bg-white border-0 shadow-none focus-visible:ring-0 h-8 pr-10" 
                            />
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 size-6 hover:bg-green-100">
                                        <Maximize2 className="size-3" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>원장님 메시지 작성</DialogTitle>
                                    </DialogHeader>
                                    <Textarea 
                                        value={ownerMessageContent} 
                                        onChange={(e) => setOwnerMessageContent(e.target.value)} 
                                        className="min-h-[120px]" 
                                        placeholder="원장님께 보낼 메시지를 자세히 입력하세요..." 
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button>확인</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                            <DateTimePicker value={ownerMessageDateTime} onChange={setOwnerMessageDateTime} />
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 bg-white gap-1.5 text-green-800 border-green-300 hover:bg-green-100 hover:text-green-900 shrink-0" 
                                onClick={() => handleOwnerMessageSend(false)}
                            >
                                <Clock className="size-3" /> 예약
                            </Button>
                            <Button 
                                size="sm" 
                                className="h-8 bg-green-600 hover:bg-green-700 text-white shrink-0" 
                                onClick={() => handleOwnerMessageSend(true)}
                            >
                                전송
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* 저장/취소 버튼 */}
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
                    취소
                </Button>
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

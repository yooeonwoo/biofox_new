import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './components/ui/dialog';
import { Plus, Clock, Bell, Send, Maximize2, ArrowLeft } from 'lucide-react';

interface ReminderData {
  content: string;
  dateTime: string;
}

interface OwnerMessageData {
  content: string;
  dateTime: string;
  sendNow: boolean;
}

interface JournalEntryData {
  id: string;
  date: string;
  shopName: string;
  content: string;
  specialNotes: string;
  reminder?: ReminderData;
  ownerMessage?: OwnerMessageData;
  createdAt: number;
  updatedAt?: number;
}

export default function App() {
  const [entries, setEntries] = useState<JournalEntryData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 리마인드 및 원장님 메시지 상태
  const [reminderContent, setReminderContent] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [ownerMessageContent, setOwnerMessageContent] = useState('');
  const [ownerMessageDateTime, setOwnerMessageDateTime] = useState('');
  
  // 날짜/시간 선택기 표시 상태
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showMessageDatePicker, setShowMessageDatePicker] = useState(false);
  
  // 모달 상태
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  // 모달용 임시 상태
  const [modalJournalContent, setModalJournalContent] = useState('');
  const [modalReminderContent, setModalReminderContent] = useState('');
  const [modalReminderDateTime, setModalReminderDateTime] = useState('');
  const [modalMessageContent, setModalMessageContent] = useState('');
  const [modalMessageDateTime, setModalMessageDateTime] = useState('');
  
  // 샵 관리 관련 상태
  const [managedShops, setManagedShops] = useState<string[]>([
    '믈리에스킨', '피부미인', '아비에 대구', '엑스날 청담'
  ]);
  const [isAddingNewShop, setIsAddingNewShop] = useState(false);
  const [newShopInput, setNewShopInput] = useState('');

  // 샵별 특이사항 데이터
  const [shopSpecialNotes, setShopSpecialNotes] = useState<Record<string, string>>({
    '믈리에스킨': '신규 제품 문의 관련으로 연락오심',
    '피부미인': '이벤트 추가 건의주심',
    '아비에 대구': '재고 부족 관련 문의주심',
    '엑스날 청담': '매장 확장 계획 상담 요청하심'
  });

  // 기본 날짜시간 설정
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  // 날짜시간 포맷팅
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 로컬 스토리지 로드
  useEffect(() => {
    const savedEntries = localStorage.getItem('journal-entries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    
    const savedShops = localStorage.getItem('managed-shops');
    if (savedShops) {
      const parsedShops = JSON.parse(savedShops);
      const defaultShops = ['믈리에스킨', '피부미인', '아비에 대구', '엑스날 청담'];
      const mergedShops = [...new Set([...defaultShops, ...parsedShops])];
      setManagedShops(mergedShops);
    }

    const savedSpecialNotes = localStorage.getItem('shop-special-notes');
    if (savedSpecialNotes) {
      const parsedNotes = JSON.parse(savedSpecialNotes);
      const defaultNotes = {
        '믈리에스킨': '신규 제품 문의 관련으로 연락오심',
        '피부미인': '이벤트 추가 건의주심',
        '아비에 대구': '재고 부족 관련 문의주심',
        '엑스날 청담': '매장 확장 계획 상담 요청하심'
      };
      setShopSpecialNotes({...defaultNotes, ...parsedNotes});
    }

    // 브라우저 알림 권한 요청
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  // 로컬 스토리지 저장
  useEffect(() => {
    localStorage.setItem('journal-entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('managed-shops', JSON.stringify(managedShops));
  }, [managedShops]);

  useEffect(() => {
    localStorage.setItem('shop-special-notes', JSON.stringify(shopSpecialNotes));
  }, [shopSpecialNotes]);

  // 리마인드 알림 설정
  const scheduleReminder = (reminder: ReminderData) => {
    const reminderTime = new Date(reminder.dateTime).getTime();
    const now = Date.now();
    
    if (reminderTime > now) {
      const timeout = reminderTime - now;
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('영업 일지 리마인드', {
            body: reminder.content,
            icon: '/favicon.ico'
          });
        } else {
          alert(`리마인드: ${reminder.content}`);
        }
      }, timeout);
    }
  };

  // 일지 내용 파싱 함수
  const parseJournalContent = (content: string) => {
    // 기존 "--- 시간 추가 ---" 형태와 새로운 형태 모두 지원
    const entries = [];
    const lines = content.split('\n');
    let currentEntry = { content: '', timestamp: null };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 기존 형태: "--- 13:45 추가 ---"
      const oldFormatMatch = line.match(/^--- (\d{2}:\d{2}) 추가 ---$/);
      if (oldFormatMatch) {
        if (currentEntry.content.trim()) {
          entries.push({ ...currentEntry });
        }
        currentEntry = { content: '', timestamp: oldFormatMatch[1] };
        continue;
      }
      
      // 새로운 형태: "* [13:45] 내용"
      const newFormatMatch = line.match(/^\* \[(\d{2}:\d{2})\] (.+)$/);
      if (newFormatMatch) {
        if (currentEntry.content.trim()) {
          entries.push({ ...currentEntry });
        }
        currentEntry = { content: newFormatMatch[2], timestamp: newFormatMatch[1] };
        continue;
      }
      
      // 일반 내용 라인
      if (line.trim() || currentEntry.content) {
        currentEntry.content += (currentEntry.content ? '\n' : '') + line;
      }
    }
    
    // 마지막 항목 추가
    if (currentEntry.content.trim()) {
      entries.push(currentEntry);
    }
    
    return entries.length > 0 ? entries : [{ content: content, timestamp: null }];
  };

  // 일지 저장
  const saveJournal = () => {
    if (!newContent.trim()) return;

    // 같은 날짜와 샵명 조합의 기존 일지 찾기
    const existingEntryIndex = entries.findIndex(
      entry => entry.date === selectedDate && entry.shopName === newShopName
    );

    const currentTime = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (existingEntryIndex >= 0) {
      // 기존 일지에 내용 추가 (새로운 형태로)
      setEntries(prev =>
        prev.map((entry, index) => {
          if (index === existingEntryIndex) {
            const separator = entry.content ? '\n' : '';
            const updatedContent = entry.content + 
              separator + 
              `* [${currentTime}] ${newContent}`;

            return {
              ...entry,
              content: updatedContent,
              updatedAt: Date.now()
            };
          }
          return entry;
        })
      );
    } else {
      // 새로운 일지 생성
      const newEntry: JournalEntryData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: selectedDate,
        shopName: newShopName,
        content: newContent,
        specialNotes: shopSpecialNotes[newShopName] || '',
        createdAt: Date.now()
      };

      setEntries(prev => [newEntry, ...prev]);
    }

    // 일지 필드 초기화
    setNewContent('');
    alert('일지가 저장되었습니다.');
  };

  // 리마인드 저장
  const saveReminder = () => {
    if (!reminderContent.trim() || !reminderDateTime) return;
    
    const reminder: ReminderData = {
      content: reminderContent,
      dateTime: reminderDateTime
    };
    
    scheduleReminder(reminder);
    alert(`리마인드가 설정되었습니다 (${new Date(reminderDateTime).toLocaleString('ko-KR')})`);
    
    // 리마인드 필드 초기화
    setReminderContent('');
    setReminderDateTime('');
    setShowReminderDatePicker(false);
  };

  // 원장님 즉시 메시지 발송
  const sendImmediateMessage = () => {
    if (!ownerMessageContent.trim()) return;
    
    console.log('원장님께 즉시 메시지 발송:', ownerMessageContent);
    alert(`원장님께 메시지를 발송했습니다: ${ownerMessageContent}`);
    setOwnerMessageContent('');
  };

  // 원장님 예약 메시지 발송
  const scheduleOwnerMessage = () => {
    if (!ownerMessageContent.trim() || !ownerMessageDateTime) return;
    
    const sendTime = new Date(ownerMessageDateTime).getTime();
    const now = Date.now();
    
    if (sendTime > now) {
      const timeout = sendTime - now;
      setTimeout(() => {
        console.log('원장님께 예약 메시지 발송:', ownerMessageContent);
        alert(`원장님께 예약 메시지를 발송했습니다: ${ownerMessageContent}`);
      }, timeout);
      alert(`원장님께 메시지 발송이 예약되었습니다 (${new Date(ownerMessageDateTime).toLocaleString('ko-KR')})`);
      setOwnerMessageContent('');
      setOwnerMessageDateTime('');
      setShowMessageDatePicker(false);
    } else {
      alert('예약 시간이 현재 시간보다 빨라야 합니다.');
    }
  };

  // 모달 열기 함수들
  const openJournalModal = () => {
    setModalJournalContent(newContent);
    setShowJournalModal(true);
  };

  const openReminderModal = () => {
    setModalReminderContent(reminderContent);
    setModalReminderDateTime(reminderDateTime || getDefaultDateTime());
    setShowReminderModal(true);
  };

  const openMessageModal = () => {
    setModalMessageContent(ownerMessageContent);
    setModalMessageDateTime(ownerMessageDateTime || getDefaultDateTime());
    setShowMessageModal(true);
  };

  // 모달 저장 함수들
  const saveJournalFromModal = () => {
    setNewContent(modalJournalContent);
    setShowJournalModal(false);
  };

  const saveReminderFromModal = () => {
    if (!modalReminderContent.trim() || !modalReminderDateTime) return;
    
    const reminder: ReminderData = {
      content: modalReminderContent,
      dateTime: modalReminderDateTime
    };
    
    scheduleReminder(reminder);
    alert(`리마인드가 설정되었습니다 (${new Date(modalReminderDateTime).toLocaleString('ko-KR')})`);
    
    setModalReminderContent('');
    setModalReminderDateTime('');
    setShowReminderModal(false);
  };

  const sendImmediateMessageFromModal = () => {
    if (!modalMessageContent.trim()) return;
    
    console.log('원장님께 즉시 메시지 발송:', modalMessageContent);
    alert(`원장님께 메시지를 발송했습니다: ${modalMessageContent}`);
    setModalMessageContent('');
    setShowMessageModal(false);
  };

  const scheduleMessageFromModal = () => {
    if (!modalMessageContent.trim() || !modalMessageDateTime) return;
    
    const sendTime = new Date(modalMessageDateTime).getTime();
    const now = Date.now();
    
    if (sendTime > now) {
      const timeout = sendTime - now;
      setTimeout(() => {
        console.log('원장님께 예약 메시지 발송:', modalMessageContent);
        alert(`원장님께 예약 메시지를 발송했습니다: ${modalMessageContent}`);
      }, timeout);
      alert(`원장님께 메시지 발송이 예약되었습니다 (${new Date(modalMessageDateTime).toLocaleString('ko-KR')})`);
      setModalMessageContent('');
      setModalMessageDateTime('');
      setShowMessageModal(false);
    } else {
      alert('예약 시간이 현재 시간보다 빨라야 합니다.');
    }
  };

  const handleShopSelect = (value: string) => {
    if (value === 'add-new') {
      setIsAddingNewShop(true);
      setNewShopName('');
    } else {
      setNewShopName(value);
      setIsAddingNewShop(false);
    }
  };

  const handleAddNewShop = () => {
    if (newShopInput.trim() && !managedShops.includes(newShopInput.trim())) {
      const newShop = newShopInput.trim();
      setManagedShops(prev => [...prev, newShop]);
      setNewShopName(newShop);
      setShopSpecialNotes(prev => ({ ...prev, [newShop]: '' }));
      setNewShopInput('');
      setIsAddingNewShop(false);
    }
  };

  const handleCancelNewShop = () => {
    setNewShopInput('');
    setIsAddingNewShop(false);
    setNewShopName('');
  };

  const handleAddJournal = () => {
    setShowForm(true);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleReminderTimeClick = () => {
    if (!reminderDateTime) {
      setReminderDateTime(getDefaultDateTime());
    }
    setShowReminderDatePicker(!showReminderDatePicker);
  };

  const handleMessageTimeClick = () => {
    if (!ownerMessageDateTime) {
      setOwnerMessageDateTime(getDefaultDateTime());
    }
    setShowMessageDatePicker(!showMessageDatePicker);
  };

  const sortedEntries = [...entries].sort((a, b) => b.createdAt - a.createdAt);

  // 날짜별로 그룹화
  const groupedEntries = sortedEntries.reduce((groups, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, JournalEntryData[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              뒤로가기
            </Button>
            <Button 
              onClick={handleAddJournal}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              새 글 추가
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* 새 일지 추가 카드 (맨 위에 고정) */}
          <div className="bg-card border rounded-lg shadow-sm">
            {!showForm ? (
              /* 빈 상태 카드 */
              <div 
                className="p-8 text-center cursor-pointer hover:bg-muted/20 transition-colors rounded-lg"
                onClick={handleAddJournal}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-lg flex items-center justify-center">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-muted-foreground mb-2">영업일지를 추가해주세요</h3>
                <p className="text-sm text-muted-foreground">
                  위 버튼을 사용해서 첫 번째 일지를 등록해보세요
                </p>
              </div>
            ) : (
              /* 입력 폼 */
              <div className="p-4 space-y-4">
                {/* 날짜와 샵명 */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Label>날짜</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <Label>샵명</Label>
                    {isAddingNewShop ? (
                      <div className="flex items-center gap-2 flex-1">
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
                        <Button size="sm" onClick={handleAddNewShop} disabled={!newShopInput.trim()}>
                          추가
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelNewShop}>
                          취소
                        </Button>
                      </div>
                    ) : (
                      <Select value={newShopName} onValueChange={handleShopSelect}>
                        <SelectTrigger className="flex-1">
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

                {/* 특이사항 */}
                {newShopName && shopSpecialNotes[newShopName] && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <Label className="text-amber-800">특이사항</Label>
                    <div className="text-amber-700 mt-1 text-sm">
                      {shopSpecialNotes[newShopName]}
                    </div>
                  </div>
                )}

                {/* 일지 내용 섹션 - 한 줄로 배치 */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg">
                  <Label className="text-gray-800 text-sm flex-shrink-0">일지 내용</Label>
                  <Input
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="영업 활동과 생각을 자유롭게 적어보세요..."
                    className="flex-1 bg-white text-sm"
                  />
                  <Dialog open={showJournalModal} onOpenChange={setShowJournalModal}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>일지 내용 작성</DialogTitle>
                        <DialogDescription>
                          영업 활동과 생각을 자세히 작성하세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          value={modalJournalContent}
                          onChange={(e) => setModalJournalContent(e.target.value)}
                          placeholder="영업 활동과 생각을 자유롭게 적어보세요..."
                          className="min-h-[200px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowJournalModal(false)}>
                            취소
                          </Button>
                          <Button onClick={saveJournalFromModal}>
                            적용
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveJournal}
                    disabled={!newContent.trim()}
                    className="flex-shrink-0"
                  >
                    저장
                  </Button>
                </div>

                {/* 리마인드 섹션 - 한 줄로 배치 */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <Label className="text-blue-800 text-sm flex-shrink-0">리마인드</Label>
                  <Input
                    value={reminderContent}
                    onChange={(e) => setReminderContent(e.target.value)}
                    placeholder="나중에 확인할 내용..."
                    className="flex-1 bg-white text-sm"
                  />
                  
                  {/* 시계 아이콘 버튼 */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleReminderTimeClick}
                    className="flex-shrink-0 bg-white"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {reminderDateTime ? formatDateTime(reminderDateTime) : '시간'}
                  </Button>
                  
                  {/* 조건부 날짜/시간 입력 */}
                  {showReminderDatePicker && (
                    <Input
                      type="datetime-local"
                      value={reminderDateTime}
                      onChange={(e) => setReminderDateTime(e.target.value)}
                      className="w-40 bg-white text-sm"
                      onBlur={() => setShowReminderDatePicker(false)}
                      autoFocus
                    />
                  )}
                  
                  <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Bell className="w-5 h-5 text-blue-600" />
                          리마인드 설정
                        </DialogTitle>
                        <DialogDescription>
                          나중에 확인하고 싶은 내용과 알림 시간을 설정하세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>리마인드 내용</Label>
                          <Textarea
                            value={modalReminderContent}
                            onChange={(e) => setModalReminderContent(e.target.value)}
                            placeholder="나중에 확인할 내용을 자세히 입력하세요..."
                            className="mt-1 min-h-[120px] resize-none"
                            autoFocus
                          />
                        </div>
                        <div>
                          <Label>알림 시간</Label>
                          <Input
                            type="datetime-local"
                            value={modalReminderDateTime}
                            onChange={(e) => setModalReminderDateTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowReminderModal(false)}>
                            취소
                          </Button>
                          <Button 
                            onClick={saveReminderFromModal}
                            disabled={!modalReminderContent.trim() || !modalReminderDateTime}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            리마인드 설정
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveReminder}
                    disabled={!reminderContent.trim() || !reminderDateTime}
                    className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                  >
                    저장
                  </Button>
                </div>

                {/* 원장님 메시지 섹션 - 한 줄로 배치 */}
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Send className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <Label className="text-green-800 text-sm flex-shrink-0">원장님 메시지</Label>
                  <Input
                    value={ownerMessageContent}
                    onChange={(e) => setOwnerMessageContent(e.target.value)}
                    placeholder="원장님께 전달할 메시지..."
                    className="flex-1 bg-white text-sm"
                  />
                  
                  {/* 시계 아이콘 버튼 */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleMessageTimeClick}
                    className="flex-shrink-0 bg-white"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {ownerMessageDateTime ? formatDateTime(ownerMessageDateTime) : '시간'}
                  </Button>
                  
                  {/* 조건부 날짜/시간 입력 */}
                  {showMessageDatePicker && (
                    <Input
                      type="datetime-local"
                      value={ownerMessageDateTime}
                      onChange={(e) => setOwnerMessageDateTime(e.target.value)}
                      className="w-40 bg-white text-sm"
                      onBlur={() => setShowMessageDatePicker(false)}
                      autoFocus
                    />
                  )}
                  
                  <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Send className="w-5 h-5 text-green-600" />
                          원장님 메시지 보내기
                        </DialogTitle>
                        <DialogDescription>
                          원장님께 전달할 메시지를 작성하고 발송 시간을 설정하세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>메시지 내용</Label>
                          <Textarea
                            value={modalMessageContent}
                            onChange={(e) => setModalMessageContent(e.target.value)}
                            placeholder="원장님께 전달할 메시지를 자세히 입력하세요..."
                            className="mt-1 min-h-[120px] resize-none"
                            autoFocus
                          />
                        </div>
                        <div>
                          <Label>예약 발송 시간</Label>
                          <Input
                            type="datetime-local"
                            value={modalMessageDateTime}
                            onChange={(e) => setModalMessageDateTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                            취소
                          </Button>
                          <Button
                            onClick={scheduleMessageFromModal}
                            disabled={!modalMessageContent.trim() || !modalMessageDateTime}
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            예약 발송
                          </Button>
                          <Button
                            onClick={sendImmediateMessageFromModal}
                            disabled={!modalMessageContent.trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            즉시 보내기
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={scheduleOwnerMessage}
                    disabled={!ownerMessageContent.trim() || !ownerMessageDateTime}
                    className="border-green-300 text-green-700 hover:bg-green-50 flex-shrink-0"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    예약발송
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={sendImmediateMessage}
                    disabled={!ownerMessageContent.trim()}
                    className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    즉시보내기
                  </Button>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setNewContent('');
                      setReminderContent('');
                      setReminderDateTime('');
                      setOwnerMessageContent('');
                      setOwnerMessageDateTime('');
                      setShowReminderDatePicker(false);
                      setShowMessageDatePicker(false);
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 기존 일지 목록 */}
          {sortedEntries.length > 0 && (
            <div className="space-y-6">
              {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                <div key={date}>
                  {/* 날짜 구분선 */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-muted-foreground">{formatDate(date)}</div>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  {/* 해당 날짜의 일지들 */}
                  <div className="space-y-3">
                    {dateEntries.map((entry) => {
                      const parsedContent = parseJournalContent(entry.content);
                      
                      return (
                        <div 
                          key={entry.id} 
                          className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow space-y-3"
                        >
                          {/* 헤더: 시간, 샵명, 배지들 */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">{formatTime(entry.createdAt)}</span>
                            {entry.shopName && (
                              <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs text-primary">
                                {entry.shopName}
                              </span>
                            )}
                            {entry.reminder && (
                              <span className="px-1.5 py-0.5 bg-blue-100 rounded-full text-xs text-blue-600 flex items-center gap-1">
                                <Bell className="w-3 h-3" />
                              </span>
                            )}
                            {entry.ownerMessage && (
                              <span className="px-1.5 py-0.5 bg-green-100 rounded-full text-xs text-green-600 flex items-center gap-1">
                                <Send className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          
                          {/* 특이사항 */}
                          {entry.specialNotes && (
                            <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                              특이사항: {entry.specialNotes}
                            </div>
                          )}
                          
                          {/* 일지 내용 - 개선된 표시 방식 */}
                          <div className="text-sm leading-relaxed space-y-2">
                            {parsedContent.map((item, index) => (
                              <div key={index} className="flex justify-between items-start gap-3">
                                <div className="flex-1 whitespace-pre-wrap">
                                  {index > 0 && <span className="text-muted-foreground mr-2">*</span>}
                                  {item.content}
                                </div>
                                {item.timestamp && (
                                  <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                                    {item.timestamp}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* 리마인드 */}
                          {entry.reminder && (
                            <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              리마인드: {entry.reminder.content}
                            </div>
                          )}
                          
                          {/* 원장님 메시지 */}
                          {entry.ownerMessage && (
                            <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                              <Send className="w-3 h-3" />
                              원장님 메시지: {entry.ownerMessage.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
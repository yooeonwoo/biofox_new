"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { ko } from 'date-fns/locale';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return null;
  }

  const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined);

  React.useEffect(() => {
    // value prop이 외부에서 변경될 때 내부 date 상태를 업데이트합니다.
    if (value) {
      const externalDate = new Date(value);
      if (date?.getTime() !== externalDate.getTime()) {
        setDate(externalDate);
      }
    } else {
      setDate(undefined);
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    // 기존 시간 정보를 유지하거나, 시간이 없으면 현재 시간으로 설정
    const currentHour = date?.getHours() ?? new Date().getHours();
    const currentMinute = date?.getMinutes() ?? 0;
    
    selectedDate.setHours(currentHour);
    selectedDate.setMinutes(currentMinute);
    
    // ISO 문자열 전체(UTC)를 사용하여 타임존 손실을 방지
    const newDateTimeString = selectedDate.toISOString();
    setDate(selectedDate);
    onChange(newDateTimeString);
  };

  const handleTimeChange = (part: 'hour' | 'minute', valStr: string) => {
    const val = parseInt(valStr, 10);
    const newDate = date ? new Date(date) : new Date();
    
    if (part === 'hour') {
      newDate.setHours(val);
    } else {
      newDate.setMinutes(val);
    }
    
    // ISO 문자열 전체(UTC)를 사용하여 타임존 손실을 방지
    const newDateTimeString = newDate.toISOString();
    setDate(newDate);
    onChange(newDateTimeString);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const selectedHour = date ? date.getHours().toString().padStart(2, '0') : undefined;
  // 분을 5분 단위로 맞춤
  const selectedMinute = date ? (Math.round(date.getMinutes() / 5) * 5).toString().padStart(2, '0') : undefined;
  
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "시간";
    try {
        const d = new Date(dateString);
        return format(d, "M.d a h:mm", { locale: ko });
    } catch(e) {
        return "시간";
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-auto justify-start text-left font-normal h-8 bg-white gap-1.5 px-2",
            !date && "text-muted-foreground"
          )}
        >
          <Clock className="size-4" />
          {date ? formatDisplayDate(value) : <span>시간</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={ko}
        />
        <div className="p-2 border-t border-border flex items-center justify-center gap-2">
            <Select onValueChange={(val) => handleTimeChange('hour', val)} value={selectedHour}>
                <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder="시" />
                </SelectTrigger>
                <SelectContent>
                    {hours.map(h => <SelectItem key={h} value={h}>{h}시</SelectItem>)}
                </SelectContent>
            </Select>
            :
            <Select onValueChange={(val) => handleTimeChange('minute', val)} value={selectedMinute}>
                 <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder="분" />
                </SelectTrigger>
                <SelectContent>
                    {minutes.map(m => <SelectItem key={m} value={m}>{m}분</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
} 
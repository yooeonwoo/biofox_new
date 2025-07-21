'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PaymentData {
  payment_method: string
  reference?: string
  notes?: string
  paid_at?: string
}

interface CommissionPayModalProps {
  commission: any
  open: boolean
  onClose: () => void
  onSubmit: (data: PaymentData) => void
}

export function CommissionPayModal({ commission, open, onClose, onSubmit }: CommissionPayModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      payment_method: paymentMethod,
      reference,
      notes,
      paid_at: paymentDate.toISOString()
    })

    // 초기화
    setReference('')
    setNotes('')
    setPaymentMethod('bank_transfer')
    setPaymentDate(new Date())
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value)
  }

  if (!commission) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>수수료 지급 처리</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>지급 대상</Label>
            <div className="p-3 rounded-lg bg-muted">
              <div className="font-medium">{commission.kol.name}</div>
              <div className="text-sm text-muted-foreground">
                {commission.kol.email}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>지급 금액</Label>
            <div className="text-2xl font-bold">
              {formatCurrency(commission.total_commission)}
            </div>
          </div>

          {commission.kol.bank_info && (
            <div className="space-y-2">
              <Label>계좌 정보</Label>
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">은행: </span>
                  <span className="font-medium">{commission.kol.bank_info.bank_name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">계좌번호: </span>
                  <span className="font-medium">{commission.kol.bank_info.account_number}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">예금주: </span>
                  <span className="font-medium">{commission.kol.bank_info.account_holder}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>지급 방법</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">계좌이체</SelectItem>
                <SelectItem value="cash">현금</SelectItem>
                <SelectItem value="check">수표</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>지급일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(paymentDate, 'yyyy년 MM월 dd일', { locale: ko })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>참조 번호</Label>
            <Input
              placeholder="거래 번호, 수표 번호 등"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea
              placeholder="추가 메모사항"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              지급 완료
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
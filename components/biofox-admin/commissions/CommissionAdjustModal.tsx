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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface CommissionAdjustModalProps {
  commission: any
  open: boolean
  onClose: () => void
  onSubmit: (data: { adjustment_amount: number; adjustment_reason: string }) => void
}

export function CommissionAdjustModal({ commission, open, onClose, onSubmit }: CommissionAdjustModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const adjustmentAmount = parseFloat(amount) * (adjustmentType === 'subtract' ? -1 : 1)
    
    onSubmit({
      adjustment_amount: adjustmentAmount,
      adjustment_reason: reason
    })

    // 초기화
    setAmount('')
    setReason('')
    setAdjustmentType('add')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value)
  }

  if (!commission) return null

  const previewTotal = commission.total_commission + 
    (parseFloat(amount) || 0) * (adjustmentType === 'subtract' ? -1 : 1)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>수수료 조정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>KOL/OL</Label>
            <div className="p-3 rounded-lg bg-muted">
              <div className="font-medium">{commission.kol.name}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(commission.calculation_month + '-01').toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long'
                })} 정산
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>현재 수수료</Label>
            <div className="text-2xl font-bold">
              {formatCurrency(commission.total_commission)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>조정 유형</Label>
            <RadioGroup value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add">추가 (+)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subtract" id="subtract" />
                <Label htmlFor="subtract">차감 (-)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>조정 금액</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="1000"
            />
          </div>

          <div className="space-y-2">
            <Label>조정 사유 <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="조정 사유를 입력하세요"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
            />
          </div>

          {amount && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <div className="text-sm font-medium">조정 후 예상 금액</div>
              <div className="text-2xl font-bold">
                {formatCurrency(previewTotal)}
              </div>
              <div className="text-sm text-muted-foreground">
                {adjustmentType === 'add' ? '+' : '-'} {formatCurrency(parseFloat(amount) || 0)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={!amount || !reason}>
              조정 적용
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useEffect } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

interface ClinicalCase {
  id?: string
  subject_type: string
  name: string
  gender?: string
  age?: number
  treatment_item?: string
  consent_status: string
  marketing_consent?: boolean
  notes?: string
}

interface ClinicalFormModalProps {
  case?: ClinicalCase
  open: boolean
  onClose: () => void
  onSubmit: (data: ClinicalCase) => void
}

export function ClinicalFormModal({ case: clinicalCase, open, onClose, onSubmit }: ClinicalFormModalProps) {
  const [formData, setFormData] = useState<ClinicalCase>({
    subject_type: 'customer',
    name: '',
    gender: 'female',
    age: undefined,
    treatment_item: '',
    consent_status: 'no_consent',
    marketing_consent: false,
    notes: ''
  })

  useEffect(() => {
    if (clinicalCase) {
      setFormData(clinicalCase)
    } else {
      // 초기화
      setFormData({
        subject_type: 'customer',
        name: '',
        gender: 'female',
        age: undefined,
        treatment_item: '',
        consent_status: 'no_consent',
        marketing_consent: false,
        notes: ''
      })
    }
  }, [clinicalCase, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{clinicalCase ? '임상 케이스 수정' : '새 임상 케이스'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>대상 구분 <span className="text-red-500">*</span></Label>
            <RadioGroup 
              value={formData.subject_type} 
              onValueChange={(value) => setFormData({ ...formData, subject_type: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="self" id="self" />
                <Label htmlFor="self">본인</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="customer" />
                <Label htmlFor="customer">고객</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>이름 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder={formData.subject_type === 'self' ? '본인 이름' : '고객 이름'}
              />
            </div>

            <div className="space-y-2">
              <Label>치료 항목</Label>
              <Input
                value={formData.treatment_item || ''}
                onChange={(e) => setFormData({ ...formData, treatment_item: e.target.value })}
                placeholder="예: 관리 후희"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>성별</Label>
              <Select
                value={formData.gender || 'female'}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">여성</SelectItem>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>나이</Label>
              <Input
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                min="1"
                max="150"
                placeholder="숫자만 입력"
              />
            </div>
          </div>

          {formData.subject_type === 'customer' && (
            <div className="space-y-4 p-4 rounded-lg bg-muted">
              <div className="space-y-2">
                <Label>활용 동의 여부 <span className="text-red-500">*</span></Label>
                <RadioGroup 
                  value={formData.consent_status} 
                  onValueChange={(value) => setFormData({ ...formData, consent_status: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="consented" id="consented" />
                    <Label htmlFor="consented">동의함</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no_consent" id="no_consent" />
                    <Label htmlFor="no_consent">동의하지 않음</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.consent_status === 'consented' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="marketing"
                      checked={formData.marketing_consent}
                      onCheckedChange={(checked) => setFormData({ ...formData, marketing_consent: checked as boolean })}
                    />
                    <Label htmlFor="marketing">마케팅 활용 동의</Label>
                  </div>
                  <div className="p-3 rounded bg-blue-50 text-sm text-blue-700">
                    동의서를 스캔하여 업로드해주세요. 임상 케이스 생성 후 사진 관리에서 업로드 가능합니다.
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="특이사항이나 메모를 입력하세요"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              {clinicalCase ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
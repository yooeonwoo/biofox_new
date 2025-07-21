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
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'

interface DeviceSale {
  id?: string
  shop_id: string
  sale_date: string
  device_name: string
  quantity: number
  serial_numbers?: string[]
  notes?: string
}

interface DeviceFormModalProps {
  sale?: DeviceSale
  open: boolean
  onClose: () => void
  onSubmit: (data: DeviceSale) => void
}

export function DeviceFormModal({ sale, open, onClose, onSubmit }: DeviceFormModalProps) {
  const [formData, setFormData] = useState<DeviceSale>({
    shop_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    device_name: '마이크로젯',
    quantity: 1,
    serial_numbers: [],
    notes: ''
  })
  const [shops, setShops] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedShop, setSelectedShop] = useState<any>(null)
  const [newSerial, setNewSerial] = useState('')
  const [tierSimulation, setTierSimulation] = useState<any>(null)

  useEffect(() => {
    if (sale) {
      setFormData(sale)
    }
  }, [sale])

  useEffect(() => {
    fetchShops()
  }, [searchTerm])

  useEffect(() => {
    if (selectedShop && formData.quantity) {
      simulateTierChange()
    }
  }, [selectedShop, formData.quantity])

  const fetchShops = async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('profiles')
      .select(`
        id,
        name,
        shop_name,
        email,
        shop_relationships!shop_owner_id (
          parent:profiles!parent_id (
            id,
            name,
            role
          )
        )
      `)
      .eq('role', 'shop_owner')
      .eq('status', 'approved')

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,shop_name.ilike.%${searchTerm}%`)
    }

    const { data } = await query.limit(10)
    setShops(data || [])
  }

  const simulateTierChange = async () => {
    if (!selectedShop?.shop_relationships?.[0]?.parent?.id) return

    const response = await fetch('/api/devices/simulate-tier-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kol_id: selectedShop.shop_relationships[0].parent.id,
        additional_devices: formData.quantity
      })
    })

    if (response.ok) {
      const data = await response.json()
      setTierSimulation(data)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleShopSelect = (shop: any) => {
    setSelectedShop(shop)
    setFormData({ ...formData, shop_id: shop.id })
    setSearchTerm(shop.shop_name)
  }

  const addSerialNumber = () => {
    if (newSerial.trim()) {
      setFormData({
        ...formData,
        serial_numbers: [...(formData.serial_numbers || []), newSerial.trim()]
      })
      setNewSerial('')
    }
  }

  const removeSerialNumber = (index: number) => {
    setFormData({
      ...formData,
      serial_numbers: formData.serial_numbers?.filter((_, i) => i !== index)
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sale ? '기기 판매 수정' : '기기 판매 등록'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>판매일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(formData.sale_date), 'yyyy년 MM월 dd일', { locale: ko })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(formData.sale_date)}
                    onSelect={(date) => date && setFormData({
                      ...formData,
                      sale_date: date.toISOString().split('T')[0]
                    })}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>기기명</Label>
              <Input
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>판매 샵 <span className="text-red-500">*</span></Label>
            <Popover open={!selectedShop}>
              <PopoverTrigger asChild>
                <Input
                  placeholder="샵명 또는 원장님 이름으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  required
                />
              </PopoverTrigger>
              <PopoverContent className="w-full p-2" align="start">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => handleShopSelect(shop)}
                  >
                    <div className="font-medium">{shop.shop_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {shop.name} | {shop.email}
                      {shop.shop_relationships?.[0]?.parent && (
                        <Badge variant="outline" className="ml-2">
                          {shop.shop_relationships[0].parent.name} ({shop.shop_relationships[0].parent.role.toUpperCase()})
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
            {selectedShop && (
              <div className="text-sm text-muted-foreground">
                선택됨: {selectedShop.shop_name} ({selectedShop.name})
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>수량 <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              required
            />
            <p className="text-sm text-muted-foreground">
              반품은 음수로 입력하세요 (예: -1)
            </p>
          </div>

          {tierSimulation && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium">수수료 계산 미리보기</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>현재 누적:</span>
                  <span>{tierSimulation.current_state.total_devices}대 ({tierSimulation.current_state.current_tier === 'tier_5_plus' ? '5대 이상' : '1-4대'})</span>
                </div>
                <div className="flex justify-between">
                  <span>변경 후:</span>
                  <span className={tierSimulation.new_state.tier_changed ? 'font-bold text-primary' : ''}>
                    {tierSimulation.new_state.total_devices}대 ({tierSimulation.new_state.new_tier === 'tier_5_plus' ? '5대 이상' : '1-4대'})
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>예상 수수료:</span>
                  <span>{formatCurrency(Math.abs(formData.quantity) * tierSimulation.current_state.commission_per_device)}</span>
                </div>
                {tierSimulation.new_state.tier_changed && (
                  <Badge className="w-fit">티어 변경됨!</Badge>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>시리얼 번호</Label>
            <div className="flex gap-2">
              <Input
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                placeholder="시리얼 번호 입력"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSerialNumber())}
              />
              <Button type="button" onClick={addSerialNumber} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.serial_numbers && formData.serial_numbers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.serial_numbers.map((serial, index) => (
                  <Badge key={index} variant="secondary">
                    {serial}
                    <button
                      type="button"
                      onClick={() => removeSerialNumber(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>비고</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={!formData.shop_id || !formData.quantity}>
              {sale ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
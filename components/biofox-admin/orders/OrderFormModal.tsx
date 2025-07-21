'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash, 
  Calculator,
  Building,
  User,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { Order, User } from '@/types/biofox-admin';

interface OrderFormModalProps {
  order?: Order;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: OrderFormData) => void;
}

interface OrderFormData {
  shop_id: string;
  order_date: string;
  order_number?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  is_self_shop_order?: boolean;
  notes?: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
}

export function OrderFormModal({
  order,
  open,
  onClose,
  onSubmit
}: OrderFormModalProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    shop_id: '',
    order_date: format(new Date(), 'yyyy-MM-dd'),
    order_number: '',
    items: [{ product_name: '', quantity: 1, unit_price: 0 }],
    is_self_shop_order: false,
    notes: ''
  });

  const [shops, setShops] = useState<User[]>([]);
  const [selectedShop, setSelectedShop] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [commissionPreview, setCommissionPreview] = useState({
    rate: 0,
    amount: 0,
    parent: null as User | null
  });

  // 주문 수정 모드일 때 데이터 로드
  useEffect(() => {
    if (order && open) {
      setFormData({
        shop_id: order.shop_id,
        order_date: order.order_date,
        order_number: order.order_number || '',
        items: order.items?.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price
        })) || [],
        is_self_shop_order: order.is_self_shop_order,
        notes: order.notes || ''
      });
      
      if (order.shop) {
        setSelectedShop(order.shop);
        setSearchTerm(order.shop.shop_name);
      }
    }
  }, [order, open]);

  // Shop 목록 로드
  useEffect(() => {
    if (open) {
      fetchShops();
    }
  }, [open]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users?role=kol,ol,shop_owner&status=approved&limit=100');
      if (response.ok) {
        const { data } = await response.json();
        setShops(data);
      }
    } catch (error) {
      console.error('Shop 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 총 금액 계산
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    setTotalAmount(total);
  }, [formData.items]);

  // 수수료 미리보기 계산
  useEffect(() => {
    if (selectedShop) {
      calculateCommissionPreview();
    }
  }, [selectedShop, totalAmount, formData.order_date]);

  const calculateCommissionPreview = async () => {
    if (!selectedShop) return;

    // 소속 관계 조회
    try {
      const response = await fetch(`/api/relationships?shop_id=${selectedShop.id}&active_only=true`);
      if (response.ok) {
        const { data } = await response.json();
        if (data.length > 0 && data[0].parent) {
          const parent = data[0].parent;
          let rate = 0;
          
          if (parent.role === 'kol') {
            rate = parent.commission_rate || 30;
          } else if (parent.role === 'ol') {
            rate = parent.commission_rate || 20;
          }

          setCommissionPreview({
            rate,
            amount: totalAmount * (rate / 100),
            parent
          });
        } else {
          setCommissionPreview({ rate: 0, amount: 0, parent: null });
        }
      }
    } catch (error) {
      console.error('소속 관계 조회 오류:', error);
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_name: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async () => {
    if (!selectedShop || !formData.order_date || formData.items.length === 0) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    const validItems = formData.items.filter(item => 
      item.product_name && item.quantity > 0 && item.unit_price > 0
    );

    if (validItems.length === 0) {
      alert('최소 하나 이상의 유효한 상품이 필요합니다.');
      return;
    }

    await onSubmit({
      ...formData,
      shop_id: selectedShop.id,
      items: validItems,
      is_self_shop_order: selectedShop.role === 'kol' || selectedShop.role === 'ol'
    });
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? '주문 수정' : '새 주문 등록'}</DialogTitle>
          <DialogDescription>
            주문 정보를 입력하세요. 수수료는 자동으로 계산됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shop 선택 */}
          <div className="space-y-2">
            <Label htmlFor="shop">전문점 *</Label>
            <div className="relative">
              <Input
                id="shop"
                placeholder="전문점 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!e.target.value) setSelectedShop(null);
                }}
              />
              {searchTerm && filteredShops.length > 0 && !selectedShop && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredShops.map(shop => (
                    <button
                      key={shop.id}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                      onClick={() => {
                        setSelectedShop(shop);
                        setSearchTerm(shop.shop_name);
                        setFormData({ ...formData, shop_id: shop.id });
                      }}
                    >
                      <div>
                        <p className="font-medium">{shop.name}</p>
                        <p className="text-sm text-gray-500">{shop.shop_name}</p>
                      </div>
                      <Badge variant="outline">
                        {shop.role === 'kol' ? 'KOL' : shop.role === 'ol' ? 'OL' : 'Shop'}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 주문 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_date">주문일 *</Label>
              <Input
                id="order_date"
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_number">주문번호</Label>
              <Input
                id="order_number"
                placeholder="선택사항"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
              />
            </div>
          </div>

          {/* 상품 목록 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>상품 목록 *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                상품 추가
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="상품명"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="수량"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="단가"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div className="w-32 text-right font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 금액 요약 */}
          <div className="border rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between text-lg font-semibold">
              <span>총 주문금액</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            
            {selectedShop && commissionPreview.parent && (
              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>소속</span>
                  <div className="flex items-center gap-2">
                    <span>{commissionPreview.parent.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {commissionPreview.parent.role === 'kol' ? 'KOL' : 'OL'}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>수수료율</span>
                  <span>{commissionPreview.rate}%</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>예상 수수료</span>
                  <span>{formatCurrency(commissionPreview.amount)}</span>
                </div>
              </div>
            )}
            
            {selectedShop && (selectedShop.role === 'kol' || selectedShop.role === 'ol') && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  본인샵 주문으로 처리됩니다.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              placeholder="추가 메모..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedShop || totalAmount === 0}>
            {order ? '수정' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

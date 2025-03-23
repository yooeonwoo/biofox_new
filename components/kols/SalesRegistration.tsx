"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Minus, Store } from "lucide-react";

// 타입 정의
export interface IProduct {
  id: string;
  name: string;
  price: number;
}

export interface IStore {
  id: string;
  name: string;
}

export interface ISalesItem {
  product: IProduct;
  quantity: number;
}

export interface ISalesOrder {
  storeId: string;
  items: ISalesItem[];
  totalAmount: number;
}

interface ISalesRegistrationProps {
  stores: IStore[];
  products: IProduct[];
  onSubmitOrder?: (order: ISalesOrder) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SalesRegistration({
  stores,
  products,
  onSubmitOrder,
  isOpen,
  onOpenChange,
}: ISalesRegistrationProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedStore, setSelectedStore] = React.useState<string>("");
  const [selectedItems, setSelectedItems] = React.useState<ISalesItem[]>([]);
  const [processing, setProcessing] = React.useState(false);

  // 제어된 열기/닫기 상태
  const isControlled = isOpen !== undefined && onOpenChange !== undefined;
  const isDialogOpen = isControlled ? isOpen : open;
  const setIsDialogOpen = isControlled ? onOpenChange : setOpen;

  // 제품 추가
  const handleAddProduct = (product: IProduct) => {
    setSelectedItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // 제품 제거
  const handleRemoveProduct = (productId: string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
  };

  // 수량 변경
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }
    
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // 총 매출액 계산
  const totalSales = React.useMemo(() => {
    return selectedItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }, [selectedItems]);

  // 폼 초기화
  const resetForm = () => {
    setSelectedStore("");
    setSelectedItems([]);
  };

  // 다이얼로그가 닫힐 때 폼 초기화
  React.useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedStore || selectedItems.length === 0) {
      return;
    }
    
    try {
      setProcessing(true);
      
      const order: ISalesOrder = {
        storeId: selectedStore,
        items: selectedItems,
        totalAmount: totalSales,
      };
      
      if (onSubmitOrder) {
        await onSubmitOrder(order);
        toast.success("매출이 성공적으로 등록되었습니다", {
          description: `총 ${totalSales.toLocaleString()}원이 등록되었습니다.`,
        });
      } else {
        // 외부 처리기가 없을 경우 성공 메시지만 표시
        toast.success("매출 등록 완료", {
          description: "매출 정보가 저장되었습니다.",
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("매출 등록 중 오류 발생:", error);
      toast.error("매출 등록 실패", {
        description: "매출 등록 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">매출 등록</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <div className="mb-2 flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <Store className="opacity-80" size={16} strokeWidth={2} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">매출 등록</DialogTitle>
            <DialogDescription className="text-left">
              전문점을 선택하고 제품과 수량을 입력하여 매출을 등록하세요.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="store">전문점 선택</Label>
              <Select
                value={selectedStore}
                onValueChange={(value) => setSelectedStore(value)}
                required
              >
                <SelectTrigger id="store">
                  <SelectValue placeholder="전문점을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>제품 선택</Label>
              <Select onValueChange={(value) => {
                const product = products.find(p => p.id === value);
                if (product) handleAddProduct(product);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="제품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₩{product.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItems.length > 0 && (
              <div className="rounded-md border p-4 space-y-4">
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-muted-foreground">
                          ₩{item.product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t flex justify-between font-medium">
                  <p>총 매출액</p>
                  <p>₩{totalSales.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={!selectedStore || selectedItems.length === 0 || processing}
            >
              {processing ? "처리 중..." : "매출 등록하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
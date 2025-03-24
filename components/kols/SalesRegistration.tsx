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
import { Plus, Minus, Store, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  id?: string;
  storeId: string;
  storeName?: string;
  items: ISalesItem[];
  totalAmount: number;
  orderDate?: string | Date;
}

export interface ISalesRegistrationProps {
  stores: IStore[];
  products: IProduct[];
  isAdmin?: boolean; // 관리자 모드인지 여부
  onSubmitOrder?: (order: ISalesOrder) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  buttonLabel?: string;
  initialStoreId?: string; // 초기 선택 전문점 ID
}

export function SalesRegistration({
  stores,
  products,
  isAdmin = false, // 기본적으로 관리자 모드 아님 (KOL 전용 조회 모드)
  onSubmitOrder,
  isOpen,
  onOpenChange,
  buttonLabel = isAdmin ? "매출 등록" : "매출 조회",
  initialStoreId,
}: ISalesRegistrationProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedStore, setSelectedStore] = React.useState<string>(initialStoreId || "");
  const [selectedItems, setSelectedItems] = React.useState<ISalesItem[]>([]);
  const [processing, setProcessing] = React.useState(false);

  // 제어된 열기/닫기 상태
  const isControlled = isOpen !== undefined && onOpenChange !== undefined;
  const isDialogOpen = isControlled ? isOpen : open;
  const setIsDialogOpen = isControlled ? onOpenChange : setOpen;

  // 초기 전문점 ID가 변경될 때 선택된 전문점 업데이트
  React.useEffect(() => {
    if (initialStoreId) {
      setSelectedStore(initialStoreId);
    }
  }, [initialStoreId]);

  // 제품 추가 (관리자만 가능)
  const handleAddProduct = (product: IProduct) => {
    if (!isAdmin) return;
    
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

  // 제품 제거 (관리자만 가능)
  const handleRemoveProduct = (productId: string) => {
    if (!isAdmin) return;
    
    setSelectedItems((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
  };

  // 수량 변경 (관리자만 가능)
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (!isAdmin) return;
    
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

  // 폼 제출 처리 (관리자만 가능)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isAdmin || !selectedStore || selectedItems.length === 0) {
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
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            disabled={processing}
            variant="default"
          >
            {processing && <span className="loading loading-spinner mr-2"></span>}
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[800px] p-0 gap-0 bg-gray-100">
          <DialogHeader className="px-6 py-4 border-b bg-white">
            <DialogTitle className="text-xl">매출 등록</DialogTitle>
            <DialogDescription>
              전문점을 선택하고 판매한 제품과 수량을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="bg-gray-100">
            <div className="px-6 py-4">
              <div className="grid gap-6">
                {/* 전문점 선택 */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">전문점 선택</Label>
                  </div>
                  <Select
                    value={selectedStore}
                    onValueChange={setSelectedStore}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="bg-white border border-gray-200 rounded-lg h-10">
                      <SelectValue placeholder="전문점을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {stores.map((store) => (
                        <SelectItem 
                          key={store.id} 
                          value={store.id}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            <span>{store.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 제품 선택 */}
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">제품 선택</Label>
                  </div>
                  
                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-2">
                      {products.map((product) => (
                        <Button
                          key={product.id}
                          type="button"
                          variant="outline"
                          className={cn(
                            "justify-between text-sm h-auto py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50",
                            selectedItems.some(item => item.product.id === product.id) &&
                            "border-blue-500 bg-blue-50 text-blue-700"
                          )}
                          onClick={() => handleAddProduct(product)}
                        >
                          <span className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="font-normal">{product.name}</span>
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Intl.NumberFormat("ko-KR", {
                              style: "currency",
                              currency: "KRW",
                            }).format(product.price)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* 선택한 제품 목록 */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="max-h-[300px] overflow-y-auto">
                      {selectedItems.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          선택한 제품이 없습니다
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {selectedItems.map((item) => (
                            <div
                              key={item.product.id}
                              className="p-3 flex items-center justify-between hover:bg-gray-50"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{item.product.name}</span>
                                <span className="text-sm text-gray-500">
                                  {new Intl.NumberFormat("ko-KR", {
                                    style: "currency",
                                    currency: "KRW",
                                  }).format(item.product.price)} × {item.quantity} = 
                                  {new Intl.NumberFormat("ko-KR", {
                                    style: "currency",
                                    currency: "KRW",
                                  }).format(item.product.price * item.quantity)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAdmin && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 bg-white border border-gray-200 rounded-md"
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.product.id,
                                          Math.max(1, item.quantity - 1)
                                        )
                                      }
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                      type="number"
                                      min="1"
                                      className="w-16 h-8 text-center bg-white border border-gray-200 rounded-md"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleQuantityChange(
                                          item.product.id,
                                          parseInt(e.target.value) || 1
                                        )
                                      }
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 bg-white border border-gray-200 rounded-md"
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.product.id,
                                          item.quantity + 1
                                        )
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                      onClick={() => handleRemoveProduct(item.product.id)}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 총 매출액 */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium">총 매출액</span>
                    <span className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                      }).format(totalSales)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-white">
              {isAdmin && (
                <Button 
                  type="submit"
                  className="w-[120px] bg-blue-500 hover:bg-blue-600 rounded-lg"
                  disabled={processing || !selectedStore || selectedItems.length === 0}
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>등록 중...</span>
                    </div>
                  ) : (
                    "매출 등록"
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
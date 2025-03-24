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
import { Plus, Minus, Store, Eye } from "lucide-react";

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

interface ISalesRegistrationProps {
  stores: IStore[];
  products: IProduct[];
  isAdmin?: boolean; // 관리자 모드인지 여부
  onSubmitOrder?: (order: ISalesOrder) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  buttonLabel?: string;
}

export function SalesRegistration({
  stores,
  products,
  isAdmin = false, // 기본적으로 관리자 모드 아님 (KOL 전용 조회 모드)
  onSubmitOrder,
  isOpen,
  onOpenChange,
  buttonLabel = isAdmin ? "매출 등록" : "매출 조회",
}: ISalesRegistrationProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedStore, setSelectedStore] = React.useState<string>("");
  const [selectedItems, setSelectedItems] = React.useState<ISalesItem[]>([]);
  const [processing, setProcessing] = React.useState(false);

  // 제어된 열기/닫기 상태
  const isControlled = isOpen !== undefined && onOpenChange !== undefined;
  const isDialogOpen = isControlled ? isOpen : open;
  const setIsDialogOpen = isControlled ? onOpenChange : setOpen;

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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>매출 등록</DialogTitle>
            <DialogDescription>
              전문점을 선택하고 판매한 제품과 수량을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store">전문점</Label>
                <Select
                  value={selectedStore}
                  onValueChange={setSelectedStore}
                  disabled={!isAdmin}
                >
                  <SelectTrigger id="store" className="w-full">
                    <SelectValue placeholder="전문점 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem 
                        key={store.id} 
                        value={store.id}
                      >
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>제품 선택</Label>
                
                {isAdmin && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {products.map((product) => (
                      <Button
                        key={product.id}
                        type="button"
                        variant="outline"
                        className="justify-start text-sm h-auto py-2 px-3"
                        onClick={() => handleAddProduct(product)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> {product.name}
                      </Button>
                    ))}
                  </div>
                )}

                {/* 선택한 제품 목록 */}
                <div className="border rounded-md divide-y">
                  {selectedItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      선택한 제품이 없습니다.
                    </div>
                  ) : (
                    selectedItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{item.product.name}</span>
                          <span className="text-sm text-gray-500">
                            {new Intl.NumberFormat("ko-KR", {
                              style: "currency",
                              currency: "KRW",
                            }).format(item.product.price)} / 개
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-gray-700">수량:</Label>
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.product.id,
                                    Math.max(1, item.quantity - 1)
                                  )
                                }
                                disabled={!isAdmin}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            )}
                            <Input
                              type="number"
                              min="1"
                              className="w-14 h-8 text-center"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.product.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              disabled={!isAdmin}
                            />
                            {isAdmin && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.product.id,
                                    item.quantity + 1
                                  )
                                }
                                disabled={!isAdmin}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {isAdmin && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500"
                              onClick={() => handleRemoveProduct(item.product.id)}
                              disabled={!isAdmin}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>총 매출액:</span>
                  <span>
                    {new Intl.NumberFormat("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                    }).format(totalSales)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              {isAdmin && (
                <Button 
                  type="submit"
                  disabled={processing || !selectedStore || selectedItems.length === 0}
                >
                  {processing ? "등록 중..." : "매출 등록"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
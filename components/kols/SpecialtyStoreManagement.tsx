"use client";

import * as React from "react";
import { Edit, Plus, Search, Trash2, Store, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 클래스 이름 병합을 위한 유틸리티 함수
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// KOL 타입 정의
export interface IKOL {
  id: string;
  name: string;
}

// 전문점 타입 정의 (KOL 정보 추가)
export interface ISpecialtyStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  ownerName: string;
  status: "active" | "inactive";
  businessNumber?: string;
  description?: string;
  kolId: string; // KOL ID 추가
  kolName: string; // KOL 이름 추가 (화면 표시용)
}

interface ISpecialtyStoreManagementProps {
  initialStores?: ISpecialtyStore[];
  kols?: IKOL[]; // KOL 목록 추가
  onAddStore?: (store: Omit<ISpecialtyStore, "id">) => Promise<void>;
  onUpdateStore?: (store: ISpecialtyStore) => Promise<void>;
  onDeleteStore?: (id: string) => Promise<void>;
  isLoading?: boolean;
  isAdmin?: boolean; // 관리자 모드인지 여부
  title?: string; // 컴포넌트 제목 커스터마이징 옵션
}

export function SpecialtyStoreManagement({
  initialStores = [],
  kols = [],
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  isLoading = false,
  isAdmin = false, // 기본적으로 관리자 모드 아님 (KOL 전용 조회 모드)
  title = "전문점 관리",
}: ISpecialtyStoreManagementProps) {
  const [stores, setStores] = React.useState<ISpecialtyStore[]>(initialStores);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedKolId, setSelectedKolId] = React.useState<string>("all"); // 선택된 KOL ID
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [currentStore, setCurrentStore] = React.useState<ISpecialtyStore | null>(null);
  const [formData, setFormData] = React.useState<Omit<ISpecialtyStore, "id">>({
    name: "",
    address: "",
    phone: "",
    ownerName: "",
    status: "active",
    businessNumber: "",
    description: "",
    kolId: "",
    kolName: "",
  });
  const [processing, setProcessing] = React.useState(false);

  // 초기 데이터가 변경될 경우 내부 상태 업데이트
  React.useEffect(() => {
    setStores(initialStores);
  }, [initialStores]);

  // 검색 기능
  const filteredStores = React.useMemo(() => {
    return stores.filter((store) =>
      (store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.kolName.toLowerCase().includes(searchQuery.toLowerCase())) && 
      (selectedKolId && selectedKolId !== "all" ? store.kolId === selectedKolId : true)
    );
  }, [stores, searchQuery, selectedKolId]);

  // KOL별 그룹화된 스토어 목록
  const groupedStores = React.useMemo(() => {
    const groups: Record<string, ISpecialtyStore[]> = {};
    
    stores.forEach(store => {
      if (!groups[store.kolId]) {
        groups[store.kolId] = [];
      }
      groups[store.kolId].push(store);
    });
    
    return groups;
  }, [stores]);

  // KOL이 없는 전문점 목록
  const unassignedStores = React.useMemo(() => {
    return stores.filter(store => !store.kolId);
  }, [stores]);

  // 선택된 KOL 정보
  const selectedKolName = React.useMemo(() => {
    if (selectedKolId === "all") return "모든 전문점";
    if (selectedKolId === "unassigned") return "미지정 KOL";
    
    const selectedKol = kols.find(kol => kol.id === selectedKolId);
    return selectedKol?.name || "선택된 KOL";
  }, [selectedKolId, kols]);

  // 전문점 추가 (관리자만 가능)
  const handleAddStore = () => {
    if (!isAdmin) return;
    
    setCurrentStore(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      ownerName: "",
      status: "active",
      businessNumber: "",
      description: "",
      kolId: selectedKolId !== "all" && selectedKolId !== "unassigned" ? selectedKolId : "",
      kolName: selectedKolId !== "all" && selectedKolId !== "unassigned" ? 
        kols.find(kol => kol.id === selectedKolId)?.name || "" : "",
    });
    setIsDialogOpen(true);
  };

  // 특정 KOL에 전문점 추가
  const handleAddStoreToKol = (kolId: string) => {
    if (!isAdmin) return;
    
    const selectedKol = kols.find(kol => kol.id === kolId);
    
    setCurrentStore(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      ownerName: "",
      status: "active",
      businessNumber: "",
      description: "",
      kolId: kolId,
      kolName: selectedKol?.name || "",
    });
    setIsDialogOpen(true);
  };

  // 전문점 상세 조회 (KOL도 가능)
  const handleViewStore = (store: ISpecialtyStore) => {
    setCurrentStore(store);
    setIsViewDialogOpen(true);
  };

  // 전문점 편집 (관리자만 가능)
  const handleEditStore = (store: ISpecialtyStore) => {
    if (!isAdmin) return;
    
    setCurrentStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone,
      ownerName: store.ownerName,
      status: store.status,
      businessNumber: store.businessNumber || "",
      description: store.description || "",
      kolId: store.kolId,
      kolName: store.kolName,
    });
    setIsDialogOpen(true);
  };

  // 전문점 삭제 (관리자만 가능)
  const handleDeleteStore = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      setProcessing(true);
      if (onDeleteStore) {
        await onDeleteStore(id);
        toast.success("전문점이 성공적으로 삭제되었습니다.", {
          description: "전문점 목록이 업데이트되었습니다.",
        });
      } else {
        // 외부 핸들러가 없는 경우 내부 상태만 업데이트
        setStores((prev) => prev.filter((store) => store.id !== id));
      }
    } catch (error) {
      console.error("전문점 삭제 중 오류 발생:", error);
      toast.error("전문점 삭제 실패", {
        description: "전문점 삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setProcessing(false);
    }
  };

  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 상태 변경 핸들러
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" }));
  };

  // KOL 선택 핸들러
  const handleKolChange = (value: string) => {
    const selectedKol = kols.find(kol => kol.id === value);
    setFormData(prev => ({ 
      ...prev, 
      kolId: value,
      kolName: selectedKol?.name || ""
    }));
  };

  // 폼 제출 핸들러 (관리자만 가능)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    try {
      setProcessing(true);
      
      if (currentStore) {
        // 기존 전문점 수정
        const updatedStore = { ...currentStore, ...formData };
        
        if (onUpdateStore) {
          await onUpdateStore(updatedStore);
          toast.success("전문점 정보가 수정되었습니다.", {
            description: "전문점 정보가 성공적으로 업데이트되었습니다.",
          });
        } else {
          // 외부 핸들러가 없는 경우 내부 상태만 업데이트
          setStores((prev) =>
            prev.map((store) =>
              store.id === currentStore.id ? updatedStore : store
            )
          );
        }
      } else {
        // 새 전문점 추가
        if (onAddStore) {
          await onAddStore(formData);
          toast.success("새 전문점이 추가되었습니다.", {
            description: "새 전문점이 성공적으로 등록되었습니다.",
          });
        } else {
          // 외부 핸들러가 없는 경우 내부 상태만 업데이트
          const newStore: ISpecialtyStore = {
            id: Math.random().toString(36).substring(2, 9),
            ...formData,
          };
          setStores((prev) => [...prev, newStore]);
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("전문점 저장 중 오류 발생:", error);
      toast.error("전문점 저장 실패", {
        description: "전문점 저장 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setProcessing(false);
    }
  };

  // 스토어 테이블 컴포넌트
  const StoresTable = ({ stores }: { stores: ISpecialtyStore[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>주소</TableHead>
          <TableHead>연락처</TableHead>
          <TableHead>대표자</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="w-[100px]">관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stores.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              등록된 전문점이 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          stores.map((store) => (
            <TableRow key={store.id}>
              <TableCell className="font-medium">{store.name}</TableCell>
              <TableCell>{store.address}</TableCell>
              <TableCell>{store.phone}</TableCell>
              <TableCell>{store.ownerName}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    store.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  )}
                >
                  {store.status === "active" ? "활성" : "비활성"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewStore(store)}
                    title="상세 보기"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">상세 보기</span>
                  </Button>
                  
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditStore(store)}
                        disabled={processing}
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">수정</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStore(store.id)}
                        disabled={processing}
                        title="삭제"
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">삭제</span>
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  // KOL 사이드바 항목 컴포넌트
  const KolSidebarItem = ({ id, name, count }: { id: string, name: string, count: number }) => (
    <button
      className={cn(
        "w-full text-left px-4 py-2 rounded-md transition-colors flex items-center justify-between",
        selectedKolId === id 
          ? "bg-purple-100 text-purple-900 font-medium" 
          : "hover:bg-gray-100"
      )}
      onClick={() => setSelectedKolId(id)}
    >
      <span className="truncate">{name}</span>
      <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700 min-w-[1.5rem] text-center">
        {count}
      </span>
    </button>
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {isAdmin && (
          <Button onClick={handleAddStore} className="gap-1.5" disabled={isLoading || processing}>
            <Plus className="h-4 w-4" />
            전문점 추가
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="전문점 검색..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* 사이드바 + 컨텐츠 레이아웃 */}
      <div className="grid grid-cols-[250px_1fr] gap-6">
        {/* KOL 사이드바 */}
        <div className="border rounded-md p-2 space-y-1 h-[calc(100vh-250px)] overflow-y-auto">
          <KolSidebarItem 
            id="all" 
            name="모든 전문점" 
            count={stores.length} 
          />
          
          {/* KOL 목록 */}
          {kols.map(kol => {
            const kolStores = stores.filter(store => store.kolId === kol.id);
            if (kolStores.length === 0 && searchQuery.length === 0) return null;
            
            return (
              <KolSidebarItem
                key={kol.id}
                id={kol.id}
                name={kol.name}
                count={kolStores.length}
              />
            );
          })}
          
          {/* 미지정 KOL 항목 */}
          {unassignedStores.length > 0 && (
            <KolSidebarItem
              id="unassigned"
              name="미지정 KOL"
              count={unassignedStores.length}
            />
          )}
        </div>
        
        {/* 선택된 KOL의 전문점 목록 */}
        <div className="border rounded-md">
          <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">{selectedKolName}</h3>
            {isAdmin && selectedKolId !== "all" && selectedKolId !== "unassigned" && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleAddStoreToKol(selectedKolId)}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                이 KOL에 전문점 추가
              </Button>
            )}
          </div>
          
          <StoresTable 
            stores={
              selectedKolId === "all"
                ? searchQuery ? filteredStores : stores
                : selectedKolId === "unassigned"
                  ? unassignedStores.filter(store => 
                      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      store.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : filteredStores
            } 
          />
        </div>
      </div>

      {/* 전문점 상세 조회 대화상자 */}
      {currentStore && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>전문점 상세 정보</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">이름</Label>
                <div className="col-span-3">{currentStore.name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">소속 KOL</Label>
                <div className="col-span-3">{currentStore.kolName || "미지정"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">주소</Label>
                <div className="col-span-3">{currentStore.address}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">연락처</Label>
                <div className="col-span-3">{currentStore.phone}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">대표자</Label>
                <div className="col-span-3">{currentStore.ownerName}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">사업자번호</Label>
                <div className="col-span-3">{currentStore.businessNumber || "-"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">설명</Label>
                <div className="col-span-3">{currentStore.description || "-"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">상태</Label>
                <div className="col-span-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      currentStore.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    )}
                  >
                    {currentStore.status === "active" ? "활성" : "비활성"}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 전문점 추가/편집 대화상자 */}
      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {currentStore ? "전문점 정보 수정" : "새 전문점 추가"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="kolId" className="text-right">
                    소속 KOL
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={formData.kolId} 
                      onValueChange={handleKolChange}
                      required
                    >
                      <SelectTrigger id="kolId">
                        <SelectValue placeholder="KOL을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {kols.map((kol) => (
                          <SelectItem key={kol.id} value={kol.id}>{kol.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    이름
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    주소
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    연락처
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ownerName" className="text-right">
                    대표자명
                  </Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="businessNumber" className="text-right">
                    사업자번호
                  </Label>
                  <Input
                    id="businessNumber"
                    name="businessNumber"
                    value={formData.businessNumber}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    설명
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    상태
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleStatusChange}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={processing}>
                  {processing ? "처리 중..." : currentStore ? "수정" : "추가"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 
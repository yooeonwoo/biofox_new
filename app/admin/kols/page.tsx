"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface IKOL {
  id: number;
  userId: number;
  name: string;
  shopName: string;
  region: string;
  smartPlaceLink: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
  };
}

export default function KolsPage() {
  const router = useRouter();
  const [kols, setKols] = useState<IKOL[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedKol, setSelectedKol] = useState<IKOL | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    region: "",
    email: "",
    smartPlaceLink: "",
  });
  const [editData, setEditData] = useState({
    id: 0,
    name: "",
    shopName: "",
    region: "",
    smartPlaceLink: "",
    status: "active",
  });

  // KOL 목록 조회
  const fetchKols = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/kols", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API 오류 응답:", errorData);
        throw new Error(`KOL 목록을 불러오는데 실패했습니다. 상태: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Supabase 데이터 형식에 맞게 데이터 매핑
      const formattedData: IKOL[] = data.map((kol: any) => ({
        id: kol.id,
        userId: kol.user_id,
        name: kol.name,
        shopName: kol.shop_name,
        region: kol.region || "",
        smartPlaceLink: kol.smart_place_link || "",
        status: kol.status || "active",
        createdAt: kol.created_at,
        updatedAt: kol.updated_at,
      }));
      
      setKols(formattedData);
    } catch (error) {
      console.error("KOL 조회 에러:", error);
      toast.error("KOL 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKols();
  }, []);

  // 등록 모달 열기
  const handleAddKol = () => {
    setFormData({
      name: "",
      shopName: "",
      region: "",
      email: "",
      smartPlaceLink: "",
    });
    setOpen(true);
  };

  // 수정 모달 열기
  const handleEditKol = (kol: IKOL) => {
    setSelectedKol(kol);
    setEditData({
      id: kol.id,
      name: kol.name,
      shopName: kol.shopName,
      region: kol.region || "",
      smartPlaceLink: kol.smartPlaceLink || "",
      status: kol.status || "active",
    });
    setEditOpen(true);
  };

  // 삭제 모달 열기
  const handleDeleteKol = (kol: IKOL) => {
    setSelectedKol(kol);
    setDeleteConfirmOpen(true);
  };

  // KOL 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/kols", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("KOL 등록에 실패했습니다.");
      }
      
      await response.json();
      setOpen(false);
      toast.success("KOL이 등록되었습니다.");
      fetchKols();
    } catch (error) {
      console.error("KOL 등록 에러:", error);
      toast.error("KOL 등록에 실패했습니다.");
    }
  };

  // KOL 정보 수정 처리
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKol) return;
    
    try {
      const response = await fetch(`/api/kols/${selectedKol.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });
      
      if (!response.ok) {
        throw new Error("KOL 정보 수정에 실패했습니다.");
      }
      
      await response.json();
      setEditOpen(false);
      toast.success("KOL 정보가 수정되었습니다.");
      fetchKols();
    } catch (error) {
      console.error("KOL 수정 에러:", error);
      toast.error("KOL 정보 수정에 실패했습니다.");
    }
  };

  // KOL 삭제 처리
  const handleDeleteConfirm = async () => {
    if (!selectedKol) return;
    
    try {
      const response = await fetch(`/api/kols/${selectedKol.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("KOL 삭제에 실패했습니다.");
      }
      
      setDeleteConfirmOpen(false);
      toast.success("KOL이 삭제되었습니다.");
      fetchKols();
    } catch (error) {
      console.error("KOL 삭제 에러:", error);
      toast.error("KOL 삭제에 실패했습니다.");
    }
  };

  // 입력 폼 값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // KOL 추가 폼 렌더링 (수정 필요)
  const renderAddForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">원장님 성함</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="원장님 성함을 입력하세요"
            required
          />
        </div>
        <div>
          <Label htmlFor="shopName">샵 명</Label>
          <Input
            id="shopName"
            name="shopName"
            value={formData.shopName}
            onChange={handleChange}
            placeholder="샵 명을 입력하세요"
            required
          />
        </div>
        <div>
          <Label htmlFor="region">지역</Label>
          <Input
            id="region"
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="지역을 입력하세요"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="smartPlaceLink">스마트플레이스 링크</Label>
          <Input
            id="smartPlaceLink"
            name="smartPlaceLink"
            value={formData.smartPlaceLink}
            onChange={handleChange}
            placeholder="스마트플레이스 링크를 입력하세요"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "등록 중..." : "등록하기"}
        </Button>
      </DialogFooter>
    </form>
  );

  // KOL 편집 폼 렌더링 (수정 필요)
  const renderEditForm = () => (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-name">원장님 성함</Label>
          <Input
            id="edit-name"
            name="name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            placeholder="원장님 성함을 입력하세요"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-shopName">샵 명</Label>
          <Input
            id="edit-shopName"
            name="shopName"
            value={editData.shopName}
            onChange={(e) => setEditData({ ...editData, shopName: e.target.value })}
            placeholder="샵 명을 입력하세요"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-region">지역</Label>
          <Input
            id="edit-region"
            name="region"
            value={editData.region}
            onChange={(e) => setEditData({ ...editData, region: e.target.value })}
            placeholder="지역을 입력하세요"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-smartPlaceLink">스마트플레이스 링크</Label>
          <Input
            id="edit-smartPlaceLink"
            name="smartPlaceLink"
            value={editData.smartPlaceLink}
            onChange={(e) => setEditData({ ...editData, smartPlaceLink: e.target.value })}
            placeholder="스마트플레이스 링크를 입력하세요"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "업데이트 중..." : "업데이트"}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>KOL 목록</CardTitle>
            <CardDescription>전체 KOL 관리 및 정보 수정</CardDescription>
          </div>
          <Button onClick={handleAddKol}>
            <PlusCircle className="mr-2 h-4 w-4" />
            KOL 등록
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-sm text-gray-500">데이터를 불러오는 중...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>원장님 성함</TableHead>
                  <TableHead>샵 명</TableHead>
                  <TableHead>지역</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kols.map((kol) => (
                  <TableRow key={kol.id}>
                    <TableCell>{kol.id}</TableCell>
                    <TableCell>{kol.name}</TableCell>
                    <TableCell>{kol.shopName}</TableCell>
                    <TableCell>{kol.region}</TableCell>
                    <TableCell>{kol.user?.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={kol.status === "active" ? "default" : "secondary"}
                      >
                        {kol.status === "active" ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(kol.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditKol(kol)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500"
                        onClick={() => handleDeleteKol(kol)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* KOL 등록 모달 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>KOL 등록</DialogTitle>
            <DialogDescription>새로운 KOL 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>
          {renderAddForm()}
        </DialogContent>
      </Dialog>
      
      {/* KOL 수정 모달 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>KOL 정보 수정</DialogTitle>
            <DialogDescription>KOL 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          {renderEditForm()}
        </DialogContent>
      </Dialog>
      
      {/* KOL 삭제 확인 모달 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>KOL 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 KOL을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
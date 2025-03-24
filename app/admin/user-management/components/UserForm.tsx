"use client";

/**
 * 사용자 등록 폼 컴포넌트
 * 
 * 이 컴포넌트는 다음 기능을 제공합니다:
 * 1. 역할 선택 (본사관리자/KOL)
 * 2. 이메일 입력
 * 3. 이름 입력 (한국식)
 * 4. KOL 역할 선택 시 추가 정보 입력
 * 5. 사용자 등록 요청 전송
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserFormProps {
  onClose: () => void;
}

const initialFormState = {
  email: "",
  role: "",
  kolName: "",
  shopName: "",
  region: "",
  smartPlaceLink: "",
};

export default function UserForm({ onClose }: UserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
      // KOL이 아닌 경우 관련 필드 초기화
      ...(value !== "kol" && {
        kolName: "",
        shopName: "",
        region: "",
        smartPlaceLink: "",
      }),
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.email || !formData.role) {
      toast.error("이메일과 역할은 필수 입력 항목입니다.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("유효한 이메일 주소를 입력해주세요.");
      return;
    }

    // KOL 역할 선택 시 추가 필드 검증
    if (formData.role === "kol" && (!formData.kolName || !formData.shopName || !formData.region)) {
      toast.error("KOL 정보를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "사용자 등록에 실패했습니다.");
      }

      toast.success("사용자가 성공적으로 등록되었습니다.");
      resetForm();
      router.refresh();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "사용자 등록에 실패했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            이메일 *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="이메일을 입력하세요"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-medium text-gray-700">
            역할 *
          </Label>
          <Select value={formData.role} onValueChange={handleRoleChange} required>
            <SelectTrigger className="bg-white border-gray-300 font-medium text-gray-900">
              <SelectValue placeholder="역할을 선택하세요" className="text-gray-500 font-medium" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200">
              <SelectItem value="admin" className="font-medium text-gray-900 hover:bg-gray-100">
                관리자
              </SelectItem>
              <SelectItem value="kol" className="font-medium text-gray-900 hover:bg-gray-100">
                KOL
              </SelectItem>
              <SelectItem value="user" className="font-medium text-gray-900 hover:bg-gray-100">
                일반 사용자
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.role === "kol" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="kolName" className="text-sm font-medium text-gray-700">
                KOL 이름 *
              </Label>
              <Input
                id="kolName"
                name="kolName"
                placeholder="KOL 이름을 입력하세요"
                value={formData.kolName}
                onChange={handleChange}
                required
                className="bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopName" className="text-sm font-medium text-gray-700">
                매장명 *
              </Label>
              <Input
                id="shopName"
                name="shopName"
                placeholder="매장명을 입력하세요"
                value={formData.shopName}
                onChange={handleChange}
                required
                className="bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region" className="text-sm font-medium text-gray-700">
                지역 *
              </Label>
              <Input
                id="region"
                name="region"
                placeholder="지역을 입력하세요"
                value={formData.region}
                onChange={handleChange}
                required
                className="bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smartPlaceLink" className="text-sm font-medium text-gray-700">
                스마트플레이스 링크
              </Label>
              <Input
                id="smartPlaceLink"
                name="smartPlaceLink"
                placeholder="스마트플레이스 링크를 입력하세요"
                value={formData.smartPlaceLink}
                onChange={handleChange}
                className="bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="font-medium border-gray-300 hover:bg-gray-50 text-gray-600"
        >
          취소
        </Button>
        <Button 
          type="submit" 
          variant="outline"
          disabled={isLoading}
          className="font-medium bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          등록
        </Button>
      </div>
    </form>
  );
} 
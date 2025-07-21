'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2, Camera, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ClinicalCase {
  id: string
  shop?: {
    id: string
    name: string
    shop_name: string
    email: string
  }
  subject_type: string
  name: string
  gender?: string
  age?: number
  treatment_item?: string
  status: string
  consent_status: string
  total_sessions: number
  photo_count: number
  has_consent_file: boolean
  start_date: string
  created_at: string
}

interface ClinicalTableProps {
  cases: ClinicalCase[]
  loading?: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onView?: (case: ClinicalCase) => void
  onEdit?: (case: ClinicalCase) => void
  onDelete?: (case: ClinicalCase) => void
  onManagePhotos?: (case: ClinicalCase) => void
  showShopInfo?: boolean // 관리자용
}

export function ClinicalTable({
  cases,
  loading,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
  onManagePhotos,
  showShopInfo = false
}: ClinicalTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(cases.map(c => c.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(sid => sid !== id))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge>진행중</Badge>
      case 'completed':
        return <Badge className="bg-green-500">완료</Badge>
      case 'paused':
        return <Badge variant="secondary">일시중단</Badge>
      case 'cancelled':
        return <Badge variant="destructive">취소</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getConsentBadge = (consent: string) => {
    switch (consent) {
      case 'consented':
        return <Badge className="bg-green-500">동의</Badge>
      case 'no_consent':
        return <Badge variant="secondary">미동의</Badge>
      case 'pending':
        return <Badge variant="outline">보류</Badge>
      default:
        return <Badge variant="outline">{consent}</Badge>
    }
  }

  const getSubjectBadge = (type: string) => {
    return type === 'self' ? (
      <Badge variant="outline">본인</Badge>
    ) : (
      <Badge>고객</Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === cases.length && cases.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            {showShopInfo && <TableHead>샵</TableHead>}
            <TableHead>대상</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>성별/나이</TableHead>
            <TableHead>치료항목</TableHead>
            <TableHead>회차</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>동의</TableHead>
            <TableHead>시작일</TableHead>
            <TableHead className="text-center">사진</TableHead>
            <TableHead className="text-center">동의서</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showShopInfo ? 13 : 12} className="h-24 text-center">
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            cases.map((clinicalCase) => (
              <TableRow key={clinicalCase.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(clinicalCase.id)}
                    onCheckedChange={(checked) => handleSelectOne(clinicalCase.id, checked as boolean)}
                  />
                </TableCell>
                {showShopInfo && (
                  <TableCell>
                    {clinicalCase.shop ? (
                      <div>
                        <div className="font-medium">{clinicalCase.shop.shop_name}</div>
                        <div className="text-sm text-muted-foreground">{clinicalCase.shop.name}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {getSubjectBadge(clinicalCase.subject_type)}
                </TableCell>
                <TableCell className="font-medium">
                  {clinicalCase.name}
                </TableCell>
                <TableCell>
                  {clinicalCase.gender && clinicalCase.age ? (
                    <span className="text-sm">
                      {clinicalCase.gender === 'male' ? '남' : clinicalCase.gender === 'female' ? '여' : '기타'} / {clinicalCase.age}세
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {clinicalCase.treatment_item || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-center">
                  {clinicalCase.total_sessions || 0}회
                </TableCell>
                <TableCell>
                  {getStatusBadge(clinicalCase.status)}
                </TableCell>
                <TableCell>
                  {getConsentBadge(clinicalCase.consent_status)}
                </TableCell>
                <TableCell>
                  {format(new Date(clinicalCase.start_date), 'yyyy.MM.dd', { locale: ko })}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="gap-1">
                    <Camera className="h-3 w-3" />
                    {clinicalCase.photo_count}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {clinicalCase.has_consent_file ? (
                    <FileText className="h-4 w-4 text-green-600 mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(clinicalCase)}>
                        <Eye className="mr-2 h-4 w-4" />
                        상세보기
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManagePhotos?.(clinicalCase)}>
                        <Camera className="mr-2 h-4 w-4" />
                        사진 관리
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(clinicalCase)}>
                        <Edit className="mr-2 h-4 w-4" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(clinicalCase)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, Camera, X, FileText, Download, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface ClinicalPhotoModalProps {
  caseId: string | null
  caseName?: string
  consentStatus?: string
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

interface Photo {
  id: string
  session_number: number
  photo_type: string
  file_path: string
  url?: string
  created_at: string
}

export function ClinicalPhotoModal({ 
  caseId, 
  caseName,
  consentStatus,
  open, 
  onClose,
  onUpdate 
}: ClinicalPhotoModalProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeSession, setActiveSession] = useState(0)
  const [consentFile, setConsentFile] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (caseId && open) {
      fetchPhotos()
      fetchConsentFile()
    }
  }, [caseId, open])

  const fetchPhotos = async () => {
    if (!caseId) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('clinical_photos')
      .select('*')
      .eq('clinical_case_id', caseId)
      .order('session_number', { ascending: true })
      .order('photo_type', { ascending: true })

    if (error) {
      console.error('Error fetching photos:', error)
    } else {
      // URL 생성
      const photosWithUrls = await Promise.all((data || []).map(async (photo) => {
        const { data: { publicUrl } } = supabase.storage
          .from('clinical-photos')
          .getPublicUrl(photo.file_path)
        return { ...photo, url: publicUrl }
      }))
      setPhotos(photosWithUrls)
    }
    setLoading(false)
  }

  const fetchConsentFile = async () => {
    if (!caseId) return
    
    const { data, error } = await supabase
      .from('consent_files')
      .select('*')
      .eq('clinical_case_id', caseId)
      .single()

    if (data) {
      const { data: { publicUrl } } = supabase.storage
        .from('consent-files')
        .getPublicUrl(data.file_path)
      setConsentFile({ ...data, url: publicUrl })
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoType: string) => {
    const file = e.target.files?.[0]
    if (!file || !caseId) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clinical_case_id', caseId)
    formData.append('session_number', activeSession.toString())
    formData.append('photo_type', photoType)

    try {
      const response = await fetch('/api/clinical/photos', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast({
          title: '업로드 완료',
          description: '사진이 업로드되었습니다.'
        })
        fetchPhotos()
        onUpdate?.()
      } else {
        const error = await response.json()
        toast({
          title: '업로드 실패',
          description: error.error || '사진 업로드에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '업로드 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
    setUploading(false)
  }

  const handleConsentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !caseId) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clinical_case_id', caseId)

    try {
      const response = await fetch('/api/clinical/consent', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast({
          title: '업로드 완료',
          description: '동의서가 업로드되었습니다.'
        })
        fetchConsentFile()
      } else {
        const error = await response.json()
        toast({
          title: '업로드 실패',
          description: error.error || '동의서 업로드에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '업로드 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
    setUploading(false)
  }

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('정말 이 사진을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('clinical_photos')
      .delete()
      .eq('id', photo.id)

    if (!error) {
      await supabase.storage
        .from('clinical-photos')
        .remove([photo.file_path])
      
      toast({
        title: '삭제 완료',
        description: '사진이 삭제되었습니다.'
      })
      fetchPhotos()
      onUpdate?.()
    }
  }

  // 세션별로 사진 그룹화
  const photosBySession = photos.reduce((acc, photo) => {
    if (!acc[photo.session_number]) {
      acc[photo.session_number] = []
    }
    acc[photo.session_number].push(photo)
    return acc
  }, {} as Record<number, Photo[]>)

  const maxSession = Math.max(0, ...Object.keys(photosBySession).map(Number))

  const photoTypes = [
    { type: 'front', label: '정면' },
    { type: 'left_side', label: '좌측면' },
    { type: 'right_side', label: '우측면' }
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            임상 사진 관리
            {caseName && <span className="text-muted-foreground">- {caseName}</span>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photos">임상 사진</TabsTrigger>
            <TabsTrigger value="consent" disabled={consentStatus !== 'consented'}>
              동의서
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={activeSession === 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSession(0)}
              >
                Before
              </Button>
              {Array.from({ length: maxSession + 1 }, (_, i) => i + 1).map((session) => (
                <Button
                  key={session}
                  variant={activeSession === session ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveSession(session)}
                >
                  {session}회차
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSession(maxSession + 1)}
              >
                <Plus className="h-4 w-4" />
                새 회차
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {photoTypes.map(({ type, label }) => {
                const existingPhoto = photosBySession[activeSession]?.find(p => p.photo_type === type)
                
                return (
                  <Card key={type}>
                    <CardContent className="p-4">
                      <Label className="mb-2 block">{label}</Label>
                      
                      {existingPhoto ? (
                        <div className="relative group">
                          <img
                            src={existingPhoto.url}
                            alt={`${label} 사진`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleDeletePhoto(existingPhoto)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, type)}
                            disabled={uploading}
                          />
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
                            <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {uploading ? '업로드 중...' : '클릭하여 업로드'}
                            </span>
                          </div>
                        </label>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="consent" className="space-y-4">
            {consentFile ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium">{consentFile.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          업로드: {new Date(consentFile.upload_date).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(consentFile.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleConsentUpload}
                      disabled={uploading}
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-2">동의서 업로드</p>
                      <p className="text-sm text-gray-500">
                        {uploading ? '업로드 중...' : 'PDF 또는 이미지 파일 (최대 5MB)'}
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
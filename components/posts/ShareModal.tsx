'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
}

export default function ShareModal({
  isOpen,
  onClose,
  url,
  title,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: '링크가 복사되었습니다',
        description: '원하는 곳에 붙여넣기 하세요',
      })
    } catch {
      toast({
        title: '복사 실패',
        description: 'URL을 수동으로 복사해주세요',
        variant: 'destructive',
      })
    }
  }

  const shareToKakao = () => {
    try {
      // Kakao SDK 체크
      if (!window.Kakao) {
        toast({
          title: '카카오톡 공유 준비중',
          description: '잠시 후 다시 시도해주세요',
        })
        return
      }

      // SDK 초기화 체크
      if (!window.Kakao.isInitialized()) {
        toast({
          title: '카카오톡 공유 오류',
          description: 'SDK가 초기화되지 않았습니다',
          variant: 'destructive',
        })
        return
      }

      // Share 객체 체크
      if (!window.Kakao.Share || !window.Kakao.Share.sendDefault) {
        toast({
          title: '카카오톡 공유 오류',
          description: '공유 기능을 사용할 수 없습니다',
          variant: 'destructive',
        })
        return
      }

      // 공유 실행
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: '개발자 커뮤니티에서 확인해보세요',
          imageUrl: `${window.location.origin}/og-image.png`,
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
        buttons: [
          {
            title: '읽어보기',
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
        ],
      })
    } catch (error) {
      console.error('Kakao share error:', error)
      toast({
        title: '공유 실패',
        description: '카카오톡 공유 중 오류가 발생했습니다',
        variant: 'destructive',
      })
    }
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${title} - 개발자 커뮤니티`)
    const shareUrl = encodeURIComponent(url)
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      '_blank'
    )
  }

  const shareToFacebook = () => {
    const shareUrl = encodeURIComponent(url)
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      '_blank'
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">공유하기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* SNS 공유 버튼들 */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              onClick={shareToKakao}
            >
              <div className="w-10 h-10 bg-[#FEE500] rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <span className="text-xs font-medium">카카오톡</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              onClick={shareToTwitter}
            >
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">X</span>
              </div>
              <span className="text-xs font-medium">트위터</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              onClick={shareToFacebook}
            >
              <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">f</span>
              </div>
              <span className="text-xs font-medium">페이스북</span>
            </Button>
          </div>

          {/* URL 복사 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">링크 복사</p>
            <div className="flex gap-2">
              <Input
                value={url}
                readOnly
                className="border-2 border-black font-mono text-sm"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

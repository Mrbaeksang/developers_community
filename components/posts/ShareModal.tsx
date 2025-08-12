'use client'

import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { RiKakaoTalkFill } from 'react-icons/ri'
import { FaXTwitter, FaFacebookF } from 'react-icons/fa6'
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
  const [kakaoReady, setKakaoReady] = useState(false)
  const { toast } = useToast()

  // Kakao SDK 초기화 체크
  useEffect(() => {
    const checkKakaoSDK = () => {
      if (window.Kakao && window.Kakao.isInitialized()) {
        setKakaoReady(true)
      }
    }

    // 초기 체크
    checkKakaoSDK()

    // SDK 로드 대기 (최대 3초)
    const timer = setTimeout(checkKakaoSDK, 1000)
    const timer2 = setTimeout(checkKakaoSDK, 2000)
    const timer3 = setTimeout(checkKakaoSDK, 3000)

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [isOpen])

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
        // 모바일에서 카카오톡 앱으로 직접 공유
        const kakaoShareUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`
        window.open(kakaoShareUrl, '_blank')
        return
      }

      // SDK 초기화 체크
      if (!window.Kakao.isInitialized()) {
        // 초기화 시도
        const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY
        if (kakaoKey) {
          window.Kakao.init(kakaoKey)
        } else {
          // 모바일 대체 방법
          const kakaoShareUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`
          window.open(kakaoShareUrl, '_blank')
          return
        }
      }

      // 공유 실행
      if (window.Kakao.Share && window.Kakao.Share.sendDefault) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: title,
            description: 'Dev Community - 개발자들의 지식 공유 플랫폼',
            imageUrl: `${window.location.origin}/icon-512x512.png`,
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
          buttons: [
            {
              title: '게시글 보기',
              link: {
                mobileWebUrl: url,
                webUrl: url,
              },
            },
          ],
        })
      } else if (window.Kakao.Link && window.Kakao.Link.sendDefault) {
        // 구버전 SDK 대응
        window.Kakao.Link.sendDefault({
          objectType: 'feed',
          content: {
            title: title,
            description: 'Dev Community - 개발자들의 지식 공유 플랫폼',
            imageUrl: `${window.location.origin}/icon-512x512.png`,
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
          buttons: [
            {
              title: '게시글 보기',
              link: {
                mobileWebUrl: url,
                webUrl: url,
              },
            },
          ],
        })
      } else {
        // 최후의 대체 방법
        const kakaoShareUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`
        window.open(kakaoShareUrl, '_blank')
      }
    } catch (error) {
      console.error('Kakao share error:', error)
      // 에러 시 대체 URL로 시도
      const kakaoShareUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`
      window.open(kakaoShareUrl, '_blank')
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
              className="flex flex-col items-center gap-2 h-auto py-4 border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              onClick={shareToKakao}
              disabled={!kakaoReady && typeof window !== 'undefined'}
            >
              <div className="w-10 h-10 bg-[#FEE500] rounded-lg flex items-center justify-center">
                <RiKakaoTalkFill className="text-black text-2xl" />
              </div>
              <span className="text-xs font-medium">카카오톡</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              onClick={shareToTwitter}
            >
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <FaXTwitter className="text-white text-xl" />
              </div>
              <span className="text-xs font-medium">트위터</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              onClick={shareToFacebook}
            >
              <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                <FaFacebookF className="text-white text-xl" />
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

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { PostEditor } from '@/components/posts/PostEditor'

export const metadata: Metadata = {
  title: '게시글 작성',
  description: '새로운 게시글을 작성하세요',
}

export default async function WritePage() {
  const session = await auth()

  // 로그인 체크
  if (!session) {
    redirect('/signin')
  }

  return <PostEditor />
}

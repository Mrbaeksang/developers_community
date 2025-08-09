import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function BookmarksPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // 프로필 페이지의 북마크 탭으로 리다이렉트
  redirect(`/profile/${session.user.id}?tab=bookmarks`)
}

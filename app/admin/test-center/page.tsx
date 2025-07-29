import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TestCenterContent } from '@/components/admin/TestCenterContent'

export default async function TestCenterPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // 관리자 권한 확인 - 직접 구현
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  })

  if (!user || !['ADMIN', 'MANAGER'].includes(user.globalRole)) {
    redirect('/admin')
  }

  // 데이터 통계
  const [
    userCount,
    mainPostCount,
    mainCommentCount,
    communityCount,
    communityPostCount,
    tagCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.mainPost.count(),
    prisma.mainComment.count(),
    prisma.community.count(),
    prisma.communityPost.count(),
    prisma.mainTag.count(),
  ])

  const initialStats = {
    userCount,
    mainPostCount,
    mainCommentCount,
    communityCount,
    communityPostCount,
    tagCount,
  }

  return <TestCenterContent initialStats={initialStats} />
}

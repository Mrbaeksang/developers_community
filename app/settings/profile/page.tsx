import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/core/prisma'
import ProfileEditForm from '@/components/settings/ProfileEditForm'

export default async function ProfileSettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
    },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">프로필 설정</h1>
        <p className="text-muted-foreground">공개 프로필 정보를 수정합니다</p>
      </div>

      <ProfileEditForm user={user} />
    </div>
  )
}

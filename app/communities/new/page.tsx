import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import CreateCommunityForm from '@/components/communities/create-community-form'

export default async function CreateCommunityPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/communities/new')
  }

  return (
    <div className="min-h-screen bg-white">
      <CreateCommunityForm />
    </div>
  )
}

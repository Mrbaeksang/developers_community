import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import CreateCommunityForm from '@/app/communities/new/CreateCommunityForm'

export default async function CreateCommunityPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/communities/new')
  }

  return <CreateCommunityForm />
}
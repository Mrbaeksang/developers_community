'use client'

import { SessionProvider } from 'next-auth/react'
import PostDetail from './PostDetail'
import CommentSection from './CommentSection'

interface ClientPostDetailProps {
  post: any
}

export default function ClientPostDetail({ post }: ClientPostDetailProps) {
  return (
    <SessionProvider>
      <div className="space-y-8">
        <PostDetail post={post} />
        <CommentSection
          postId={post.id}
          initialComments={post.comments || []}
        />
      </div>
    </SessionProvider>
  )
}

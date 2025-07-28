import { redirect } from 'next/navigation'

export default function PostsPage() {
  // 게시글 목록은 메인 페이지에서 보여주므로 리다이렉트
  redirect('/main')
}

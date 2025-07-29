  app/page.tsx:
  - /api/main/posts?limit=10
  - /api/main/categories
  - /api/main/tags?limit=5
  - /api/main/users/active?limit=5
  - /api/main/stats

● 게시글 상세 페이지에서 사용되는 API 목록

  현재 구현된 API들:

  1. GET /api/main/posts/[id] - 게시글 상세 조회
  2. GET /api/main/posts/[id]/comments - 댓글 목록 조회
  3. POST /api/main/posts/[id]/comments - 댓글 작성
  4. PUT /api/main/comments/[id] - 댓글 수정
  5. DELETE /api/main/comments/[id] - 댓글 삭제
  6. POST /api/main/posts/[id]/like - 좋아요 토글
  7. GET /api/main/posts/[id]/like - 좋아요 상태 조회
  8. POST /api/main/posts/[id]/bookmark - 북마크 토글
  9. GET /api/main/posts/[id]/bookmark - 북마크 상태 조회
  10. GET /api/main/posts/[id]/related - 관련 게시글 추천
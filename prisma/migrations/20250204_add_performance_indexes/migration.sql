-- 성능 최적화를 위한 인덱스 추가

-- ============================================================================
-- 메인 사이트 게시글 인덱스
-- ============================================================================

-- 게시글 목록 조회 최적화 (status + 생성일 정렬)
CREATE INDEX "idx_main_posts_status_created" ON "main_posts"("status", "createdAt" DESC);

-- 카테고리별 게시글 조회 최적화
CREATE INDEX "idx_main_posts_category_status_created" ON "main_posts"("categoryId", "status", "createdAt" DESC);

-- 작성자별 게시글 조회 최적화
CREATE INDEX "idx_main_posts_author_status" ON "main_posts"("authorId", "status");

-- 조회수/좋아요/댓글수 정렬 최적화
CREATE INDEX "idx_main_posts_status_views" ON "main_posts"("status", "viewCount" DESC);
CREATE INDEX "idx_main_posts_status_likes" ON "main_posts"("status", "likeCount" DESC);
CREATE INDEX "idx_main_posts_status_comments" ON "main_posts"("status", "commentCount" DESC);

-- ============================================================================
-- 커뮤니티 게시글 인덱스
-- ============================================================================

-- 커뮤니티 게시글 목록 조회 최적화
CREATE INDEX "idx_community_posts_status_created" ON "community_posts"("status", "createdAt" DESC);

-- 커뮤니티별 게시글 조회 최적화
CREATE INDEX "idx_community_posts_community_status_created" ON "community_posts"("communityId", "status", "createdAt" DESC);

-- 카테고리별 커뮤니티 게시글 조회 최적화
CREATE INDEX "idx_community_posts_category_status_created" ON "community_posts"("categoryId", "status", "createdAt" DESC);

-- 작성자별 커뮤니티 게시글 조회 최적화
CREATE INDEX "idx_community_posts_author_status" ON "community_posts"("authorId", "status");

-- ============================================================================
-- 댓글 인덱스
-- ============================================================================

-- 게시글별 댓글 조회 최적화
CREATE INDEX "idx_main_comments_post_created" ON "main_comments"("postId", "createdAt" DESC);
CREATE INDEX "idx_community_comments_post_created" ON "community_comments"("postId", "createdAt" DESC);

-- 작성자별 댓글 조회 최적화
CREATE INDEX "idx_main_comments_author" ON "main_comments"("authorId");
CREATE INDEX "idx_community_comments_author" ON "community_comments"("authorId");

-- ============================================================================
-- 좋아요/북마크 인덱스
-- ============================================================================

-- 사용자별 좋아요 조회 최적화
CREATE INDEX "idx_main_likes_user" ON "main_likes"("userId");
CREATE INDEX "idx_community_likes_user" ON "community_likes"("userId");

-- 사용자별 북마크 조회 최적화
CREATE INDEX "idx_main_bookmarks_user" ON "main_bookmarks"("userId");
CREATE INDEX "idx_community_bookmarks_user" ON "community_bookmarks"("userId");

-- ============================================================================
-- 태그 관련 인덱스
-- ============================================================================

-- 태그별 게시글 조회 최적화
CREATE INDEX "idx_main_post_tags_tag" ON "main_post_tags"("tagId");
CREATE INDEX "idx_community_post_tags_tag" ON "community_post_tags"("tagId");

-- ============================================================================
-- 커뮤니티 멤버십 인덱스
-- ============================================================================

-- 사용자별 커뮤니티 조회 최적화
CREATE INDEX "idx_community_members_user_status" ON "community_members"("userId", "status");

-- 커뮤니티별 멤버 조회 최적화
CREATE INDEX "idx_community_members_community_status" ON "community_members"("communityId", "status");

-- ============================================================================
-- 알림 인덱스
-- ============================================================================

-- 사용자별 읽지 않은 알림 조회 최적화
CREATE INDEX "idx_notifications_user_read_created" ON "notifications"("userId", "isRead", "createdAt" DESC);

-- ============================================================================
-- 파일 인덱스
-- ============================================================================

-- 게시글별 파일 조회 최적화
CREATE INDEX "idx_files_post" ON "files"("postId");

-- 업로더별 파일 조회 최적화
CREATE INDEX "idx_files_uploader" ON "files"("uploaderId");
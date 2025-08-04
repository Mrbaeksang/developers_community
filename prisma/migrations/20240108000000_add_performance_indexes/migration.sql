-- Performance optimization indexes

-- MainPost indexes
CREATE INDEX IF NOT EXISTS "idx_mainpost_status_createdat" ON "MainPost"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_mainpost_status_viewcount" ON "MainPost"("status", "viewCount" DESC);
CREATE INDEX IF NOT EXISTS "idx_mainpost_status_likecount" ON "MainPost"("status", "likeCount" DESC);
CREATE INDEX IF NOT EXISTS "idx_mainpost_status_categoryid" ON "MainPost"("status", "categoryId");
CREATE INDEX IF NOT EXISTS "idx_mainpost_authorid_status" ON "MainPost"("authorId", "status");
CREATE INDEX IF NOT EXISTS "idx_mainpost_slug" ON "MainPost"("slug");

-- CommunityPost indexes
CREATE INDEX IF NOT EXISTS "idx_communitypost_communityid_status_createdat" ON "CommunityPost"("communityId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_communitypost_communityid_viewcount" ON "CommunityPost"("communityId", "viewCount" DESC);
CREATE INDEX IF NOT EXISTS "idx_communitypost_authorid_communityid" ON "CommunityPost"("authorId", "communityId");
CREATE INDEX IF NOT EXISTS "idx_communitypost_slug_communityid" ON "CommunityPost"("slug", "communityId");

-- Comment indexes
CREATE INDEX IF NOT EXISTS "idx_maincomment_postid_createdat" ON "MainComment"("postId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_maincomment_authorid" ON "MainComment"("authorId");
CREATE INDEX IF NOT EXISTS "idx_maincomment_parentid" ON "MainComment"("parentId");
CREATE INDEX IF NOT EXISTS "idx_communitycomment_postid_createdat" ON "CommunityComment"("postId", "createdAt" DESC);

-- Like indexes
CREATE INDEX IF NOT EXISTS "idx_mainlike_postid_userid" ON "MainLike"("postId", "userId");
CREATE INDEX IF NOT EXISTS "idx_mainlike_userid" ON "MainLike"("userId");
CREATE INDEX IF NOT EXISTS "idx_communitylike_postid_userid" ON "CommunityLike"("postId", "userId");

-- Bookmark indexes
CREATE INDEX IF NOT EXISTS "idx_mainbookmark_postid_userid" ON "MainBookmark"("postId", "userId");
CREATE INDEX IF NOT EXISTS "idx_mainbookmark_userid" ON "MainBookmark"("userId");
CREATE INDEX IF NOT EXISTS "idx_communitybookmark_postid_userid" ON "CommunityBookmark"("postId", "userId");

-- Tag indexes
CREATE INDEX IF NOT EXISTS "idx_maintag_slug" ON "MainTag"("slug");
CREATE INDEX IF NOT EXISTS "idx_maintag_postcount" ON "MainTag"("postCount" DESC);
CREATE INDEX IF NOT EXISTS "idx_mainposttag_postid_tagid" ON "MainPostTag"("postId", "tagId");
CREATE INDEX IF NOT EXISTS "idx_mainposttag_tagid" ON "MainPostTag"("tagId");

-- Community membership indexes
CREATE INDEX IF NOT EXISTS "idx_communitymembership_userid_communityid" ON "CommunityMembership"("userId", "communityId");
CREATE INDEX IF NOT EXISTS "idx_communitymembership_communityid_role" ON "CommunityMembership"("communityId", "role");

-- Session indexes for auth performance
CREATE INDEX IF NOT EXISTS "idx_session_expires" ON "Session"("expires");
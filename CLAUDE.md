# AI Code Generation Rules - DO NOT MAKE MISTAKES

## CRITICAL: Prisma null vs TypeScript undefined
```typescript
// Prisma returns: string | null
// TypeScript expects: string | undefined
// ALWAYS CONVERT: value || undefined
```

## Schema Facts (NEVER ASSUME)
### Models use Main* prefix
- MainPost, MainCategory, MainTag, MainComment (NOT Post, Category)
- CommunityPost, CommunityCategory (NOT Post, Category)

### User Relations
- user.mainPosts (NOT user.posts)
- user.mainComments (NOT user.comments)
- user.image returns null, components expect undefined

### MainTag
- Relation field: `posts` (through MainPostTag join table)
- Count field: `postCount` (Int field, not computed)
- When mapping to UI: tag.postCount → count

### Common Type Conversions
```typescript
// User → ActiveUser
{
  name: user.name || 'Unknown',      // null → default
  image: user.image || undefined,    // null → undefined
  postCount: user._count.mainPosts   // rename field
}

// MainTag → TrendingTag  
{
  count: tag.postCount  // rename: postCount → count
}
```

## PostStatus Rules
- Main site: PENDING → PUBLISHED (approval required)
- Community: instant PUBLISHED (no approval)

## File Upload Rules
- Community posts: ✅ Can upload files
- Main posts: ❌ Cannot upload files
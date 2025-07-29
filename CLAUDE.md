# AI Code Generation Rules - DO NOT MAKE MISTAKES

## 🚨 CRITICAL: Schema-First Development (From PRISMA_RULES.md)
### Before ANY Prisma Code:
1. **ALWAYS** read `prisma/schema.prisma` first
2. **NEVER** assume model names or field names
3. **VERIFY** relationship names in the schema
4. **CHECK** enum values and their exact spelling

### Workflow:
```
1. Read schema.prisma
2. Note exact model names
3. Note exact relationship names
4. Write code with verified names
5. Run type-check before proceeding
```

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

### Like/Bookmark Models
- **MainLike** (NOT mainPostLike)
- **MainBookmark** (NOT mainPostBookmark)
- Composite unique constraint: `userId_postId`

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

## NextAuth v5 Patterns
```typescript
// ❌ OLD (NextAuth v4)
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
const session = await getServerSession(authOptions)

// ✅ NEW (NextAuth v5)
import { auth } from '@/auth'
const session = await auth()
```

## PostStatus Rules
- Main site: PENDING → PUBLISHED (approval required)
- Community: instant PUBLISHED (no approval)

## File Upload Rules
- Community posts: ✅ Can upload files
- Main posts: ❌ Cannot upload files

## Next.js 15 Dynamic Routes
```typescript
// ❌ OLD (Next.js 14)
{ params }: { params: { id: string } }
const id = params.id

// ✅ NEW (Next.js 15) 
{ params }: { params: Promise<{ id: string }> }
const resolvedParams = await params
const id = resolvedParams.id
```

## Zod Error Handling
```typescript
// ❌ OLD (Zod v2)
if (error instanceof z.ZodError) {
  return { error: error.errors[0].message }
}

// ✅ NEW (Zod v3+)
if (error instanceof z.ZodError) {
  return { error: error.issues[0].message }
}
```

## 🚨 CRITICAL: Code Quality Checks
### Before EVERY Commit:
1. **ALWAYS** run `npm run format:check` before committing
2. **ALWAYS** run `npm run type-check` before pushing
3. **NEVER** bypass format checks with --no-verify

### Quality Check Commands:
```bash
npm run format:check  # Check formatting issues
npm run format        # Fix formatting issues
npm run type-check    # Check TypeScript types
npm run lint          # Check ESLint rules
```
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
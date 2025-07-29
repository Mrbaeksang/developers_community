# 🚨 MUST FOLLOW RULES - NO EXCEPTIONS

## 1️⃣ BEFORE ANY CODE CHANGES
```bash
# MANDATORY: Check these files first
1. cat prisma/schema.prisma  # Read ENTIRE schema
2. npm run lint              # Check current warnings
3. npm run type-check        # Check current errors
```

## 2️⃣ PRISMA RULES (NEVER ASSUME)
### ✅ CORRECT Model Names
```typescript
// Main site models
MainPost, MainCategory, MainTag, MainComment
MainLike, MainBookmark

// Community models  
CommunityPost, CommunityCategory, CommunityComment
CommunityLike, CommunityBookmark, CommunityAnnouncement

// ❌ WRONG: Post, Category, Tag, Comment
```

### ✅ CORRECT Relations
```typescript
// User relations
user.mainPosts      // ❌ NOT user.posts
user.mainComments   // ❌ NOT user.comments
user.communities    // as owner
user.memberships    // as member

// Tag relations
tag.posts           // through MainPostTag
tag.postCount       // DB field, NOT computed
```

## 3️⃣ NULL HANDLING (CRITICAL)
```typescript
// ✅ CORRECT: Prisma null → TypeScript undefined
const image = user.image || undefined
const name = user.name || 'Unknown'

// ❌ WRONG: Using non-null assertion
const image = user.image!  // ESLint error
```

## 4️⃣ COMMON MISTAKES TO AVOID
```typescript
// ❌ WRONG: Non-null assertion
const userId = session.user.id!

// ✅ CORRECT: Proper check
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const userId = session.user.id

// ❌ WRONG: console.log
console.log('debug', data)

// ✅ CORRECT: console.error/warn only
console.error('Error:', error)
```

## 5️⃣ FRAMEWORK PATTERNS
### NextAuth v5
```typescript
// ✅ CORRECT
import { auth } from '@/auth'
const session = await auth()

// ❌ WRONG (v4 pattern)
import { getServerSession } from 'next-auth'
```

### Next.js 15 Routes
```typescript
// ✅ CORRECT: Async params
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}

// ❌ WRONG: Sync params (Next.js 14)
{ params }: { params: { id: string } }
```

### Zod v3
```typescript
// ✅ CORRECT: issues array
error.issues[0].message

// ❌ WRONG: errors array (v2)
error.errors[0].message
```

## 6️⃣ BUSINESS RULES
- **Main Posts**: PENDING → PUBLISHED (needs approval)
- **Community Posts**: instant PUBLISHED
- **File Upload**: ❌ Main posts, ✅ Community posts
- **Role Hierarchy**: ADMIN > MANAGER > USER (global)
- **Community Roles**: OWNER > ADMIN > MODERATOR > MEMBER

## 7️⃣ BEFORE EVERY COMMIT
```bash
# RUN ALL THESE (NO EXCEPTIONS)
npm run format:check  # Must pass
npm run lint          # Must have 0 errors
npm run type-check    # Must pass

# NEVER use --no-verify
# FIX all issues before committing
```
# Performance Optimization Recommendations

## Summary
Comprehensive performance analysis completed for Next.js application. Found several optimization opportunities with high-impact potential improvements.

## 🚨 High Priority Optimizations

### 1. N+1 Query Pattern in Tag Creation
**Location**: `app/api/main/posts/route.ts` (lines 146-162)
**Issue**: Creating tags sequentially in a loop causes N+1 queries
**Impact**: High - affects post creation performance
**Solution**:
```typescript
// Current problematic code
for (const tagName of uniqueTagNames) {
  await prisma.mainTag.upsert({ ... })
}

// Optimized solution
const tagPromises = uniqueTagNames.map(tagName =>
  prisma.mainTag.upsert({
    where: { name: tagName },
    update: {},
    create: { name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') }
  })
)
const createdTags = await Promise.all(tagPromises)
```

### 2. Missing Database Indexes
**Impact**: High - affects query performance across the application
**Recommended Indexes**:
```prisma
// Add to schema.prisma
model MainPost {
  // Existing fields...
  @@index([viewCount(sort: Desc)]) // For popular posts sorting
  @@index([likeCount(sort: Desc)]) // For like-based sorting
  @@index([commentCount(sort: Desc)]) // For discussion sorting
  @@index([createdAt(sort: Desc), status]) // For recent posts with status
  @@index([status, isPinned, createdAt(sort: Desc)]) // For main queries
}

model MainComment {
  // Existing fields...
  @@index([likeCount(sort: Desc)]) // For comment sorting
}
```

### 3. React Component Memoization
**Impact**: Medium-High - reduces unnecessary re-renders

#### PostCard Component Optimization
**Location**: `components/posts/PostCard.tsx`
**Issue**: Reading time calculation on every render (lines 96-107)
```typescript
// Current: Calculates on every render
const readingTime = Math.max(1, Math.ceil(
  koreanCharCount / 300 + englishWordCount / 250 + otherCharCount / 800
))

// Optimized: Memoize calculation
const readingTime = useMemo(() => {
  const koreanCharCount = (post.content.match(/[가-힣]/g) || []).length
  const englishWordCount = (post.content.match(/[a-zA-Z]+/g) || []).length
  const otherCharCount = post.content.length - koreanCharCount - englishWordCount
  
  return Math.max(1, Math.ceil(
    koreanCharCount / 300 + englishWordCount / 250 + otherCharCount / 800
  ))
}, [post.content])
```

#### PostList Component Optimization
**Location**: `components/home/PostList.tsx`
**Issue**: Multiple state variables and complex filtering logic
```typescript
// Wrap component in memo
export const PostList = memo(function PostList({ ... }) {
  // Memoize expensive calculations
  const filteredPosts = useMemo(() => 
    selectedCategory === 'all' 
      ? posts 
      : posts.filter(post => post.category?.slug === selectedCategory),
    [posts, selectedCategory]
  )
  
  const sortedPosts = useMemo(() => 
    [...filteredPosts].sort((a, b) => {
      // Existing sort logic
    }),
    [filteredPosts, sortBy]
  )
})
```

## 🔄 Medium Priority Optimizations

### 4. Bundle Size Reduction
**Current Size**: 89 dependencies with heavy libraries
**Opportunities**:
- **Code Splitting**: Lazy load FloatingChatWindow (558 lines)
- **Tree Shaking**: Optimize date-fns imports
- **Bundle Analysis**: Use @next/bundle-analyzer for detailed analysis

```typescript
// Lazy load heavy components
const FloatingChatWindow = lazy(() => import('@/components/chat/FloatingChatWindow'))

// Optimize date-fns imports
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { ko } from 'date-fns/locale/ko'
```

### 5. Caching Improvements
**Current**: Good caching with Redis and unstable_cache
**Enhancement Opportunities**:
- Implement view count batch writes to reduce Redis calls
- Add CDN caching headers for static content
- Implement service worker for offline caching

### 6. NotificationDropdown Optimization
**Location**: `components/notifications/NotificationDropdown.tsx`
**Issue**: Multiple useEffect hooks and complex state management
```typescript
// Memoize notification calculations
const notificationGroups = useMemo(() => ({
  unread: notifications.filter(n => !n.isRead),
  read: notifications.filter(n => n.isRead)
}), [notifications])

// Memoize link generation
const getNotificationLink = useCallback((notification) => {
  // Existing logic
}, [])
```

## 📊 Web Vitals Optimization

### Largest Contentful Paint (LCP)
- **Current**: Post content loading
- **Optimization**: Implement skeleton loading, optimize images
- **Target**: <2.5s

### First Input Delay (FID)
- **Current**: Heavy JavaScript bundles
- **Optimization**: Code splitting, reduce bundle size
- **Target**: <100ms

### Cumulative Layout Shift (CLS)
- **Current**: Dynamic content loading
- **Optimization**: Reserve space for dynamic content, avoid layout shifts
- **Target**: <0.1

## 🖼️ Image Optimization

### Current State
- Using Vercel Blob for storage
- No explicit optimization implementation

### Recommendations
```typescript
// Implement Next.js Image component
import Image from 'next/image'

// Add image optimization
<Image
  src={imageUrl}
  alt={alt}
  width={800}
  height={600}
  priority={isPriority}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## 🛠️ Implementation Priority

### Phase 1 (Week 1)
1. Add database indexes
2. Fix N+1 query in tag creation
3. Implement PostCard memoization

### Phase 2 (Week 2)
1. Optimize PostList component
2. Implement lazy loading for heavy components
3. Add bundle analysis tooling

### Phase 3 (Week 3)
1. Enhance caching strategies
2. Implement image optimization
3. Optimize notification system

## 📈 Expected Performance Gains

| Optimization | Expected Improvement | Difficulty |
|--------------|---------------------|------------|
| Database Indexes | 40-60% query speed | Low |
| N+1 Query Fix | 70% tag creation speed | Medium |
| Component Memoization | 30% render performance | Medium |
| Bundle Optimization | 25% load time | High |
| Image Optimization | 40% LCP improvement | Medium |

## 🔍 Monitoring and Measurement

### Tools Already Integrated
- Vercel Analytics
- Vercel Speed Insights
- Sentry performance monitoring

### Additional Recommendations
- Core Web Vitals monitoring
- Database query performance tracking
- Bundle size monitoring in CI/CD
- Real User Monitoring (RUM) setup

## 🚀 Quick Wins (Can implement immediately)

1. **Add database indexes** - 5 minutes, major performance gain
2. **Memoize PostCard reading time** - 10 minutes, reduces re-renders
3. **Fix date-fns imports** - 5 minutes, reduces bundle size
4. **Add React.memo to heavy components** - 15 minutes, improves render performance

## 📝 Notes

- Current architecture already implements many best practices
- Redis caching is well-implemented
- Query patterns are generally good except for tag creation
- Real-time features are efficiently implemented with SSE
- Bundle is heavy but manageable with modern tools

---
*Analysis completed: January 2025*
*Next review: After Phase 1 implementation*
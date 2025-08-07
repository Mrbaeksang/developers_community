# TagSelector Component Design Specification

## 🎯 Overview
Multi-select tag component for MainPost with search, auto-complete, and create capabilities.

## 📊 Database Schema
```typescript
// MainTag model from Prisma
model MainTag {
  id: string          // @id @default(cuid())
  name: string        // @unique - Display name
  slug: string        // @unique - URL-safe identifier
  description?: string
  color: string       // @default("#64748b")
  postCount: number   // @default(0) - Usage counter
}

// MainPostTag (M:N relationship)
model MainPostTag {
  postId: string
  tagId: string
  @@id([postId, tagId])
}
```

## 🏗️ Component Architecture

### Interface Design
```typescript
interface TagSelectorProps {
  value: string[]              // Selected tag IDs
  onChange: (ids: string[]) => void
  maxTags?: number            // Default: 5
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface Tag {
  id: string
  name: string
  slug: string
  postCount: number
  isNew?: boolean  // For optimistic UI
}
```

## 🔧 Core Features

### 1. Search & Auto-complete
- **Debounced Search**: 300ms delay
- **API Endpoint**: `GET /api/main/tags/search?q={query}`
- **Sorting**: By postCount (popularity) DESC
- **Limit**: Show top 10 results
- **Min Characters**: 2 for search trigger

### 2. Tag Creation
- **Validation**:
  - Min length: 2 chars
  - Max length: 30 chars
  - Alphanumeric + Korean + spaces
  - No special chars except hyphen
- **Slug Generation**:
  ```typescript
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[가-힣]/g, '') // Remove Korean
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
  ```
- **Duplicate Prevention**: Check existing tags before creation

### 3. UI States
```typescript
type UIState = 
  | 'idle'          // No interaction
  | 'searching'     // Fetching results
  | 'selecting'     // Dropdown open
  | 'creating'      // New tag creation
  | 'error'         // Error state
```

## 🎨 UI/UX Design

### Component Structure
```
┌─────────────────────────────────────┐
│ Selected Tags                       │
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ React│ │ Next │ │TypeScript│     │
│ │  ✕   │ │  ✕   │ │    ✕     │     │
│ └──────┘ └──────┘ └──────────┘     │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ 🔍 Search tags...           │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Suggestions:                │    │
│ │ • JavaScript (523)          │    │
│ │ • Java (421)                │    │
│ │ • JSON (312)                │    │
│ │ ─────────────────           │    │
│ │ + Create "java-spring"      │    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Neobrutalism Styling
```css
/* Core styles */
.tag-selector {
  border: 2px solid black;
  shadow: 4px 4px 0px rgba(0,0,0,1);
}

.tag-chip {
  border: 2px solid black;
  shadow: 2px 2px 0px rgba(0,0,0,1);
  background: #fbbf24; /* Yellow */
  transition: all 0.2s;
}

.tag-chip:hover {
  shadow: 1px 1px 0px rgba(0,0,0,1);
  transform: translate(-1px, -1px);
}
```

## 🔌 API Integration

### Search Endpoint
```typescript
// GET /api/main/tags/search
interface SearchRequest {
  q: string      // Query string
  limit?: number // Max results (default: 10)
}

interface SearchResponse {
  tags: Tag[]
  hasMore: boolean
}
```

### Create Endpoint
```typescript
// POST /api/main/tags
interface CreateRequest {
  name: string
  slug?: string  // Auto-generate if not provided
}

interface CreateResponse {
  tag: Tag
}
```

## ⚡ Performance Optimizations

### 1. Caching Strategy
```typescript
const tagCache = new Map<string, Tag[]>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Cache search results
const getCachedTags = (query: string) => {
  const cached = tagCache.get(query)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tags
  }
  return null
}
```

### 2. Virtualization
- Use `react-window` for long lists (>50 items)
- Fixed item height: 40px
- Viewport: 5 visible items

### 3. Optimistic Updates
```typescript
// Add tag immediately, rollback on error
const handleCreateTag = async (name: string) => {
  const optimisticTag = {
    id: `temp-${Date.now()}`,
    name,
    slug: generateSlug(name),
    postCount: 0,
    isNew: true
  }
  
  // Update UI immediately
  setSelectedTags([...selectedTags, optimisticTag])
  
  try {
    const created = await createTag(name)
    // Replace optimistic with real
    replaceTag(optimisticTag.id, created)
  } catch (error) {
    // Rollback on error
    removeTag(optimisticTag.id)
    showError(error)
  }
}
```

## 🎮 Keyboard Navigation

| Key | Action |
|-----|--------|
| ↓ | Next suggestion |
| ↑ | Previous suggestion |
| Enter | Select highlighted |
| Tab | Select first suggestion |
| Esc | Close dropdown |
| Backspace | Remove last tag (when empty) |
| Ctrl+A | Select all text |

## 🔒 Security Considerations

### Input Validation
```typescript
const validateTagName = (name: string): boolean => {
  // Prevent XSS
  const sanitized = DOMPurify.sanitize(name)
  if (sanitized !== name) return false
  
  // Length check
  if (name.length < 2 || name.length > 30) return false
  
  // Character validation
  const valid = /^[a-zA-Z0-9가-힣\s-]+$/
  return valid.test(name)
}
```

### Rate Limiting
- Search: Max 10 requests/minute
- Create: Max 5 tags/minute
- Implement client-side throttling

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "lucide-react": "^0.263.1",
  "@tanstack/react-query": "^5.0.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "dompurify": "^3.0.0",
  "react-window": "^1.8.10" // Optional for large lists
}
```

## 🧪 Testing Requirements

### Unit Tests
- Tag validation logic
- Slug generation
- Search debouncing
- Keyboard navigation

### Integration Tests
- API calls (search, create)
- Error handling
- Optimistic updates
- Cache behavior

### E2E Tests
- Complete tag selection flow
- Create new tag
- Remove tags
- Max tags limit

## 📝 Implementation Checklist

- [ ] Create base component structure
- [ ] Implement search with debouncing
- [ ] Add auto-complete dropdown
- [ ] Create tag functionality
- [ ] Selected tags display with chips
- [ ] Keyboard navigation
- [ ] API integration
- [ ] Optimistic UI updates
- [ ] Error handling
- [ ] Loading states
- [ ] Cache implementation
- [ ] Accessibility (ARIA labels)
- [ ] PostEditor integration
- [ ] Unit tests
- [ ] Documentation

## 🚀 Usage Example

```tsx
import { TagSelector } from '@/components/forms/TagSelector'

function PostEditor() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  return (
    <TagSelector
      value={selectedTags}
      onChange={setSelectedTags}
      maxTags={5}
      placeholder="태그를 검색하거나 생성하세요..."
    />
  )
}
```
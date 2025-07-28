# Project-Specific Instructions for Claude Code

## 🔍 MANDATORY: Always Check Schema First
- **BEFORE writing any Prisma queries**, ALWAYS read `prisma/schema.prisma`
- **NEVER assume** model names or relationships
- This project uses prefixed models: `MainPost`, `MainCategory`, `MainTag`, `MainComment` (not `Post`, `Category`, etc.)

## 📁 Project Structure
- Main site models: `Main*` prefix (MainPost, MainCategory, etc.)
- Community models: `Community*` prefix (CommunityPost, CommunityCategory, etc.)
- User relationships: `mainPosts`, `mainComments` (not `posts`, `comments`)

## ✅ Code Review Checklist
1. Read schema.prisma before any database operations
2. Verify model names match exactly
3. Check relationship names in the schema
4. Run `npm run type-check` before committing

## 🛠️ Development Commands
- `npm run type-check` - Run TypeScript checks
- `npm run lint` - Run ESLint
- `npm run db:studio` - Open Prisma Studio
- `npm run db:push` - Push schema changes
- `npm run db:seed` - Seed database

## 🎯 Project Context
- Next.js 15 with App Router
- Prisma ORM with PostgreSQL
- TypeScript strict mode
- Separate models for main site vs community features
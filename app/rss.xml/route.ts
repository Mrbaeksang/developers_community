import { NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'

export async function GET() {
  try {
    // 최근 메인 게시글과 커뮤니티 게시글 가져오기
    const [mainPosts, communityPosts] = await Promise.all([
      prisma.mainPost.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          author: { select: { name: true, email: true } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.communityPost.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          author: { select: { name: true, email: true } },
          community: { select: { name: true, slug: true } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    // 모든 게시글을 날짜순으로 정렬
    const allPosts = [
      ...mainPosts.map((post) => ({
        title: post.title,
        link: `https://devcom.kr/main/posts/${post.id}`,
        description: post.excerpt || post.content.substring(0, 200) + '...',
        pubDate: post.createdAt.toISOString(),
        author: post.author.name || post.author.email || 'Anonymous',
        category: post.category?.name || 'Uncategorized',
        type: 'main',
      })),
      ...communityPosts.map((post) => ({
        title: post.title,
        link: `https://devcom.kr/communities/${post.community.slug}/posts/${post.id}`,
        description: post.content.substring(0, 200) + '...',
        pubDate: post.createdAt.toISOString(),
        author: post.author.name || post.author.email || 'Anonymous',
        category: post.category?.name || post.community.name,
        type: 'community',
      })),
    ]
      .sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      )
      .slice(0, 30) // 최신 30개만

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevCom - 개발자 커뮤니티</title>
    <link>https://devcom.kr</link>
    <description>개발자들을 위한 Q&A 및 커뮤니티 플랫폼</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
    <atom:link href="https://devcom.kr/rss.xml" rel="self" type="application/rss+xml"/>
    ${allPosts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${post.link}</link>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.pubDate).toUTCString()}</pubDate>
      <author><![CDATA[${post.author}]]></author>
      <category><![CDATA[${post.category}]]></category>
      <guid isPermaLink="true">${post.link}</guid>
    </item>`
      )
      .join('')}
  </channel>
</rss>`

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('RSS generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkGlobalRole } from '@/lib/auth-helpers'
import { faker } from '@faker-js/faker'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const roleError = await checkGlobalRole(session.user.id, [
      'ADMIN',
      'MANAGER',
    ])
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 403 })
    }

    const { count = 20 } = await request.json()

    const techTags = [
      { name: 'Python', color: '#3776ab' },
      { name: 'Java', color: '#007396' },
      { name: 'CSS', color: '#1572b6' },
      { name: 'HTML', color: '#e34c26' },
      { name: 'Vue.js', color: '#4fc08d' },
      { name: 'Angular', color: '#dd0031' },
      { name: 'Django', color: '#092e20' },
      { name: 'Spring', color: '#6db33f' },
      { name: 'Docker', color: '#2496ed' },
      { name: 'Kubernetes', color: '#326ce5' },
      { name: 'AWS', color: '#ff9900' },
      { name: 'Azure', color: '#0078d4' },
      { name: 'MongoDB', color: '#47a248' },
      { name: 'PostgreSQL', color: '#4169e1' },
      { name: 'MySQL', color: '#4479a1' },
      { name: 'Redis', color: '#dc382d' },
      { name: 'GraphQL', color: '#e10098' },
      { name: 'REST API', color: '#008000' },
      { name: 'Git', color: '#f05032' },
      { name: 'DevOps', color: '#ff6900' },
    ]

    const tags = []
    const selectedTags = faker.helpers.arrayElements(techTags, {
      min: count,
      max: count,
    })

    for (const tagData of selectedTags) {
      const slug = faker.helpers.slugify(tagData.name).toLowerCase()

      // 중복 체크
      const existing = await prisma.mainTag.findUnique({ where: { slug } })
      if (!existing) {
        const tag = await prisma.mainTag.create({
          data: {
            name: tagData.name,
            slug,
            color: tagData.color,
          },
        })
        tags.push(tag)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${tags.length}개의 태그가 생성되었습니다.`,
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
      })),
    })
  } catch (error) {
    console.error('Failed to create tags:', error)
    return NextResponse.json(
      { error: '태그 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkSlugSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = checkSlugSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { slug } = validation.data

    const existingCommunity = await prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    })

    return NextResponse.json({
      available: !existingCommunity,
    })
  } catch (error) {
    console.error('Failed to check slug:', error)
    return NextResponse.json(
      { error: '슬러그 확인에 실패했습니다.' },
      { status: 500 }
    )
  }
}
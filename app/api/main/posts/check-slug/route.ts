import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { handleError, throwValidationError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug) {
      throw throwValidationError('Slug is required')
    }

    // Check if slug exists in database
    const existingPost = await prisma.mainPost.findUnique({
      where: { slug },
      select: { id: true },
    })

    return NextResponse.json({
      success: true,
      exists: !!existingPost,
    })
  } catch (error) {
    return handleError(error)
  }
}

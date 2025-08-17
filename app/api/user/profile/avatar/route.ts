import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import { handleError, ApiError } from '@/lib/api/errors'

const updateAvatarSchema = z.object({
  imageUrl: z.string().url().nullable().optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new ApiError('AUTHENTICATION_ERROR', 401, 'Unauthorized')
    }

    const body = await req.json()
    const validated = updateAvatarSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: validated.imageUrl || null,
      },
      select: {
        id: true,
        image: true,
        name: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    return handleError(error)
  }
}

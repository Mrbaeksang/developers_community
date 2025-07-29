import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkGlobalRole } from '@/lib/auth-helpers'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const roleError = await checkGlobalRole(session.user.id, ['ADMIN'])
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 403 })
    }

    // 시드 스크립트 실행
    try {
      const { stdout, stderr } = await execAsync('npm run seed')

      if (stderr && !stderr.includes('Prisma schema loaded')) {
        console.error('Seed script error:', stderr)
        return NextResponse.json(
          { error: '시드 데이터 생성 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '기본 시드 데이터가 성공적으로 생성되었습니다.',
        output: stdout,
      })
    } catch (error) {
      console.error('Failed to run seed script:', error)
      return NextResponse.json(
        { error: '시드 스크립트 실행에 실패했습니다.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Failed to seed database:', error)
    return NextResponse.json(
      { error: '시드 데이터 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

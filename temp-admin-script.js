// 임시로 사용자를 ADMIN으로 변경하는 스크립트
// 개발자 도구에서 실행하거나 별도 스크립트로 실행

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function makeUserAdmin() {
  try {
    // 첫 번째 사용자를 ADMIN으로 변경
    const users = await prisma.user.findMany()
    console.log('현재 사용자들:', users)

    if (users.length > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: users[0].id },
        data: { globalRole: 'ADMIN' },
      })
      console.log('ADMIN으로 변경된 사용자:', updatedUser)
    }
  } catch (error) {
    console.error('에러:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeUserAdmin()

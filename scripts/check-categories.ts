import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCategories() {
  try {
    const categories = await prisma.mainCategory.findMany()
    console.log('Available categories:')
    categories.forEach((cat) => {
      console.log(`- ${cat.name}: ${cat.id} (slug: ${cat.slug})`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCategories()

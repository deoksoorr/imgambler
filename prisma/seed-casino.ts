import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 기존 데이터 삭제
  await prisma.casino.deleteMany({})

  // Casino 데이터 추가
  const casinos = [
    {
      name: "Bet365 Casino",
      imageUrl: "https://cdn.bet365.com/bet365/bet365-logo.png",
      safetyLevel: "VERY HIGH",
      link: "https://www.bet365.com",
      type: "best",
      order: 1
    },
    {
      name: "888 Casino",
      imageUrl: "https://www.888casino.com/assets/images/logo.png",
      safetyLevel: "HIGH",
      link: "https://www.888casino.com",
      type: "best",
      order: 2
    },
    {
      name: "LeoVegas",
      imageUrl: "https://www.leovegas.com/assets/images/logo.png",
      safetyLevel: "HIGH",
      link: "https://www.leovegas.com",
      type: "new",
      order: 3
    },
    {
      name: "Mr Green",
      imageUrl: "https://www.mrgreen.com/assets/images/logo.png",
      safetyLevel: "HIGH",
      link: "https://www.mrgreen.com",
      type: "new",
      order: 4
    }
  ]

  for (const casino of casinos) {
    await prisma.casino.create({
      data: casino
    })
  }

  console.log('Casino seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
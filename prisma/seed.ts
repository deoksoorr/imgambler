import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function randomKey(length = 12) {
  return Math.random().toString(36).substring(2, 2 + length)
}

async function main() {
  // 사용자 생성
  const user = await prisma.user.upsert({
    where: { email: 'a2381016@gmail.com' },
    update: {},
    create: {
      email: 'a2381016@gmail.com',
      name: 'Admin User',
      role: 'ADMIN',
      isAdmin: true,
    },
  })

  // 카테고리 생성
  const categories = [
    {
      name: 'GAMBLING SECTION',
      description: 'General gambling discussions and related topics',
      boards: [
        { name: 'General Gambling Discussion', slug: 'general-gambling-discussion' },
        { name: 'Complaints Discussion', slug: 'complaints-discussion' },
        { name: 'Responsible Gambling', slug: 'responsible-gambling' },
        { name: 'Competitions', slug: 'competitions' },
      ],
    },
    {
      name: 'ONLINE CASINOS',
      description: 'Online casino related discussions',
      boards: [
        { name: 'Casinos', slug: 'casinos' },
        { name: 'Bonuses and Promotions', slug: 'bonuses-and-promotions' },
      ],
    },
    {
      name: 'ONLINE CASINO GAMES',
      description: 'Casino games and providers discussion',
      boards: [
        { name: 'Slots', slug: 'slots' },
        { name: 'Other Casino Games', slug: 'other-casino-games' },
        { name: 'Game Providers', slug: 'game-providers' },
      ],
    },
    {
      name: 'OFF TOPIC',
      description: 'General discussions and other topics',
      boards: [
        { name: 'Polls', slug: 'polls' },
        { name: 'General Discussion', slug: 'general-discussion' },
        { name: 'Sports and Sports Betting', slug: 'sports-and-betting' },
        { name: 'Feedback and Suggestions', slug: 'feedback-and-suggestions' },
      ],
    },
  ]

  // 카테고리와 게시판 생성
  for (const categoryData of categories) {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        description: categoryData.description,
      },
    })

    for (const boardData of categoryData.boards) {
      const board = await prisma.board.create({
        data: {
          name: boardData.name,
          slug: boardData.slug,
          description: `${boardData.name} board`,
          categoryId: category.id,
        },
      })

      // 각 게시판에 5개의 더미 게시글 생성
      for (let i = 1; i <= 5; i++) {
        await prisma.post.create({
          data: {
            postKey: uuidv4(),
            title: `${boardData.name} - Sample Post ${i}`,
            content: `This is a sample post ${i} for ${boardData.name}. This post contains some example content to demonstrate the board's functionality.`,
            userCode: user.id,
            boardId: board.id,
            isPinned: i === 1, // 첫 번째 게시글은 고정
            isNotice: i === 2, // 두 번째 게시글은 공지
          },
        })
      }
    }
  }

  // 메인 슬라이드 더미 데이터 생성
  const banners = [
    {
      type: 'image',
      category: 'MAIN',
      fileUrl: '/banners/banner1.jpg',
      slogan: 'Welcome to Bali Board',
      buttonText: 'Learn More',
      buttonLink: '/about',
      order: 1,
    },
    {
      type: 'image',
      category: 'MAIN',
      fileUrl: '/banners/banner2.jpg',
      slogan: 'Join Our Community',
      buttonText: 'Sign Up',
      buttonLink: '/signup',
      order: 2,
    },
    {
      type: 'image',
      category: 'MAIN',
      fileUrl: '/banners/banner3.jpg',
      slogan: 'Latest Updates',
      buttonText: 'View Updates',
      buttonLink: '/updates',
      order: 3,
    },
    {
      type: 'image',
      category: 'MAIN',
      fileUrl: '/banners/banner4.jpg',
      slogan: 'Special Offers',
      buttonText: 'Check Offers',
      buttonLink: '/offers',
      order: 4,
    },
  ]

  for (const bannerData of banners) {
    await prisma.banner.create({
      data: bannerData,
    })
  }

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
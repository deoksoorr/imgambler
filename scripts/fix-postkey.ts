import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  // postKey가 null이거나 빈 문자열인 게시글 모두 찾기
  const posts = await prisma.post.findMany() as any[]
  let updated = 0
  for (const post of posts) {
    if (!post.postKey) {
      const postKey = nanoid(10)
      await prisma.post.update({ where: { id: post.id }, data: { postKey } } as any)
      console.log(`게시글 ID ${post.id} → postKey: ${postKey}`)
      updated++
    }
  }
  if (updated === 0) {
    console.log('모든 게시글에 postKey가 이미 존재합니다.')
  }
}

main().finally(() => prisma.$disconnect()) 
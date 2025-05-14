import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // ← 로그 보기 싫으면 삭제해도 됨
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
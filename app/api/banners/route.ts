import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET: 전체 배너 목록 조회
export async function GET() {
  const banners = await prisma.banner.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(banners)
}

// POST: 새 배너 생성
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await req.json()
  try {
    const banner = await prisma.banner.create({ data })
    return NextResponse.json(banner)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
} 
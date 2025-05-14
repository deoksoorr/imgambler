import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { intervalMs } = await req.json()
  if (typeof intervalMs === 'number' && intervalMs >= 1000) {
    try {
      await prisma.bannerConfig.upsert({
        where: { key: 'slideSpeed' },
        update: { value: String(intervalMs) },
        create: { key: 'slideSpeed', value: String(intervalMs) }
      })
      return NextResponse.json({ success: true, intervalMs })
    } catch (error) {
      console.error('BannerConfig upsert error:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
}

export async function GET() {
  try {
    const config = await prisma.bannerConfig.findUnique({ where: { key: 'slideSpeed' } })
    return NextResponse.json({ intervalMs: config ? Number(config.value) : 4000 })
  } catch (e) {
    return NextResponse.json({ intervalMs: 4000 })
  }
} 
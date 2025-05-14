import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 현재 슬라이드 속도 반환
export async function GET() {
  const config = await prisma.bannerConfig.findUnique({ where: { key: 'casino_slide_speed' } });
  return NextResponse.json({ intervalMs: config ? Number(config.value) : 4000 });
}

// POST: 슬라이드 속도 저장
export async function POST(req: Request) {
  const { intervalMs } = await req.json();
  await prisma.bannerConfig.upsert({
    where: { key: 'casino_slide_speed' },
    update: { value: String(intervalMs) },
    create: { key: 'casino_slide_speed', value: String(intervalMs) },
  });
  return NextResponse.json({ success: true });
} 
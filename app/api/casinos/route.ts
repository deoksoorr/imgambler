import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const casinos = await prisma.casino.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(casinos);
}

export async function POST(req: NextRequest) {
  const { name, imageUrl, safetyLevel, link, type, order } = await req.json();
  const casino = await prisma.casino.create({
    data: { name, imageUrl, safetyLevel, link, type, order: Number(order) },
  });
  return NextResponse.json(casino);
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { name, imageUrl, safetyLevel, link, type, order } = await req.json();
  const casino = await prisma.casino.update({
    where: { id: Number(id) },
    data: { name, imageUrl, safetyLevel, link, type, order: Number(order) },
  });
  return NextResponse.json(casino);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.casino.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
} 
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH: 배너 수정
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await req.json()
  try {
    // order 값이 string으로 올 경우 number로 변환
    if (data.order) data.order = Number(data.order)
    const banner = await prisma.banner.update({
      where: { id: Number(id) },
      data,
    })
    return NextResponse.json(banner)
  } catch (error) {
    console.error('Banner PATCH error:', error, { id, data })
    return NextResponse.json({ error: 'Failed to update banner', detail: String(error) }, { status: 500 })
  }
}

// DELETE: 배너 삭제
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.banner.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Banner DELETE error:', error, { id })
    return NextResponse.json({ error: 'Failed to delete banner', detail: String(error) }, { status: 500 })
  }
} 
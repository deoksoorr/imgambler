import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ADMIN_EMAILS = ['deoksoo.kim@gmail.com', 'a2381016@gmail.com']

// 게시판 생성
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name, description, categoryId } = await request.json()
  if (!name || !categoryId) return NextResponse.json({ error: 'Name and categoryId are required' }, { status: 400 })
  
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const board = await prisma.board.create({ 
    data: { 
      name, 
      description, 
      categoryId,
      slug 
    } 
  })
  return NextResponse.json(board)
}

// 게시판 삭제
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'Board id required' }, { status: 400 })
  await prisma.board.delete({ where: { id } })
  return NextResponse.json({ ok: true })
} 
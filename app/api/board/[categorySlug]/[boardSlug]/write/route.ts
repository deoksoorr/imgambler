import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'
import { nanoid } from 'nanoid'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'

export async function POST(req: NextRequest, { params }: { params: { categorySlug: string, boardSlug: string } }) {
  try {
    const session = await getServerSession(authOptions)
    console.log('API session:', session)
    console.log('API params:', params)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }
    const { title, content, imageUrl } = await req.json()
    // 카테고리 찾기
    const category = await prisma.category.findFirst({
      where: { name: params.categorySlug.toUpperCase().replace(/-/g, ' ') }
    })
    console.log('API category:', category)
    if (!category) return NextResponse.json({ error: '카테고리 없음' }, { status: 404 })

    // 게시판 찾기
    const board = await prisma.board.findFirst({
      where: { slug: params.boardSlug, categoryId: category.id }
    })
    console.log('API board:', board)
    if (!board) return NextResponse.json({ error: '게시판 없음' }, { status: 404 })

    // 게시글 생성
    const post = await prisma.post.create({
      data: {
        postKey: nanoid(12),
        title,
        content,
        imageUrl,
        userCode: session.user.email,
        boardId: board.id,
      }
    })
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '글 작성 실패', detail: String(error) }, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params
  const id = parseInt(resolvedParams.id, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'asc' },
    })
    console.log('comments:', comments)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('댓글 조회 중 오류 발생:', error)
    return NextResponse.json({ error: '댓글을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const resolvedParams = await params
  const id = parseInt(resolvedParams.id, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
  }

  try {
    const { content, parentId } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    }

    const data: any = {
      content,
      author: session.user.name || '익명',
      userEmail: session.user.email,
      postId: id,
    }
    if (parentId !== undefined) {
      data.parentId = parentId
    }
    const comment = await prisma.comment.create({ data })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('댓글 작성 중 오류 발생:', error)
    return NextResponse.json({ error: '댓글 작성에 실패했습니다.' }, { status: 500 })
  }
} 